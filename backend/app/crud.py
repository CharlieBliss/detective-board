from collections import defaultdict
import uuid
from typing import Optional, List, Dict, Set
from uuid import UUID
from sqlalchemy import select, delete, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Node, Thread, thread_node_links, BoardMeta
from app.schemas import (
    NodeCreate,
    NodeUpdate,
    NodeResponse,
    ThreadCreate,
    ThreadUpdate,
    ThreadResponse,
    BoardStateResponse,
    BulkImportPayload,
)


async def get_all_nodes(db: AsyncSession) -> List[Node]:
    result = await db.execute(select(Node).order_by(Node.title))
    return list(result.scalars().all())

async def get_node_by_id(db: AsyncSession, node_id: UUID) -> Optional[Node]:
    result = await db.execute(select(Node).where(Node.id == node_id))
    return result.scalar_one_or_none()

async def create_node(
    db: AsyncSession, node_in: NodeCreate, user_name: Optional[str] = None
) -> Node:
    node = Node(
        id=node_in.id or uuid.uuid4(),
        title=node_in.title,
        type=node_in.type,
        description=node_in.description,
        image_url=node_in.image_url,
        last_edited_by=user_name,
    )
    db.add(node)
    await db.commit()
    await db.refresh(node)
    return node

async def update_node(
    db: AsyncSession, node: Node, node_in: NodeUpdate, user_name: Optional[str] = None
) -> Node:
    update_data = node_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(node, key, value)
    if user_name:
        node.last_edited_by = user_name
    await db.commit()
    await db.refresh(node)
    return node

async def delete_node(db: AsyncSession, node: Node) -> None:
    await db.execute(
        delete(thread_node_links).where(thread_node_links.c.node_id == node.id)
    )
    await db.delete(node)
    await db.commit()


async def get_thread_connected_nodes(db: AsyncSession, thread_id: UUID) -> List[UUID]:
    result = await db.execute(
        select(thread_node_links.c.node_id).where(
            thread_node_links.c.thread_id == thread_id
        )
    )
    return list(result.scalars().all())

async def get_thread_by_id(db: AsyncSession, thread_id: UUID) -> Optional[Thread]:
    result = await db.execute(select(Thread).where(Thread.id == thread_id))
    return result.scalar_one_or_none()

async def create_thread(
    db: AsyncSession, thread_in: ThreadCreate, user_name: Optional[str] = None
) -> ThreadResponse:
    thread_id = thread_in.id or uuid.uuid4()
    thread = Thread(
        id=thread_id,
        title=thread_in.title,
        description=thread_in.description,
        last_edited_by=user_name,
    )
    db.add(thread)
    await db.flush()

    # Link valid nodes
    connected: List[UUID] = []
    if thread_in.connected_nodes:
        # Deduplicate while preserving valid nodes
        unique_nodes = list(dict.fromkeys(thread_in.connected_nodes))
        res = await db.execute(select(Node.id).where(Node.id.in_(unique_nodes)))
        valid_node_ids = set(res.scalars().all())

        link_values = [
            {"thread_id": thread_id, "node_id": nid}
            for nid in unique_nodes
            if nid in valid_node_ids
        ]
        if link_values:
            await db.execute(insert(thread_node_links).values(link_values))
        connected = [nid for nid in unique_nodes if nid in valid_node_ids]

    await db.commit()
    await db.refresh(thread)
    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        description=thread.description,
        connected_nodes=connected,
        last_edited_by=thread.last_edited_by,
    )

async def update_thread(
    db: AsyncSession,
    thread: Thread,
    thread_in: ThreadUpdate,
    user_name: Optional[str] = None,
) -> ThreadResponse:
    update_data = thread_in.model_dump(exclude_unset=True)
    if "title" in update_data and update_data["title"] is not None:
        thread.title = update_data["title"]
    if "description" in update_data:
        thread.description = update_data["description"]
    if user_name:
        thread.last_edited_by = user_name

    connected_nodes: List[UUID] = []
    if thread_in.connected_nodes is not None:
        # Delete existing links for this thread
        await db.execute(
            delete(thread_node_links).where(thread_node_links.c.thread_id == thread.id)
        )
        unique_nodes = list(dict.fromkeys(thread_in.connected_nodes))
        if unique_nodes:
            res = await db.execute(select(Node.id).where(Node.id.in_(unique_nodes)))
            valid_node_ids = set(res.scalars().all())
            link_values = [
                {"thread_id": thread.id, "node_id": nid}
                for nid in unique_nodes
                if nid in valid_node_ids
            ]
            if link_values:
                await db.execute(insert(thread_node_links).values(link_values))
            connected_nodes = [nid for nid in unique_nodes if nid in valid_node_ids]
    else:
        connected_nodes = await get_thread_connected_nodes(db, thread.id)

    await db.commit()
    await db.refresh(thread)
    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        description=thread.description,
        connected_nodes=connected_nodes,
        last_edited_by=thread.last_edited_by,
    )

async def delete_thread(db: AsyncSession, thread: Thread) -> None:
    # Explicit delete of links (in case cascade isn't enforced by sqlite in tests)
    await db.execute(
        delete(thread_node_links).where(thread_node_links.c.thread_id == thread.id)
    )
    await db.delete(thread)
    await db.commit()

async def get_or_create_board_meta(db: AsyncSession) -> BoardMeta:
    result = await db.execute(select(BoardMeta).where(BoardMeta.id == "default"))
    meta = result.scalar_one_or_none()
    if not meta:
        meta = BoardMeta(id="default", title="CASE FILE: THE CRAZY WALL")
        db.add(meta)
        await db.commit()
        await db.refresh(meta)
    return meta

async def update_board_title(
    db: AsyncSession, title: str, user_name: Optional[str] = None
) -> BoardStateResponse:
    meta = await get_or_create_board_meta(db)
    meta.title = title.strip()
    if user_name:
        meta.last_edited_by = user_name
    await db.commit()
    await db.refresh(meta)
    return await get_board_state(db)

async def create_new_empty_board(
    db: AsyncSession, title: Optional[str] = None, user_name: Optional[str] = None
) -> BoardStateResponse:
    # Atomic transaction: clear all links, threads, nodes, and reset board meta
    async with db.begin_nested():
        await db.execute(delete(thread_node_links))
        await db.execute(delete(Thread))
        await db.execute(delete(Node))

        meta_res = await db.execute(select(BoardMeta).where(BoardMeta.id == "default"))
        meta = meta_res.scalar_one_or_none()
        if not meta:
            meta = BoardMeta(id="default")
            db.add(meta)
        meta.title = (title or "NEW INVESTIGATION CASE").strip()
        if user_name:
            meta.last_edited_by = user_name

    await db.commit()
    return BoardStateResponse(
        title=meta.title,
        last_edited_by=meta.last_edited_by,
        nodes=[],
        threads=[],
    )

async def get_board_state(db: AsyncSession) -> BoardStateResponse:
    meta = await get_or_create_board_meta(db)
    nodes = await get_all_nodes(db)
    threads_result = await db.execute(select(Thread).order_by(Thread.title))
    threads = list(threads_result.scalars().all())

    # Fetch all links
    links_result = await db.execute(select(thread_node_links))
    links_map: Dict[UUID, List[UUID]] = defaultdict(list)
    for tid, nid in links_result:
        links_map[tid].append(nid)

    nodes_response = [NodeResponse.model_validate(n) for n in nodes]
    threads_response = [
        ThreadResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            connected_nodes=links_map.get(t.id, []),
            last_edited_by=t.last_edited_by,
        )
        for t in threads
    ]

    return BoardStateResponse(
        title=meta.title,
        last_edited_by=meta.last_edited_by,
        nodes=nodes_response,
        threads=threads_response,
    )


async def bulk_import_board(
    db: AsyncSession, payload: BulkImportPayload, user_name: Optional[str] = None
) -> Dict[str, int]:
    # Single database transaction to prevent partial commits
    async with db.begin_nested():
        # 0. Update board title if provided in import payload
        if payload.title:
            meta_res = await db.execute(select(BoardMeta).where(BoardMeta.id == "default"))
            meta = meta_res.scalar_one_or_none()
            if not meta:
                meta = BoardMeta(id="default")
                db.add(meta)
            meta.title = payload.title.strip()
            if user_name:
                meta.last_edited_by = user_name

        # 1. Fetch existing nodes
        all_nodes_result = await db.execute(select(Node))

        node_map: Dict[UUID, Node] = {n.id: n for n in all_nodes_result.scalars().all()}

        # 2. Upsert nodes
        nodes_imported = 0
        for item in payload.nodes:
            editor = user_name or item.last_edited_by
            if item.id and item.id in node_map:
                node = node_map[item.id]
                node.title = item.title
                node.type = item.type
                node.description = item.description
                node.image_url = item.image_url
                if editor:
                    node.last_edited_by = editor
            else:
                new_id = item.id or uuid.uuid4()
                node = Node(
                    id=new_id,
                    title=item.title,
                    type=item.type,
                    description=item.description,
                    image_url=item.image_url,
                    last_edited_by=editor,
                )
                db.add(node)
                node_map[new_id] = node
            nodes_imported += 1

        await db.flush()

        # 3. Fetch existing threads
        all_threads_result = await db.execute(select(Thread))
        thread_map: Dict[UUID, Thread] = {
            t.id: t for t in all_threads_result.scalars().all()
        }

        # 4. Upsert threads and rebuild links
        threads_imported = 0
        affected_thread_ids: List[UUID] = []
        new_links: List[Dict[str, UUID]] = []

        for t_item in payload.threads:
            editor = user_name or t_item.last_edited_by
            if t_item.id and t_item.id in thread_map:
                thread = thread_map[t_item.id]
                thread.title = t_item.title
                thread.description = t_item.description
                if editor:
                    thread.last_edited_by = editor
                t_id = thread.id
            else:
                new_t_id = t_item.id or uuid.uuid4()
                thread = Thread(
                    id=new_t_id,
                    title=t_item.title,
                    description=t_item.description,
                    last_edited_by=editor,
                )
                db.add(thread)
                thread_map[new_t_id] = thread
                t_id = new_t_id

            affected_thread_ids.append(t_id)
            for nid in dict.fromkeys(t_item.connected_nodes):
                if nid in node_map:
                    new_links.append({"thread_id": t_id, "node_id": nid})

            threads_imported += 1

        await db.flush()

        # 5. Rebuild junction links for all affected threads
        if affected_thread_ids:
            await db.execute(
                delete(thread_node_links).where(
                    thread_node_links.c.thread_id.in_(affected_thread_ids)
                )
            )
        if new_links:
            await db.execute(insert(thread_node_links).values(new_links))

    await db.commit()
    return {"nodes_imported": nodes_imported, "threads_imported": threads_imported}

