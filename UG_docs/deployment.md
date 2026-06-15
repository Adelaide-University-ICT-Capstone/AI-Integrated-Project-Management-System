# Deployment Guide

This guide covers deploying the AI-Integrated Project Management System using:

- **Supabase** — managed PostgreSQL database
- **Render** — backend API (FastAPI)
- **Vercel** — frontend (React + Vite)

---

## Prerequisites

- A [Supabase](https://supabase.com) account
- A [Render](https://render.com) account
- A [Vercel](https://vercel.com) account
- The repository pushed to GitHub (required by both Render and Vercel)

---

## 1. Database — Supabase

### 1.1 Create a project

1. Log in to [supabase.com](https://supabase.com) and click **New project**.
2. Choose an organisation, set a project name, choose a region close to your users, and set a strong database password. Save this password — you will need it.
3. Wait for the project to finish provisioning (~1 minute).

### 1.2 Get the connection string

1. In the Supabase dashboard go to **Project Settings → Database**.
2. Scroll to **Connection string** and select the **URI** tab.
3. Make sure **Connection pooling** is enabled and mode is set to **Transaction** (recommended for serverless/containerised backends).
4. Copy the URI. It will look like:
   ```
   postgresql+psycopg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
   Replace `<password>` with the database password you set in step 1.2.

> The project already uses this format — check `fullstack/.env` (`SQLALCHEMY_URI`) for the current value.

### 1.3 Run database migrations

Migrations are managed by Alembic. You need to run them once before the backend starts serving traffic.

**Option A — from your local machine (quickest):**

```bash
cd fullstack
export SQLALCHEMY_URI="<your-supabase-uri>"
docker compose run --rm prestart
```

**Option B — via Render (automated on first deploy):**

In `fullstack/backend/scripts/start.sh`, uncomment the migration line:

```bash
# alembic upgrade head   # ← uncomment this line, then redeploy once
```

Re-comment it after the first successful deploy to avoid running migrations on every restart.

---

## 2. Backend — Render

The backend is deployed as a Docker-based **Web Service** on Render.

### 2.1 Create a new Web Service

1. In the Render dashboard click **New → Web Service**.
2. Connect your GitHub account and select this repository.
3. Configure the service:

   | Setting | Value |
   |---|---|
   | **Name** | `ai-pm-backend` (or any name you prefer) |
   | **Region** | Same region as your Supabase project |
   | **Branch** | `main` |
   | **Root Directory** | `fullstack` |
   | **Runtime** | **Docker** |
   | **Dockerfile Path** | `backend/Dockerfile` |
   | **Instance Type** | Free (for testing) or Starter+ (for production) |

4. Click **Advanced** and set the **Health Check Path** to:
   ```
   /api/v1/utils/health-check/
   ```

### 2.2 Set environment variables

Under **Environment Variables** add the following:

| Variable | Value |
|---|---|
| `SQLALCHEMY_URI` | Your Supabase connection string from step 1.2 |
| `SECRET_KEY` | A long random string (run `openssl rand -hex 32` to generate one) |
| `FIRST_SUPERUSER` | Email address for the initial admin account |
| `FIRST_SUPERUSER_PASSWORD` | Strong password for the initial admin account |
| `ENVIRONMENT` | `production` |
| `FRONTEND_HOST` | Your Vercel frontend URL, e.g. `https://your-app.vercel.app` |
| `BACKEND_CORS_ORIGINS` | Same Vercel URL (must match `FRONTEND_HOST`) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `SMTP_HOST` | *(optional)* SMTP server for email sending |
| `SMTP_USER` | *(optional)* SMTP username |
| `SMTP_PASSWORD` | *(optional)* SMTP password |
| `EMAILS_FROM_EMAIL` | *(optional)* Sender address for system emails |

### 2.3 Deploy

1. Click **Create Web Service**. Render will build the Docker image and start the container.
2. The first build takes ~3–5 minutes.
3. Once deployed, note your backend URL — it will be `https://ai-pm-backend.onrender.com` (or similar). You need this for the frontend.
4. Verify the backend is running by visiting:
   ```
   https://<your-render-url>/api/v1/utils/health-check/
   ```
   Expected response: `{"status":"ok"}`

---

## 3. Frontend — Vercel

The frontend is a Vite + React application deployed as a static site.

### 3.1 Import the project

1. In the Vercel dashboard click **Add New → Project**.
2. Import this repository from GitHub.
3. Configure the project:

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Vite |
   | **Root Directory** | `fullstack/frontend` |
   | **Build Command** | `bun run build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `bun install` |

### 3.2 Set environment variables

Under **Environment Variables** (select **Production** environment) add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL, e.g. `https://ai-pm-backend.onrender.com` |

> This variable is baked into the static build at compile time by Vite, so it must be set before deploying.

### 3.3 Deploy

1. Click **Deploy**. Vercel builds and publishes the frontend in ~1–2 minutes.
2. Once done, Vercel provides a URL like `https://your-app.vercel.app`.
3. Go back to your Render service and update these two environment variables to the actual Vercel URL:
   - `FRONTEND_HOST` → `https://your-app.vercel.app`
   - `BACKEND_CORS_ORIGINS` → `https://your-app.vercel.app`
4. Trigger a **Manual Deploy** on Render (or push a commit) so the backend picks up the new CORS origin.

---

## 4. Post-deployment checklist

- [ ] Visit `https://<render-url>/api/v1/utils/health-check/` — returns `{"status":"ok"}`
- [ ] Visit `https://<vercel-url>` — login page loads
- [ ] Log in with `FIRST_SUPERUSER` credentials
- [ ] Create a test project and assign a task — confirms DB read/write works
- [ ] Check `https://<render-url>/docs` for the interactive API documentation

---

## 5. Updating the application

**Backend changes** — push to `main`. Render auto-deploys on every push (configurable in Render settings).

**Frontend changes** — push to `main`. Vercel auto-deploys on every push.

**New database migrations** — after merging a PR that adds Alembic migrations:

1. Uncomment `alembic upgrade head` in `fullstack/backend/scripts/start.sh`.
2. Push and let Render deploy once.
3. Re-comment the line and push again.

---

## 6. Environment variable reference

Full list of all variables used across the stack:

| Variable | Used by | Description |
|---|---|---|
| `SQLALCHEMY_URI` | Backend | Full PostgreSQL connection URI |
| `SECRET_KEY` | Backend | JWT signing key — keep secret |
| `FIRST_SUPERUSER` | Backend | Initial admin email |
| `FIRST_SUPERUSER_PASSWORD` | Backend | Initial admin password |
| `ENVIRONMENT` | Backend | `local`, `staging`, or `production` |
| `FRONTEND_HOST` | Backend | Frontend origin for link generation in emails |
| `BACKEND_CORS_ORIGINS` | Backend | Comma-separated list of allowed CORS origins |
| `OPENAI_API_KEY` | Backend | OpenAI key for AI features |
| `SMTP_HOST` | Backend | SMTP server hostname |
| `SMTP_USER` | Backend | SMTP username |
| `SMTP_PASSWORD` | Backend | SMTP password |
| `SMTP_PORT` | Backend | SMTP port (default `587`) |
| `SMTP_TLS` | Backend | Enable STARTTLS (default `True`) |
| `EMAILS_FROM_EMAIL` | Backend | Sender address for outgoing emails |
| `SENTRY_DSN` | Backend | *(optional)* Sentry DSN for error tracking |
| `VITE_API_URL` | Frontend | Backend API base URL (build-time) |
