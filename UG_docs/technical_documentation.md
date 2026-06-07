# Technical Documentation

**AI-Integrated Project Management System**
**Audience:** Backend engineers, DevOps, future maintainers
**Version:** 1.0 (Sprint 5)

---

## 1. Architecture Overview

The system follows a standard three-tier web architecture, fully containerised with Docker Compose.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│  │   Frontend   │    │    Backend    │    │   PostgreSQL 18  │  │
│  │  React + TS  │───▶│   FastAPI     │───▶│   (port 5432)    │  │
│  │  Vite (5173) │    │  Python 3.10+ │    │                  │  │
│  └──────────────┘    │  (port 8000)  │    └──────────────────┘  │
│                      └───────┬───────┘                          │
│                              │ SMTP                             │
│                      ┌───────▼───────┐                          │
│                      │  MailHog      │                          │
│                      │  (port 1080)  │                          │
│                      └───────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

**Request flow:**
1. Browser → Frontend (Vite dev server on port 5173)
2. Frontend calls `/api/v1/*` → Backend (FastAPI on port 8000)
3. Backend reads/writes → PostgreSQL
4. Background schedulers (APScheduler) run inside the backend process and send emails via SMTP → MailHog (dev) or a real SMTP server (production)

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend framework | FastAPI | latest | Async REST API, auto OpenAPI docs |
| ORM | SQLModel | latest | Type-safe DB models shared between API schemas and DB tables |
| DB migrations | Alembic | latest | Versioned schema migrations |
| Database | PostgreSQL | 18 | Relational store |
| Auth | python-jose + passlib | — | JWT encode/decode, bcrypt hashing |
| Task scheduler | APScheduler | — | Background jobs (deadline + invoice reminders) |
| Email | FastAPI-Mail | — | SMTP email delivery |
| Package manager (backend) | uv | — | Replaces pip/poetry; lockfile in `fullstack/uv.lock` |
| Frontend framework | React | 18 | UI |
| Language | TypeScript | 5+ | Type safety across all frontend code |
| Build tool | Vite | — | Fast HMR dev server, production builds |
| Styling | Tailwind CSS | — | Utility-first CSS |
| Router | TanStack Router | — | Type-safe file-based routing |
| API client | OpenAPI-generated (openapi-ts) | — | Auto-generated typed client from OpenAPI schema |
| Package manager (frontend) | Bun | — | Fast JS runtime + package manager |
| Containerisation | Docker Compose | v2.24+ | Orchestrates all services |

---

## 3. Repository Structure

```
AI-Integrated-Project-Management-System/
├── README.md                          # Setup guide
├── api_documentation.md               # Complete API reference
├── docs/                              # Project documentation
│   ├── product_requirements.md
│   ├── technical_documentation.md
│   ├── user_documentation.md
│   ├── code_documentation.md
│   ├── ug_api_documentation.md
│   └── CONTRIBUTIONS.md
└── fullstack/
    ├── .env                           # Environment config (not committed)
    ├── compose.yml                    # Base Docker Compose services
    ├── compose.override.yml           # Dev overrides: watch config, port exposure
    ├── uv.lock                        # Backend dependency lockfile
    ├── backend/
    │   ├── app/
    │   │   ├── main.py                # FastAPI app entry point
    │   │   ├── models.py              # All SQLModel table + schema definitions
    │   │   ├── api/
    │   │   │   ├── deps.py            # Shared FastAPI dependencies (auth, DB session)
    │   │   │   ├── main.py            # Router registration (all route prefixes)
    │   │   │   └── routes/            # One file per domain area
    │   │   │       ├── login.py
    │   │   │       ├── users.py
    │   │   │       ├── projects.py
    │   │   │       ├── invoices.py
    │   │   │       ├── statuses.py
    │   │   │       ├── roles.py
    │   │   │       ├── employees.py
    │   │   │       ├── customers.py
    │   │   │       ├── subcontractors.py
    │   │   │       ├── materials.py
    │   │   │       ├── workforce_allocate.py
    │   │   │       ├── work_hours.py
    │   │   │       ├── analytics.py
    │   │   │       ├── notifications.py
    │   │   │       ├── chatbot.py
    │   │   │       └── utils.py
    │   │   ├── core/
    │   │   │   ├── config.py          # Pydantic settings (reads from .env)
    │   │   │   ├── db.py              # Engine creation, session factory, init_db
    │   │   │   └── security.py        # Password hashing, JWT encode/decode
    │   │   ├── crud/                  # Database query functions (used by routes)
    │   │   ├── schemas/
    │   │   │   └── chatbot.py         # ChatRequest / ChatResponse pydantic models
    │   │   └── services/
    │   │       └── chatbot/
    │   │           └── orchestrator.py  # AI chatbot business logic
    │   ├── alembic/
    │   │   ├── env.py
    │   │   └── versions/              # All migration scripts (timestamped)
    │   ├── scripts/
    │   │   └── prestart.sh            # Runs on container start: migrate + seed superuser
    │   ├── pyproject.toml
    │   └── Dockerfile
    └── frontend/
        ├── src/
        │   ├── api/                   # Generated API client + manual overrides
        │   ├── routes/                # TanStack Router file-based pages
        │   │   ├── __root.tsx
        │   │   ├── login.tsx
        │   │   ├── recover-password.tsx
        │   │   ├── reset-password.tsx
        │   │   └── _authenticated/    # All auth-gated pages
        │   │       ├── index.tsx      # Dashboard
        │   │       ├── projects/
        │   │       ├── tasks.tsx
        │   │       ├── subcontractors.tsx
        │   │       ├── analytics.tsx
        │   │       ├── ai-assistant.tsx
        │   │       ├── people.tsx
        │   │       ├── settings.tsx
        │   │       └── admin/
        │   └── components/            # Reusable UI components
        ├── openapi-ts.config.ts       # OpenAPI code-gen config
        ├── package.json
        └── Dockerfile
```

---

## 4. Backend Deep Dive

### 4.1 Application Entry Point

`fullstack/backend/app/main.py` creates the FastAPI application, registers the main API router, configures CORS, and starts the background scheduler (APScheduler) on application startup.

```python
# Key startup hook
@app.on_event("startup")
async def start_scheduler():
    scheduler.start()
```

Background jobs registered at startup:
- **Daily deadline checker** — `07:30 Adelaide time` (CronTrigger)
- **Weekly invoice checker** — `Monday 07:30 Adelaide time` (CronTrigger)

### 4.2 Router Registration

`fullstack/backend/app/api/main.py` imports and mounts every route file under the `/api/v1` prefix. To add a new domain, create a file in `routes/`, define an `APIRouter`, and register it here.

### 4.3 Dependencies (`deps.py`)

FastAPI dependency-injection pattern:

| Dependency | Usage | What it does |
|-----------|-------|-------------|
| `SessionDep` | `session: SessionDep` | Yields a SQLAlchemy session, auto-commits or rolls back |
| `CurrentUser` | `current_user: CurrentUser` | Extracts and validates the JWT; returns the `User` model object |
| `get_current_active_superuser` | `dependencies=[Depends(...)]` | Raises 403 if the caller is not a superuser |

### 4.4 Data Model

All table definitions and API schemas are co-located in `models.py` using SQLModel. SQLModel classes serve dual purpose:
- When `table=True` → creates a database table
- Without `table=True` → used as a Pydantic request/response schema

Key entities and their relationships:

```
User ──── Employee (one-to-one via employee_id)
              │
              ├──── ProjectAssignment (many projects)
              │         ├── Project
              │         └── Role
              │
Project ───── ProjectMilestone (one-to-many)
              │       └── ProjectTask (one-to-many)
              │
              ├──── Invoice (one-to-many)
              ├──── Material (one-to-many)
              │         └── Subcontractor (many-to-one)
              └──── TimeLog (one-to-many)
                        └── Employee (many-to-one)
```

### 4.5 Security

`core/security.py` handles:

| Function | Description |
|----------|-------------|
| `get_password_hash(password)` | bcrypt hash |
| `verify_password(plain, hashed)` | bcrypt verify |
| `create_access_token(data, expires_delta)` | Encodes payload as HS256 JWT |
| `decode_access_token(token)` | Decodes and validates JWT; raises on expiry |

JWT signing key is read from `SECRET_KEY` in `.env`. Default expiry is controlled by `ACCESS_TOKEN_EXPIRE_MINUTES`.

### 4.6 Database Migrations

Alembic manages all schema changes. Never modify the database schema directly.

```bash
# Generate a new migration after editing models.py
docker compose exec backend alembic revision --autogenerate -m "describe change"

# Apply pending migrations
docker compose exec backend alembic upgrade head

# Roll back one step
docker compose exec backend alembic downgrade -1
```

Migration files live in `fullstack/backend/alembic/versions/`. The `prestart.sh` script automatically runs `alembic upgrade head` on every container start.

---

## 5. Frontend Deep Dive

### 5.1 File-Based Routing

TanStack Router generates routes from the file tree under `src/routes/`. All authenticated pages live under `_authenticated/`. The route guard in `_authenticated.tsx` redirects unauthenticated users to `/login`.

### 5.2 API Client

The typed API client is auto-generated from the backend's OpenAPI schema using `openapi-ts`:

```bash
# Regenerate after backend API changes
cd fullstack/frontend
bun run generate-client
```

Config: `fullstack/frontend/openapi-ts.config.ts`
Output: `fullstack/frontend/src/api/`

This means all API calls in the frontend are type-checked against the actual backend schema. If you add a new field to a backend response model, run the generator to surface it in TypeScript.

### 5.3 Authentication State

The frontend stores the JWT token in `localStorage`. The API client's `Authorization` header is set via a request interceptor. On 401, the user is redirected to `/login`.

---

## 6. Environment Configuration

All secrets and configuration are loaded from `fullstack/.env` (not committed). Copy the following template to get started:

```env
# Domain
DOMAIN=localhost
ENVIRONMENT=local       # local | staging | production

# Security
SECRET_KEY=changethis                # generate: python -c "import secrets; print(secrets.token_urlsafe(32))"
ACCESS_TOKEN_EXPIRE_MINUTES=10080    # 7 days

# Database
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis

# Initial superuser
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis

# Email (dev uses MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_TLS=false
EMAILS_FROM_EMAIL=noreply@example.com

# AI (for chatbot)
ANTHROPIC_API_KEY=your-key-here     # or OPENAI_API_KEY depending on implementation
```

---

## 7. Running the Application

### Development (recommended)

```bash
cd fullstack
docker compose watch
```

Docker Compose Watch:
- Syncs code changes into the running container (no rebuild needed for most changes)
- Triggers image rebuild only when `pyproject.toml` or `package.json` changes
- FastAPI reloads automatically on code changes

### Production

```bash
cd fullstack
docker compose -f compose.yml up -d --build
```

Ensure `.env` has production values for `SECRET_KEY`, `POSTGRES_PASSWORD`, `SMTP_*`, and `ENVIRONMENT=production`.

### Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run backend tests
docker compose exec backend pytest

# Open a Python shell with app context
docker compose exec backend python

# Connect to PostgreSQL
docker compose exec db psql -U postgres -d app

# Rebuild a single service
docker compose up -d --build backend
```

---

## 8. Background Schedulers

Schedulers are managed by APScheduler inside the backend process (`app/main.py`).

### Daily Deadline Checker

- **Schedule**: CronTrigger — `07:30 Adelaide time` every day
- **Logic**: Queries all active projects and milestones. For each approaching deadline (configurable window), sends a personalised email to all assigned users who have `deadline_reminders` enabled in their preferences.
- **Manual trigger**: `POST /api/v1/notifications/trigger-reminders/` (superuser only)

### Weekly Invoice Checker

- **Schedule**: CronTrigger — Monday `07:30 Adelaide time`
- **Logic**: Queries invoices issued more than 14 days ago with no `paid_date`. Sends alert emails to relevant stakeholders.

---

## 9. Database Schema Reference

Key tables (all defined in `models.py`):

| Table | Primary Key | Notable Columns |
|-------|------------|----------------|
| `users` | UUID | `email`, `hashed_password`, `is_superuser`, `employee_id` (FK) |
| `employees` | UUID | `first_name`, `last_name`, `role_title`, `is_active` |
| `roles` | UUID | `role_name` |
| `projects` | UUID | `job_number`, `job_title`, `current_status_id` (FK), `due_date`, `fee_estimate` |
| `project_status_types` | UUID | `status_name` |
| `project_milestones` | UUID | `project_id` (FK), `name`, `due_date`, `progress`, `is_complete` |
| `project_tasks` | UUID | `milestone_id` (FK), `name`, `is_complete`, `assigned_to` (FK employee) |
| `project_assignments` | UUID | `project_id` (FK), `employee_id` (FK), `role_id` (FK) |
| `time_logs` | UUID | `project_id`, `employee_id`, `task_id`, `log_date`, `hours_worked` |
| `materials` | UUID | `project_id`, `name`, `status`, `subcontractor_id` |
| `subcontractors` | UUID | `company_name`, `specialty`, `abn`, `is_active` |
| `invoices` | UUID | `project_id`, `invoice_number`, `invoice_date`, `invoice_amount`, `paid_date` |
| `customers` | UUID | `contact_name`, `email`, `current_status` |
| `audit_logs` | UUID | `action`, `project_id`, `target_user_ids`, `performed_by`, `timestamp` |

---

## 10. Adding a New API Endpoint

1. **Define models** in `models.py` (table model + request/response schemas)
2. **Create or update** a migration: `alembic revision --autogenerate -m "description"`
3. **Create or update** a route file in `app/api/routes/`
4. **Register the router** in `app/api/main.py`
5. **Regenerate the frontend client**: `bun run generate-client`
6. **Update** `api_documentation.md`

---

## 11. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `alembic.util.exc.CommandError: Multiple head revisions` | Two migration branches merged without a merge migration | Run `alembic merge heads -m "merge"` then `alembic upgrade head` |
| Backend 500 on startup | Missing `.env` variable or wrong `POSTGRES_*` credentials | Check `docker compose logs backend`; verify `.env` |
| Frontend shows 401 on all requests | JWT expired or `localStorage` cleared | Log out and log in again; check `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Emails not received in dev | MailHog not running | Open `http://localhost:1080`; verify `SMTP_HOST=mailhog` in `.env` |
| `openapi-ts` fails to generate | Backend not running | Start backend first; generator fetches `http://localhost:8000/openapi.json` |
| `docker compose watch` rebuilds on every change | File sync path misconfigured | Check `compose.override.yml` `develop.watch` paths |
