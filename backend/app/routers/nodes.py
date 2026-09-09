from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import NodeCreate, NodeUpdate, NodeResponse
from app import crud

router = APIRouter(prefix="/nodes", tags=["nodes"])

@router.post("", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    node_in: NodeCreate,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_node(db, node_in, user_name=x_user_name)

@router.put("/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: UUID,
    node_in: NodeUpdate,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    node = await crud.get_node_by_id(db, node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node with id {node_id} not found",
        )
    return await crud.update_node(db, node, node_in, user_name=x_user_name)

@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    node = await crud.get_node_by_id(db, node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node with id {node_id} not found",
        )
    await crud.delete_node(db, node)
    return None
