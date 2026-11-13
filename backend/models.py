import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def get_utc_now():
    return datetime.now(timezone.utc)


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(200), nullable=False, default="")
    content = Column(Text, nullable=False, default="")
    is_pinned = Column(Boolean, nullable=False, default=False, index=True)
    is_favorite = Column(Boolean, nullable=False, default=False, index=True)
    tags = Column(JSON, nullable=False, default=list)
    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=get_utc_now, onupdate=get_utc_now, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "is_pinned": self.is_pinned,
            "is_favorite": self.is_favorite,
            "tags": self.tags if isinstance(self.tags, list) else [],
            "is_deleted": self.is_deleted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

