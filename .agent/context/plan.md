# QuickNote Full-Stack Execution Plan

## Architecture Overview
- **Frontend**: Next.js 14+ App Router or Pages, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI with async route handlers, Pydantic v2 schemas, CORS middleware.
- **Database**: PostgreSQL (Supabase) via SQLAlchemy Async / aiosqlite fallback, supporting full UUID keys, JSONB tags, soft deletion, and timestamps.

## Slices

### Slice 1: Database & Backend API Service (backend-service, api-design, database-design)
- Target: `backend/`
- Tasks:
  1. Define database schema, models, and migrations script (`sql/schema.sql`).
  2. Implement database abstraction layer supporting PostgreSQL / Supabase and local SQLite (`database.py`).
  3. Define Pydantic request/response schemas matching TRD Section 4 (`schemas.py`).
  4. Implement FastAPI router (`routers/notes.py`) with all endpoints:
     - `GET /api/v1/notes` (active notes, query search, tag filter, pinned, favorite)
     - `POST /api/v1/notes` (create note with 201 Created)
     - `GET /api/v1/notes/{id}` (single note)
     - `PUT /api/v1/notes/{id}` (full note update)
     - `PATCH /api/v1/notes/{id}` (partial update: pin, favorite, tag, delete status)
     - `DELETE /api/v1/notes/{id}` (soft-delete)
     - `DELETE /api/v1/notes/{id}/permanent` (permanent delete)
     - `POST /api/v1/notes/{id}/restore` (restore from trash)
  5. Setup `main.py` with CORS, healthcheck, error handling.
  6. Write automated tests (`tests/test_notes_api.py`) verifying CRUD, debounce safety, error codes (404, 422).

### Slice 2: Frontend Single-Page Application (frontend-web-app, uiux-visual-design, frontend-accessibility)
- Target: `frontend/`
- Tasks:
  1. Initialize Next.js project with TypeScript and Tailwind CSS.
  2. Implement API client (`lib/api.ts`) connecting to FastAPI `/api/v1/notes` with error handling and request cancellation.
  3. Build components:
     - `AppLayout`: Clean 3-pane / responsive 2-pane layout (Sidebar, Notes List, Note Editor).
     - `Sidebar`: New Note button, All Notes, Pinned, Favorites, Trash, Dynamic Tag list, Theme toggle (Dark/Light).
     - `SearchBar`: Live search by title and content with debounced filter.
     - `NotesGrid` & `NoteCard`: Pinned section, active notes list, timestamp formatting, badges, active note highlight.
     - `NoteEditor`: Real-time editing, title and markdown/content input, tag manager, pin/favorite toggles, delete action.
     - Autosave mechanism (600ms debounce, status indicators: Saving, Saved, Save Failed, Unsaved changes).
     - `DeleteConfirmation` modal.
     - `ToastNotification` system.
     - `LoadingSkeleton` and `EmptyState`.

### Slice 3: Verification, Testing & Quality Gate (quality-release-gate, docs-engineering)
- Target: full repository
- Tasks:
  1. Run backend automated tests.
  2. Build and verify frontend production build (`npm run build`).
  3. Write comprehensive documentation (`README.md`, setup guide, API reference, deployment guide for Vercel/Render/Supabase).
  4. Final release audit.

