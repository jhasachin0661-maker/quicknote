import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.main import app
from backend.database import get_db
from backend.models import Base

# In-memory SQLite async engine for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_note_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "title": "Internship Project",
            "content": "Build QuickNote with FastAPI and Next.js",
            "is_pinned": True,
            "is_favorite": True,
            "tags": ["work", "dev"]
        }
        res = await ac.post("/api/v1/notes", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Internship Project"
        assert data["data"]["content"] == "Build QuickNote with FastAPI and Next.js"
        assert data["data"]["is_pinned"] is True
        assert data["data"]["is_favorite"] is True
        assert data["data"]["tags"] == ["work", "dev"]
        assert data["data"]["is_deleted"] is False
        assert "id" in data["data"]
        assert "created_at" in data["data"]
        assert "updated_at" in data["data"]


@pytest.mark.asyncio
async def test_create_note_empty_validation_failure():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "title": "   ",
            "content": "   "
        }
        res = await ac.post("/api/v1/notes", json=payload)
        # Should return 422 Unprocessable Entity
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_get_notes_and_search():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create Note 1
        await ac.post("/api/v1/notes", json={"title": "Apple recipes", "content": "Bake an apple pie"})
        # Create Note 2
        await ac.post("/api/v1/notes", json={"title": "Banana smoothie", "content": "Blend bananas with milk", "tags": ["recipe"]})

        # Get all notes
        res = await ac.get("/api/v1/notes")
        assert res.status_code == 200
        assert res.json()["count"] == 2

        # Search by term 'apple'
        res_search = await ac.get("/api/v1/notes?q=apple")
        assert res_search.status_code == 200
        assert res_search.json()["count"] == 1
        assert res_search.json()["data"][0]["title"] == "Apple recipes"

        # Filter by tag
        res_tag = await ac.get("/api/v1/notes?tag=recipe")
        assert res_tag.status_code == 200
        assert res_tag.json()["count"] == 1
        assert res_tag.json()["data"][0]["title"] == "Banana smoothie"


@pytest.mark.asyncio
async def test_update_and_patch_note():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        create_res = await ac.post("/api/v1/notes", json={"title": "Original Title", "content": "Original Content"})
        note_id = create_res.json()["data"]["id"]

        # PUT update
        put_res = await ac.put(f"/api/v1/notes/{note_id}", json={"title": "Modified Title", "content": "Modified Content"})
        assert put_res.status_code == 200
        assert put_res.json()["data"]["title"] == "Modified Title"
        assert put_res.json()["data"]["content"] == "Modified Content"

        # PATCH update (e.g. toggle pin and favorite)
        patch_res = await ac.patch(f"/api/v1/notes/{note_id}", json={"is_pinned": True, "is_favorite": True})
        assert patch_res.status_code == 200
        assert patch_res.json()["data"]["is_pinned"] is True
        assert patch_res.json()["data"]["is_favorite"] is True
        # Content should remain intact
        assert patch_res.json()["data"]["title"] == "Modified Title"


@pytest.mark.asyncio
async def test_soft_delete_and_restore():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        create_res = await ac.post("/api/v1/notes", json={"title": "To be deleted", "content": "Temporary"})
        note_id = create_res.json()["data"]["id"]

        # Soft delete
        del_res = await ac.delete(f"/api/v1/notes/{note_id}")
        assert del_res.status_code == 200
        assert del_res.json()["is_deleted"] is True

        # Active list should NOT include deleted note
        active_res = await ac.get("/api/v1/notes")
        assert active_res.json()["count"] == 0

        # Trash list should include deleted note
        trash_res = await ac.get("/api/v1/notes?deleted=true")
        assert trash_res.json()["count"] == 1
        assert trash_res.json()["data"][0]["id"] == note_id

        # Restore note
        restore_res = await ac.post(f"/api/v1/notes/{note_id}/restore")
        assert restore_res.status_code == 200
        assert restore_res.json()["data"]["is_deleted"] is False

        # Active list should now include restored note again
        active_after = await ac.get("/api/v1/notes")
        assert active_after.json()["count"] == 1


@pytest.mark.asyncio
async def test_permanent_delete():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        create_res = await ac.post("/api/v1/notes", json={"title": "Permanent Delete Test", "content": "Gone forever"})
        note_id = create_res.json()["data"]["id"]

        perm_res = await ac.delete(f"/api/v1/notes/{note_id}/permanent")
        assert perm_res.status_code == 200

        # Note should be completely gone
        get_res = await ac.get(f"/api/v1/notes/{note_id}")
        assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_invalid_note_id_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/notes/non-existent-uuid-123")
        assert res.status_code == 404

