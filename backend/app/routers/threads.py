from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import ThreadCreate, ThreadUpdate, ThreadResponse
from app import crud

router = APIRouter(prefix="/threads", tags=["threads"])

@router.post("", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(
    thread_in: ThreadCreate,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_thread(db, thread_in, user_name=x_user_name)

@router.put("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: UUID,
    thread_in: ThreadUpdate,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    thread = await crud.get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread with id {thread_id} not found",
        )
    return await crud.update_thread(db, thread, thread_in, user_name=x_user_name)

@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    thread = await crud.get_thread_by_id(db, thread_id)
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread with id {thread_id} not found",
        )
    await crud.delete_thread(db, thread)
    return None
