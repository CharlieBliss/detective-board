import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_empty_board(client: AsyncClient):
    response = await client.get("/api/board")
    assert response.status_code == 200
    data = response.json()
    assert data["nodes"] == []
    assert data["threads"] == []

async def test_create_node_with_user(client: AsyncClient):
    payload = {
        "title": "Arthur Pendelton",
        "type": "person",
        "description": "Prime suspect seen at docks.",
        "image_url": "https://example.com/suspect.jpg",
    }
    response = await client.post(
        "/api/nodes",
        json=payload,
        headers={"X-User-Name": "Detective Miller"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Arthur Pendelton"
    assert data["type"] == "person"
    assert data["last_edited_by"] == "Detective Miller"
    assert "id" in data

    # Verify in board
    board_res = await client.get("/api/board")
    assert len(board_res.json()["nodes"]) == 1

async def test_create_thread_connecting_multiple_nodes(client: AsyncClient):
    # Create 3 nodes (person, place, concept)
    n1 = (await client.post("/api/nodes", json={"title": "Dr. Vance", "type": "person"})).json()
    n2 = (await client.post("/api/nodes", json={"title": "Abandoned Warehouse", "type": "place"})).json()
    n3 = (await client.post("/api/nodes", json={"title": "Midnight Smuggling Ring", "type": "concept"})).json()

    # Create thread connecting all 3 nodes (hyperedge)
    thread_payload = {
        "title": "The Docks Conspiracy",
        "description": "Vance was caught meeting smugglers at the warehouse.",
        "connected_nodes": [n1["id"], n2["id"], n3["id"]],
    }
    response = await client.post(
        "/api/threads",
        json=thread_payload,
        headers={"X-User-Name": "Inspector Clouseau"},
    )
    assert response.status_code == 201
    t_data = response.json()
    assert t_data["title"] == "The Docks Conspiracy"
    assert t_data["last_edited_by"] == "Inspector Clouseau"
    assert len(t_data["connected_nodes"]) == 3
    assert set(t_data["connected_nodes"]) == {n1["id"], n2["id"], n3["id"]}

    # Verify board state
    board_res = await client.get("/api/board")
    b_data = board_res.json()
    assert len(b_data["nodes"]) >= 3
    assert len(b_data["threads"]) == 1
    assert set(b_data["threads"][0]["connected_nodes"]) == {n1["id"], n2["id"], n3["id"]}

async def test_bulk_import_upsert(client: AsyncClient):
    node_id_1 = "11111111-1111-1111-1111-111111111111"
    node_id_2 = "22222222-2222-2222-2222-222222222222"
    thread_id = "33333333-3333-3333-3333-333333333333"

    import_payload = {
        "nodes": [
            {
                "id": node_id_1,
                "title": "Victor Grey",
                "type": "person",
                "description": "Corrupt banker.",
            },
            {
                "id": node_id_2,
                "title": "Safe Deposit Vault",
                "type": "place",
                "description": "Subterranean vault.",
            },
        ],
        "threads": [
            {
                "id": thread_id,
                "title": "Laundering Scheme",
                "description": "Grey hides offshore ledger in the vault.",
                "connected_nodes": [node_id_1, node_id_2],
            }
        ],
    }

    import_res = await client.post(
        "/api/board/import",
        json=import_payload,
        headers={"X-User-Name": "Officer Davis"},
    )
    assert import_res.status_code == 200
    assert import_res.json()["nodes_imported"] == 2
    assert import_res.json()["threads_imported"] == 1

    # Verify updated board
    board_res = await client.get("/api/board")
    b_data = board_res.json()
    node_titles = {n["title"] for n in b_data["nodes"]}
    assert "Victor Grey" in node_titles
    assert "Safe Deposit Vault" in node_titles

    # Now perform an update via import (upsert)
    import_payload_2 = {
        "nodes": [
            {
                "id": node_id_1,
                "title": "Victor Grey (Arrested)",
                "type": "person",
                "description": "Captured in safehouse.",
            }
        ],
        "threads": [
            {
                "id": thread_id,
                "title": "Laundering Scheme - SOLVED",
                "description": "Case closed.",
                "connected_nodes": [node_id_1],
            }
        ],
    }
    import_res_2 = await client.post(
        "/api/board/import",
        json=import_payload_2,
        headers={"X-User-Name": "Chief Gordon"},
    )
    assert import_res_2.status_code == 200

    board_res_2 = await client.get("/api/board")
    b_data_2 = board_res_2.json()
    updated_node = next(n for n in b_data_2["nodes"] if n["id"] == node_id_1)
    assert updated_node["title"] == "Victor Grey (Arrested)"
    assert updated_node["last_edited_by"] == "Chief Gordon"

    updated_thread = next(t for t in b_data_2["threads"] if t["id"] == thread_id)
    assert updated_thread["title"] == "Laundering Scheme - SOLVED"
    assert updated_thread["connected_nodes"] == [node_id_1]

async def test_update_and_delete_node(client: AsyncClient):
    node = (await client.post("/api/nodes", json={"title": "Motive Note", "type": "concept"})).json()
    node_id = node["id"]

    # Update
    upd_res = await client.put(
        f"/api/nodes/{node_id}",
        json={"title": "Blackmail Note", "description": "Demanding $50k"},
        headers={"X-User-Name": "Detective Conan"},
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["title"] == "Blackmail Note"
    assert upd_res.json()["last_edited_by"] == "Detective Conan"

    # Delete
    del_res = await client.delete(f"/api/nodes/{node_id}")
    assert del_res.status_code == 204

    # Verify not in board
    board_res = await client.get("/api/board")
    assert not any(n["id"] == node_id for n in board_res.json()["nodes"])

async def test_update_and_delete_thread(client: AsyncClient):
    n1 = (await client.post("/api/nodes", json={"title": "Node A", "type": "person"})).json()
    n2 = (await client.post("/api/nodes", json={"title": "Node B", "type": "place"})).json()
    thread = (await client.post("/api/threads", json={"title": "Link AB", "connected_nodes": [n1["id"]]})).json()
    thread_id = thread["id"]

    # Update connected nodes
    upd = await client.put(
        f"/api/threads/{thread_id}",
        json={"title": "Link AB updated", "connected_nodes": [n1["id"], n2["id"]]},
        headers={"X-User-Name": "Sherlock"},
    )
    assert upd.status_code == 200
    assert set(upd.json()["connected_nodes"]) == {n1["id"], n2["id"]}
    assert upd.json()["last_edited_by"] == "Sherlock"

    # Delete thread
    del_res = await client.delete(f"/api/threads/{thread_id}")
    assert del_res.status_code == 204

    # Nodes should still exist
    board_res = await client.get("/api/board")
    assert any(n["id"] == n1["id"] for n in board_res.json()["nodes"])

