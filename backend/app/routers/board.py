from typing import Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import BoardStateResponse, BulkImportPayload, ImportResponse
from app import crud

router = APIRouter(prefix="/board", tags=["board"])

@router.get("", response_model=BoardStateResponse)
async def get_board(db: AsyncSession = Depends(get_db)):
    """Retrieve full aggregated board state including nodes and threads with connected node IDs."""
    return await crud.get_board_state(db)

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
