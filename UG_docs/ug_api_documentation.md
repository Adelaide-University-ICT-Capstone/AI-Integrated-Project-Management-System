# Undergraduate Team — API Ownership Documentation

This document tracks which API endpoints were designed, implemented, and integrated by each undergraduate team member.

---

## Team Members

| Real Name | GitHub Username | Git Email(s) | Commit Count |
|-----------|----------------|-------------|-------------|
| **Anh Khoa** | `markusle56` / `AnhKhoa` | `anhkhoa.wm@gmail.com` | ~49 |
| **Yuzhe** | `jimmy5566` | `a1918429@adelaide.edu.au`, `145540349+jimmy5566@users.noreply.github.com` | ~15 |
| **Igie** | `StackTracerQwQ` | `igie.manlangit@yahoo.com.au`, `igie.manlangit@student.adelaide.edu.au` | ~8 |
| **Pav** | `pavneet714` | `a1912165@adelaide.edu.au` | ~7 |

> All other contributors (AnhHo1801367, Lee-yongli, nevil bhalodia, Leslie2101/MilkteaForLife, Jerry Xie) are postgraduate team members and are not included here.

---

## Anh Khoa — Backend, Integration & Deployment

### Authentication

| Method | Endpoint | Commit | Notes |
|--------|----------|--------|-------|
| All | `/login/*` | `eaff0a5`, `9840c67` | Initial FastAPI scaffold, JWT auth, OAuth2 password flow |
| POST | `/password-recovery/{email}` | `9840c67` | Password reset email trigger |
| POST | `/reset-password/` | `9840c67` | Password reset with token |
| POST | `/password-recovery-html-content/{email}` | `9840c67` | Admin HTML preview |

### Users

| Method | Endpoint | Commit | Notes |
|--------|----------|--------|-------|
| GET | `/users/` | `9840c67` | Paginated user list (superuser) |
| POST | `/users/` | `9840c67` | Admin user creation |
| GET | `/users/me` | `9840c67` | Current user profile |
| PATCH | `/users/me` | `9840c67` | Self-update profile |
| PATCH | `/users/me/password` | `9840c67` | Self-change password |
| GET | `/users/{user_id}` | `9840c67` | Get user by ID |
| PATCH | `/users/{user_id}` | `9840c67` | Admin update user |
| DELETE | `/users/{user_id}`, `/users/me` | `9840c67` | Delete user |
| GET | `/users/all-users` | `32fdacf` | Removed superuser gate — any authenticated user |
| GET | `/users/time_log/{date}` | `e69978f` | Employee hours aggregation since a given date |

### Projects

| Method | Endpoint | Commit | Notes |
|--------|----------|--------|-------|
| GET | `/projects/overdue` | `a2b16e5` | Projects past due date |
| GET | `/projects/expected-to-finish/{date}` | `a2b16e5` | Projects due by date |
| GET | `/projects/invoice-bill` | `b39ab00` | Monthly invoice totals |
| GET | `/projects/all-project` | `a2b16e5` | All active projects summary (superuser) |
| GET | `/projects/current-project-num` | `a2b16e5` | Current vs previous month count |
| GET | `/projects/completed-project` | `a2b16e5` | Completed project counts |
| GET | `/projects/delay-project` | `a2b16e5` | Delayed projects |

### Workforce Allocation (Integration & Refactor)

| Area | Commit | Notes |
|------|--------|-------|
| `role_id` added to `ProjectAssignment` model | `c5772c0` | Extended assignment schema to carry role |
| Workforce allocation routes refactored | `535b7aa` | Removed legacy workforce page; wired up project-specific allocation route |
| Workforce allocation frontend + backend integration | `3e85502` | Full end-to-end wiring of POST/PATCH/DELETE to UI |
| `audit_logs` → `Project` relationship + cascade | `21c60df` | Model cleanup after Igie's migration |

### Deployment & Infrastructure

| Area | Commit | Notes |
|------|--------|-------|
| Initial database schema (all tables) | `9840c67` | PostgreSQL schema, SQLModel models |
| Docker Compose setup | `b969d4f`, `f83ac04` | Service orchestration, startup scripts, env vars |
| Alembic merge migration | `109ceae` | Fixed multiple-heads conflict across sprint branches |
| Alembic version cleanup | `63b37d0` | Removed obsolete old migration files |
| Environment security | `109ceae` | Removed hardcoded superuser password; secured secrets |
| uv lockfile for Docker | `a64b58d`, `a41217f` | Moved `uv.lock` to correct build context |

---

## Yuzhe — Project Setup & CI

Yuzhe's backend contributions were focused on repository bootstrapping and CI integration rather than API endpoint development. His API-adjacent contributions are listed below.

### Repository & CI

| Area | Commit | Notes |
|------|--------|-------|
| Initial repository commit | `ec81422` | Bootstrapped the repo and initial file structure |
| CI workflow connected to Jira | `5c98565`, `287d6d8` | SCRUM-27: GitHub Actions → Jira sprint sync |
| Project collaboration templates | `9ca1925` | PR templates, planning docs |

---

## Igie — Workforce Allocation Backend & Work Hours API

### Workforce Allocation (Backend)

| Method | Endpoint | Commit | Notes |
|--------|----------|--------|-------|
| POST | `/project/{project_id}/workforce-allocate` | `f421d9e` | Assign employees with audit logging + DB migration |
| PATCH | `/project/{project_id}/workforce-allocate` | `f421d9e` | Update employee roles in assignment |
| DELETE | `/project/{project_id}/workforce-allocate` | `f421d9e` | Remove assignments with audit log |
| — | PM permission guard | `bd2d7b6` | Project manager can POST/PATCH/DELETE (not just superuser) |

### Work Hours API (Backend)

| Method | Endpoint | Commit | Notes |
|--------|----------|--------|-------|
| POST | `/project/{project_id}/work-hours/add` | `3e2f935` | Log hours; accumulates if entry already exists |
| PATCH | `/project/{project_id}/work-hours/update` | `3e2f935` | Overwrite existing hours entry |
| DELETE | `/project/{project_id}/work-hours/remove` | `3e2f935` | Remove a specific time log entry |
| GET | `/project/{project_id}/work-hours/analytics` | `3e2f935` | Per-employee totals by day / week / month |

### Database Migrations

| Migration | Commit | Notes |
|-----------|--------|-------|
| Workforce allocation + audit logs table | `f421d9e` | First migration for assignment tracking |
| Audit logs table (standalone) | `a4070c3` | `audit_logs` schema |
| Project subtask model | `6bbc417` | `project_tasks` table + relationships |
| Subtask assignment models + PATCH endpoint | `e216038` | Assignment permissions for tasks |

---

## Pav — Analytics Backend

### Analytics API (Backend)

All 7 analytics endpoints were implemented by Pav in a single commit (`761db13`) which introduced the entire `analytics.py` route file (272 lines):

| Method | Endpoint | Commit | Notes |
|--------|----------|--------|-------|
| GET | `/analytics/dashboard-summary` | `761db13` | Active projects, high-risk count, overdue tasks, pending materials, avg hours |
| GET | `/analytics/risks` | `761db13` | Per-project risk score + level (Low/Medium/High) |
| GET | `/analytics/project-health` | `761db13` | Status distribution + milestone progress breakdown |
| GET | `/analytics/workload` | `761db13` | Per-employee monthly hours + overload flag |
| GET | `/analytics/revenue-leakage` | `761db13` | Uninvoiced projects and fee gap |
| GET | `/analytics/material-delays` | `761db13` | Pending materials sorted by days waiting |
| GET | `/analytics/deadline-trend` | `761db13` | 7-week rolling risk level chart data |

---

## Endpoint Coverage Summary

| API Section | Anh Khoa | Yuzhe | Igie | Pav |
|-------------|----------|-------|------|-----|
| Authentication | ✅ | — | — | — |
| Users | ✅ | — | — | — |
| Projects (core) | ✅ | — | — | — |
| Invoices | ✅ | — | — | — |
| Statuses | ✅ | — | — | — |
| Workforce Allocation | ✅ Models & integration | — | ✅ Endpoints + audit | — |
| Work Hours | — | — | ✅ | — |
| Analytics | — | — | — | ✅ |
| DB Migrations | ✅ Merge/cleanup | — | ✅ audit_logs, tasks | — |
| Deployment / Infra | ✅ | ✅ CI/Jira | — | — |

> Frontend contributions for each member are documented separately in [CONTRIBUTIONS.md](CONTRIBUTIONS.md).
