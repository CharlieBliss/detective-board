from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models import NodeType

class NodeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    type: NodeType
    description: Optional[str] = None
    image_url: Optional[str] = None

class NodeCreate(NodeBase):
    id: Optional[UUID] = None

class NodeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[NodeType] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class NodeResponse(NodeBase):
    id: UUID
    last_edited_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ThreadBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class ThreadCreate(ThreadBase):
    id: Optional[UUID] = None
    connected_nodes: List[UUID] = Field(default_factory=list)

class ThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    connected_nodes: Optional[List[UUID]] = None

class ThreadResponse(ThreadBase):
    id: UUID
    connected_nodes: List[UUID] = Field(default_factory=list)
    last_edited_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BoardStateResponse(BaseModel):
    nodes: List[NodeResponse]
    threads: List[ThreadResponse]

class ImportNodeItem(BaseModel):
    id: Optional[UUID] = None
    title: str
    type: NodeType
    description: Optional[str] = None
    image_url: Optional[str] = None
    last_edited_by: Optional[str] = None

class ImportThreadItem(BaseModel):
    id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    connected_nodes: List[UUID] = Field(default_factory=list)
    last_edited_by: Optional[str] = None

class BulkImportPayload(BaseModel):
    nodes: List[ImportNodeItem] = Field(default_factory=list)
    threads: List[ImportThreadItem] = Field(default_factory=list)

class ImportResponse(BaseModel):
    message: str
    nodes_imported: int
    threads_imported: int
