import { Note, NoteCreatePayload, NoteUpdatePayload } from '../types/note';

const STORAGE_KEY = 'quicknote_notes_v1';

const INITIAL_NOTES: Note[] = [
  {
    id: 'welcome-note-1',
    title: '👋 Welcome to QuickNote!',
    content: `QuickNote is your simple, fast, and personal notebook.

✨ **Features you have here:**
- **Add Notes**: Click "+ Add Note" to create a note, enter your details, and click "Save Note".
- **Color Coding**: Choose a color theme for your notes (amber, blue, emerald, purple, rose).
- **Pin & Star**: Keep important notes pinned or add them to favorites.
- **Tags & Search**: Search any keyword instantly and filter by tags like #work or #ideas.
- **Dark & Light Mode**: Switch seamlessly with the theme toggle in the header.
- **Backup & Export**: Download all your notes anytime with the export button!`,
    is_pinned: true,
    is_favorite: true,
    tags: ['welcome', 'guide'],
    color: 'blue',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'project-ideas',
    title: '💡 Quick Project Ideas',
    content: `- Build a sleek portfolio website
- Read 2 chapters of clean architecture
- Prepare weekly sprint goals
- Buy groceries and fresh fruits`,
    is_pinned: false,
    is_favorite: false,
    tags: ['ideas', 'todo'],
    color: 'amber',
    is_deleted: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const localNotesStorage = {
  getNotes(): Note[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTES));
        return INITIAL_NOTES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read notes from localStorage', e);
      return [];
    }
  },

  saveNotes(notes: Note[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  },

  createNote(payload: NoteCreatePayload): Note {
    const notes = this.getNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: payload.title || 'Untitled Note',
      content: payload.content || '',
      is_pinned: payload.is_pinned ?? false,
      is_favorite: payload.is_favorite ?? false,
      tags: payload.tags ?? [],
      color: payload.color || 'default',
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };
    notes.unshift(newNote);
    this.saveNotes(notes);
    return newNote;
  },

  updateNote(id: string, payload: NoteUpdatePayload): Note | null {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const existing = notes[index];
    const updated: Note = {
      ...existing,
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.content !== undefined ? { content: payload.content } : {}),
      ...(payload.is_pinned !== undefined ? { is_pinned: payload.is_pinned } : {}),
      ...(payload.is_favorite !== undefined ? { is_favorite: payload.is_favorite } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
      ...(payload.is_deleted !== undefined ? { is_deleted: payload.is_deleted } : {}),
      updated_at: new Date().toISOString(),
    };

    notes[index] = updated;
    this.saveNotes(notes);
    return updated;
  },

  softDeleteNote(id: string): boolean {
    const notes = this.getNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return false;
    note.is_deleted = true;
    note.updated_at = new Date().toISOString();
    this.saveNotes(notes);
    return true;
  },

  restoreNote(id: string): Note | null {
    const notes = this.getNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return null;
    note.is_deleted = false;
    note.updated_at = new Date().toISOString();
    this.saveNotes(notes);
    return note;
  },

  permanentDeleteNote(id: string): boolean {
    const notes = this.getNotes();
    const filtered = notes.filter((n) => n.id !== id);
    this.saveNotes(filtered);
    return true;
  },

  emptyTrash(): void {
    const notes = this.getNotes();
    const filtered = notes.filter((n) => !n.is_deleted);
    this.saveNotes(filtered);
  },

  exportNotesJson(): void {
    if (typeof window === 'undefined') return;
    const notes = this.getNotes();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `quicknote-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
};
