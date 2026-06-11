# Code Documentation Guide

**AI-Integrated Project Management System**
**Audience:** Developers contributing to or maintaining the codebase

---

## 1. Purpose

This document explains the code conventions, patterns, and embedded documentation practices used throughout the codebase. New developers should read this before contributing to understand how the code is structured and how to document new work.

---

## 2. Backend Code Conventions

### 2.1 Module Layout

Each route file in `app/api/routes/` follows this structure:

```python
import uuid                  # stdlib
from fastapi import APIRouter # third-party
from app.models import ...    # internal — always last group

router = APIRouter(prefix="/resource", tags=["resource"])

# Helper / permission functions defined BEFORE the route handlers that use them

@router.get("/", response_model=ResponseSchema)
def list_resources(session: SessionDep, current_user: CurrentUser) -> Any:
    ...
```

### 2.2 When to Add Comments

The project follows a **minimal-comment policy** — code is expected to be self-explanatory through good naming. Add a comment only when the **why** is non-obvious:

```python
# Good — explains a non-obvious constraint
# Superusers cannot delete their own account to prevent accidental lockout
if user.id == current_user.id:
    raise HTTPException(status_code=403, ...)

# Bad — explains the what, which is already clear from the code
# Check if user exists
user = session.get(User, user_id)
```

### 2.3 Permission Guard Functions

Permission checks are extracted into helper functions (not inline in route handlers) so they can be reused and reasoned about separately:

```python
def check_work_hours_permission(
    session: SessionDep, current_user: CurrentUser, project_id: uuid.UUID
) -> None:
    """Only superuser or project manager of the given project can manage work hours."""
    if current_user.is_superuser:
        return
    # ... further checks
```

The docstring on a permission guard should state the rule as a single sentence. This is the one place where docstrings are expected.

### 2.4 SQLModel Patterns

**Table models** use `table=True` and carry the actual database column definitions:

```python
class Project(ProjectBase, table=True):
    __tablename__ = "projects"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
```

**Schema models** (no `table=True`) are pure Pydantic and used for request validation and response serialization:

```python
class ProjectCreateRequest(SQLModel):   # request body
    job_number: str
    project_name: str
    ...

class ProjectCreateResponse(SQLModel):  # response
    project_id: uuid.UUID
    message: str
```

Keep table models and their associated schema models grouped together in `models.py`. The naming convention is:

| Suffix | Usage |
|--------|-------|
| `Base` | Shared fields (no table, no response) — inherited by both |
| `Create` | Request body for POST |
| `Update` | Request body for PATCH (all fields optional) |
| `Public` | Single-item response |
| `sPublic` | Collection response (plural) |
| `Response` | Custom-shaped response when `Public` doesn't fit |
| `Request` | Complex request body with a custom name |

### 2.5 CRUD Functions

Database queries that are reused across multiple route files live in `app/crud/`. Route-specific queries (used only once) stay inside the route file. The boundary: if you find yourself copy-pasting a query, move it to `crud/`.

```python
# crud/subcontractors.py
def get_visible_subcontractors(
    session: Session,
    employee_id: uuid.UUID | None,
    is_superuser: bool,
) -> list[Subcontractor]:
    # Superusers see all; employees see only their assigned subcontractors
    if is_superuser:
        return session.exec(select(Subcontractor)).all()
    ...
```

### 2.6 Error Handling

Use `HTTPException` from FastAPI for all API errors. Use the narrowest appropriate status code:

```python
from fastapi import HTTPException

# Resource not found
raise HTTPException(status_code=404, detail="Project not found")

# Business rule violation (not a permissions error)
raise HTTPException(status_code=400, detail="Task does not belong to this project")

# Permission denied
raise HTTPException(status_code=403, detail="Only project managers can manage work hours.")

# Duplicate resource
raise HTTPException(status_code=409, detail="Role name already exists")
```

Do not catch and swallow exceptions silently. Let unexpected errors propagate to FastAPI's default 500 handler.

### 2.7 Background Jobs

Background job functions (schedulers) are defined in `app/main.py` or a dedicated service module. Keep job logic thin — delegate to service functions that can be tested in isolation.

```python
# Good
@scheduler.scheduled_job(CronTrigger(...))
async def run_daily_reminders():
    await notification_service.send_deadline_reminders()

# Bad — business logic directly in the scheduler callback makes it untestable
@scheduler.scheduled_job(CronTrigger(...))
async def run_daily_reminders():
    projects = session.exec(select(Project).where(...)).all()
    for p in projects:
        # 80 lines of inline logic...
```

---

## 3. Frontend Code Conventions

### 3.1 File-Based Routing

Page components live in `src/routes/`. The file name determines the URL path (TanStack Router convention):

| File | URL |
|------|-----|
| `src/routes/index.tsx` | `/` |
| `src/routes/_authenticated/projects/index.tsx` | `/projects` |
| `src/routes/_authenticated/projects/$projectId.tsx` | `/projects/:projectId` |

All auth-protected pages are nested under `_authenticated/`. The `_authenticated.tsx` layout component handles the auth redirect.

### 3.2 API Calls

Always use the generated API client (`src/api/`) rather than writing raw `fetch()` calls. The generated client is type-safe and reflects the actual backend schema:

```typescript
// Good — type-safe, auto-generated
import { ProjectsService } from "@/api"
const projects = await ProjectsService.getProjects({ status: "active" })

// Bad — bypasses type checking, must be manually updated when API changes
const res = await fetch("/api/v1/projects?status=active")
const projects = await res.json()
```

Regenerate the client after backend API changes:
```bash
bun run generate-client
```

### 3.3 Component Structure

Reusable components live in `src/components/`. Page-specific components can be co-located with the route file or in a subdirectory. The rule: if a component is used on only one page, keep it near that page; if used on two or more, move it to `components/`.

### 3.4 TypeScript Strictness

All new code must be TypeScript — no `any` unless wrapping an external library that provides no types. Use `unknown` instead of `any` for truly untyped values and narrow with type guards.

### 3.5 Comments in Frontend Code

Same principle as backend: comment the **why**, not the **what**. The most common valid use case in the frontend is explaining a non-obvious workaround or browser behaviour:

```typescript
// TanStack Router requires the loader to return null (not undefined) when there's nothing to load
export const loader = () => null

// Bun does not support `import.meta.env` at test time — use process.env instead in test files
```

---

## 4. Database Migrations

Every schema change must go through Alembic. Never run `ALTER TABLE` directly in production.

### 4.1 Writing a Migration

After editing `models.py`:

```bash
docker compose exec backend alembic revision --autogenerate -m "add invoice paid_date column"
```

Review the generated file in `alembic/versions/` before applying. Autogenerate can miss:
- Renaming columns (it generates DROP + ADD instead of RENAME)
- Changes to `sa_type` hints that don't affect the column definition

### 4.2 Naming Convention

Migration messages use present tense and describe the schema change:
- `add invoice paid_date column`
- `create audit_logs table`
- `add role_id to project_assignments`
- `merge sprint4 heads`

### 4.3 Merge Migrations

When two branches both create a migration from the same head, Alembic will refuse to upgrade. Resolve with:

```bash
alembic merge heads -m "merge sprint4 and email branches"
alembic upgrade head
```

---

## 5. Key Files Quick Reference

| File | What it does | When to edit |
|------|-------------|--------------|
| `app/models.py` | All DB tables + schemas | Adding/changing a data model |
| `app/api/deps.py` | Auth + session dependencies | Adding a new reusable dependency |
| `app/api/main.py` | Router registration | Adding a new route file |
| `app/core/config.py` | App settings (reads `.env`) | Adding a new env variable |
| `app/core/security.py` | JWT + password utilities | Changing auth logic |
| `app/main.py` | App startup + scheduler | Adding a background job |
| `alembic/versions/` | DB migration scripts | After every `models.py` change |
| `frontend/openapi-ts.config.ts` | API client generator config | Changing backend URL or output path |
| `fullstack/.env` | All secrets and config | Changing environment settings |

---

## 6. Patterns to Be Aware Of

### Cascade Deletes

Project-related tables (milestones, tasks, materials, time logs) use `ondelete="CASCADE"` on their `project_id` foreign keys. Deleting a project removes all child records automatically at the database level. Do not replicate this in application code.

### Visibility Filtering

Several endpoints apply visibility rules:
- Projects: non-superusers only see projects they are assigned to (via `ProjectAssignment`)
- Subcontractors: non-superusers only see subcontractors linked to their projects
- Tasks: only the assigned employee (or superuser/PM) can see a task

This logic lives in `crud/` functions (`get_visible_*`). When writing a new list endpoint, check whether visibility filtering applies and use the appropriate CRUD function rather than a raw `select()`.

### Audit Logging

Workforce allocation mutations (POST/PATCH/DELETE on `/project/{id}/workforce-allocate`) write to `audit_logs` after every successful change. This is a deliberate design decision — do not remove these writes. If adding other sensitive mutations, consider whether they should also be audited.

### Email Preferences

Before sending any notification email to a user, check their `email_preferences` flags. Do not bypass this check in new notification features.
