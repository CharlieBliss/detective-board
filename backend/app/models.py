import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, Enum as SQLEnum, Table, Uuid
from sqlalchemy.orm import relationship
from app.database import Base

class NodeType(str, enum.Enum):
    person = "person"
    place = "place"
    concept = "concept"

thread_node_links = Table(
    "thread_node_links",
    Base.metadata,
    Column(
        "thread_id",
        Uuid(as_uuid=True),
        ForeignKey("threads.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
        nullable=False,
    ),
    Column(
        "node_id",
        Uuid(as_uuid=True),
        ForeignKey("nodes.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
        nullable=False,
    ),
)

class Node(Base):
    __tablename__ = "nodes"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    type = Column(
        SQLEnum(NodeType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    description = Column(Text, nullable=True)
    image_url = Column(String(1024), nullable=True)
    last_edited_by = Column(String(255), nullable=True)

class Thread(Base):
    __tablename__ = "threads"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    last_edited_by = Column(String(255), nullable=True)

