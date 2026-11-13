from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


class NoteBase(BaseModel):
    title: str = Field(default="", max_length=200, description="Note title up to 200 characters")
    content: str = Field(default="", description="Markdown or plain text content")
    is_pinned: bool = Field(default=False, description="Whether the note is pinned")
    is_favorite: bool = Field(default=False, description="Whether the note is marked as favorite")
    tags: List[str] = Field(default_factory=list, description="List of tags assigned to the note")

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v: List[str]) -> List[str]:
        cleaned = []
        for tag in v:
            if isinstance(tag, str):
                t = tag.strip().lower()
                if t and t not in cleaned:
                    cleaned.append(t)
        return cleaned


class NoteCreate(NoteBase):
    @model_validator(mode="after")
    def validate_not_both_empty(self):
        title = (self.title or "").strip()
        content = (self.content or "").strip()
        if not title and not content:
            raise ValueError("Note must have at least a non-empty title or content.")
        return self


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = Field(default=None)
    is_pinned: Optional[bool] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None
    is_deleted: Optional[bool] = None

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        cleaned = []
        for tag in v:
            if isinstance(tag, str):
                t = tag.strip().lower()
                if t and t not in cleaned:
                    cleaned.append(t)
        return cleaned


class NotePatch(NoteUpdate):
    pass


class NoteDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    is_pinned: bool
    is_favorite: bool
    tags: List[str]
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class NoteResponse(BaseModel):
    success: bool = True
    data: NoteDetail
    message: Optional[str] = None


class NoteListResponse(BaseModel):
    success: bool = True
    data: List[NoteDetail]
    count: int
    message: Optional[str] = None


class DeleteResponse(BaseModel):
    success: bool = True
    message: str
    id: str
    is_deleted: bool
