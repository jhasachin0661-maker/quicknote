import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, asc, delete
from backend.database import get_db
from backend.models import Note
from backend.schemas import (
    NoteCreate,
    NoteUpdate,
    NotePatch,
    NoteDetail,
    NoteResponse,
    NoteListResponse,
    DeleteResponse,
)

router = APIRouter(prefix="/notes", tags=["Notes"])


def get_utc_now():
    return datetime.now(timezone.utc)


@router.get("", response_model=NoteListResponse)
async def list_notes(
    q: Optional[str] = Query(None, description="Search query matching title or content"),
    tag: Optional[str] = Query(None, description="Filter by specific tag"),
    pinned: Optional[bool] = Query(None, description="Filter by pin status"),
    favorite: Optional[bool] = Query(None, description="Filter by favorite status"),
    deleted: bool = Query(False, description="Include or list only soft-deleted notes (Trash)"),
    sort_by: str = Query("updated_at", pattern="^(updated_at|created_at|title)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.is_deleted == deleted)

    # Search filter (case-insensitive in title or content)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(or_(Note.title.ilike(term), Note.content.ilike(term)))

    # Pinned filter
    if pinned is not None:
        query = query.where(Note.is_pinned == pinned)

    # Favorite filter
    if favorite is not None:
        query = query.where(Note.is_favorite == favorite)

    # Sorting logic: Pinned notes at top if sorting by updated_at or created_at in normal view
    sort_column = getattr(Note, sort_by, Note.updated_at)
    order_func = desc if order == "desc" else asc

    if not deleted and pinned is None:
        # Keep pinned notes always on top, then sort by the selected column
        query = query.order_by(desc(Note.is_pinned), order_func(sort_column))
    else:
        query = query.order_by(order_func(sort_column))

    result = await db.execute(query)
    notes = result.scalars().all()

    # Filter by tag in Python to maintain compatibility across SQLite & PostgreSQL
    if tag and tag.strip():
        target_tag = tag.strip().lower()
        notes = [n for n in notes if isinstance(n.tags, list) and target_tag in [t.lower() for t in n.tags]]

    return NoteListResponse(
        success=True,
        data=[NoteDetail.model_validate(n) for n in notes],
        count=len(notes),
        message=f"Retrieved {len(notes)} notes successfully",
    )


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db),
):
    now = get_utc_now()
    new_note = Note(
        id=str(uuid.uuid4()),
        title=note_in.title or "Untitled Note",
        content=note_in.content or "",
        is_pinned=note_in.is_pinned,
        is_favorite=note_in.is_favorite,
        tags=note_in.tags or [],
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)

    return NoteResponse(
        success=True,
        data=NoteDetail.model_validate(new_note),
        message="Note created successfully",
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.id == note_id)
    result = await db.execute(query)
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID '{note_id}' not found",
        )

    return NoteResponse(
        success=True,
        data=NoteDetail.model_validate(note),
        message="Note retrieved successfully",
    )


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_in: NoteUpdate,
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.id == note_id)
    result = await db.execute(query)
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID '{note_id}' not found",
        )

    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.is_pinned is not None:
        note.is_pinned = note_in.is_pinned
    if note_in.is_favorite is not None:
        note.is_favorite = note_in.is_favorite
    if note_in.tags is not None:
        note.tags = note_in.tags
    if note_in.is_deleted is not None:
        note.is_deleted = note_in.is_deleted

    note.updated_at = get_utc_now()
    await db.commit()
    await db.refresh(note)

    return NoteResponse(
        success=True,
        data=NoteDetail.model_validate(note),
        message="Note updated successfully",
    )


@router.patch("/{note_id}", response_model=NoteResponse)
async def patch_note(
    note_id: str,
    note_in: NotePatch,
    db: AsyncSession = Depends(get_db),
):
    return await update_note(note_id, note_in, db)


@router.delete("/{note_id}", response_model=DeleteResponse)
async def soft_delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.id == note_id)
    result = await db.execute(query)
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID '{note_id}' not found",
        )

    note.is_deleted = True
    note.updated_at = get_utc_now()
    await db.commit()

    return DeleteResponse(
        success=True,
        message="Note moved to trash",
        id=note_id,
        is_deleted=True,
    )


@router.post("/{note_id}/restore", response_model=NoteResponse)
async def restore_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.id == note_id)
    result = await db.execute(query)
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID '{note_id}' not found",
        )

    note.is_deleted = False
    note.updated_at = get_utc_now()
    await db.commit()
    await db.refresh(note)

    return NoteResponse(
        success=True,
        data=NoteDetail.model_validate(note),
        message="Note restored from trash",
    )


@router.delete("/{note_id}/permanent", response_model=DeleteResponse)
async def permanent_delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.id == note_id)
    result = await db.execute(query)
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID '{note_id}' not found",
        )

    await db.delete(note)
    await db.commit()

    return DeleteResponse(
        success=True,
        message="Note permanently deleted",
        id=note_id,
        is_deleted=True,
    )
