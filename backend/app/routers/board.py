from typing import Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    BoardStateResponse,
    BulkImportPayload,
    ImportResponse,
    BoardUpdate,
    BoardCreateNew,
)
from app import crud

router = APIRouter(prefix="/board", tags=["board"])

@router.get("", response_model=BoardStateResponse)
async def get_board(db: AsyncSession = Depends(get_db)):
    """Retrieve full aggregated board state including title, nodes, and threads."""
    return await crud.get_board_state(db)

@router.put("", response_model=BoardStateResponse)
@router.patch("", response_model=BoardStateResponse)
async def update_board(
    board_in: BoardUpdate,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    """Update board name / title."""
    return await crud.update_board_title(db, title=board_in.title, user_name=x_user_name)

@router.post("/new", response_model=BoardStateResponse)
async def create_new_board(
    board_in: Optional[BoardCreateNew] = None,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    """Clear existing board and create a new empty board with an optional title."""
    title = board_in.title if board_in and board_in.title else "NEW INVESTIGATION CASE"
    return await crud.create_new_empty_board(db, title=title, user_name=x_user_name)

@router.delete("", response_model=BoardStateResponse)
async def clear_board(
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    """Clear all evidence and threads from the board, resetting it to an empty board."""
    return await crud.create_new_empty_board(db, title="NEW INVESTIGATION CASE", user_name=x_user_name)

@router.post("/import", response_model=ImportResponse)
async def import_board(
    payload: BulkImportPayload,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk import nodes and threads with upsert logic and rebuilding of junction links.
    Executed in a single database transaction.
    """
    result = await crud.bulk_import_board(db, payload, user_name=x_user_name)
    return ImportResponse(
        message="Board data imported successfully",
        nodes_imported=result["nodes_imported"],
        threads_imported=result["threads_imported"],
    )
