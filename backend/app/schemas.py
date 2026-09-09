import uuid
from uuid import UUID
from typing import Optional, List, Any, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models import NodeType

def to_uuid(val: Any) -> Optional[UUID]:
    if val is None:
        return None
    if isinstance(val, UUID):
        return val
    s = str(val).strip()
    if not s:
        return None
    try:
        return UUID(s)
    except (ValueError, AttributeError):
        # Deterministically map non-UUID strings (e.g. "node_1", "suspect-a", "1") to UUIDv5
        return uuid.uuid5(uuid.NAMESPACE_DNS, s)

def normalize_node_type(val: Any) -> NodeType:
    if isinstance(val, NodeType):
        return val
    if not val:
        return NodeType.concept
    s = str(val).strip().lower()
    if s in ("person", "suspect", "witness", "victim", "individual", "who", "people"):
        return NodeType.person
    if s in ("place", "location", "scene", "crime_scene", "where", "site", "address"):
        return NodeType.place
    return NodeType.concept

class NodeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    type: NodeType
    description: Optional[str] = None
    image_url: Optional[str] = None

class NodeCreate(BaseModel):
    id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=255)
    type: NodeType = NodeType.concept
    description: Optional[str] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("id", mode="before")
    @classmethod
    def validate_id(cls, v: Any) -> Optional[UUID]:
        return to_uuid(v)

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, v: Any) -> NodeType:
        return normalize_node_type(v)

class NodeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[NodeType] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("type", mode="before")
    @classmethod
    def validate_type(cls, v: Any) -> Optional[NodeType]:
        if v is None:
            return None
        return normalize_node_type(v)

class NodeResponse(NodeBase):
    id: UUID
    last_edited_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ThreadBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class ThreadCreate(BaseModel):
    id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    connected_nodes: List[UUID] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")

    @field_validator("id", mode="before")
    @classmethod
    def validate_id(cls, v: Any) -> Optional[UUID]:
        return to_uuid(v)

    @field_validator("connected_nodes", mode="before")
    @classmethod
    def validate_connected_nodes(cls, v: Any) -> List[UUID]:
        if not v:
            return []
        if not isinstance(v, list):
            v = [v]
        res: List[UUID] = []
        for item in v:
            uid = to_uuid(item)
            if uid:
                res.append(uid)
        return res

class ThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    connected_nodes: Optional[List[UUID]] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("connected_nodes", mode="before")
    @classmethod
    def validate_connected_nodes(cls, v: Any) -> Optional[List[UUID]]:
        if v is None:
            return None
        if not isinstance(v, list):
            v = [v]
        res: List[UUID] = []
        for item in v:
            uid = to_uuid(item)
            if uid:
                res.append(uid)
        return res

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
    title: str = "Untitled Evidence"
    type: NodeType = NodeType.concept
    description: Optional[str] = None
    image_url: Optional[str] = None
    last_edited_by: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def preprocess_node(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        raw_id = data.get("id")
        parsed_id = to_uuid(raw_id) if raw_id is not None else None

        title = data.get("title") or data.get("name") or "Untitled Evidence"
        node_type = normalize_node_type(data.get("type"))
        desc = data.get("description") or data.get("desc") or data.get("notes") or None
        img = data.get("image_url") or data.get("imageUrl") or data.get("image") or data.get("photo") or None
        editor = data.get("last_edited_by") or data.get("lastEditedBy") or data.get("editor") or data.get("author") or None

        return {
            "id": parsed_id,
            "title": str(title).strip(),
            "type": node_type,
            "description": str(desc) if desc is not None else None,
            "image_url": str(img) if img is not None else None,
            "last_edited_by": str(editor) if editor is not None else None,
        }

class ImportThreadItem(BaseModel):
    id: Optional[UUID] = None
    title: str = "Untitled Thread"
    description: Optional[str] = None
    connected_nodes: List[UUID] = Field(default_factory=list)
    last_edited_by: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def preprocess_thread(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        raw_id = data.get("id")
        parsed_id = to_uuid(raw_id) if raw_id is not None else None

        title = data.get("title") or data.get("name") or "Untitled Thread"
        desc = data.get("description") or data.get("desc") or data.get("notes") or None
        editor = data.get("last_edited_by") or data.get("lastEditedBy") or data.get("editor") or None

        raw_connected = (
            data.get("connected_nodes")
            or data.get("connectedNodes")
            or data.get("nodes")
            or data.get("links")
            or []
        )
        if not isinstance(raw_connected, list):
            raw_connected = [raw_connected]

        parsed_connected: List[UUID] = []
        for item in raw_connected:
            uid = to_uuid(item)
            if uid:
                parsed_connected.append(uid)

        return {
            "id": parsed_id,
            "title": str(title).strip(),
            "description": str(desc) if desc is not None else None,
            "connected_nodes": parsed_connected,
            "last_edited_by": str(editor) if editor is not None else None,
        }

class BulkImportPayload(BaseModel):
    nodes: List[ImportNodeItem] = Field(default_factory=list)
    threads: List[ImportThreadItem] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def preprocess_payload(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            if isinstance(data, list):
                return {"nodes": data, "threads": []}
            return data

        nested = data.get("data") or data.get("board")
        if isinstance(nested, dict):
            data = nested

        raw_nodes = data.get("nodes") or []
        if isinstance(raw_nodes, dict):
            raw_nodes = [{**v, "id": k} if isinstance(v, dict) else {"id": k, "title": str(v)} for k, v in raw_nodes.items()]
        elif not isinstance(raw_nodes, list):
            raw_nodes = []

        raw_threads = data.get("threads") or []
        if isinstance(raw_threads, dict):
            raw_threads = [{**v, "id": k} if isinstance(v, dict) else {"id": k, "title": str(v)} for k, v in raw_threads.items()]
        elif not isinstance(raw_threads, list):
            raw_threads = []

        return {
            "nodes": raw_nodes,
            "threads": raw_threads,
        }

class ImportResponse(BaseModel):
    message: str
    nodes_imported: int
    threads_imported: int
