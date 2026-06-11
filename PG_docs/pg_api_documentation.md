# Postgraduate Team — API Ownership Documentation

This document tracks which API endpoints were designed, implemented, tested, and integrated by each postgraduate team member.

Authorship is based on [contributions.md](contributions.md), supported by route-level author comments in the backend code and the representative commits recorded in [git_tracks.md](git_tracks.md).

---

## Team Members

| Real Name | GitHub / Display Name | Primary API Areas |
|-----------|------------------------|-------------------|
| **Leslie** | `Leslie2101` / `MilkteaForLife` | Projects, project visibility, statuses, materials, subcontractors |
| **Nevil Bhalodia** | `nevil bhalodia` | Frontend page components, module refactors, project/task/subcontractor workflows |
| **Jerry Xie** | `Jerry Xie` / `Junxiao Xie` | Notifications, email preferences, project update notifications |
| **Yongli Jiang** | `Lee-yongli` / `Yongli Jiang` | Roles, task management, milestones, subtasks, task visibility |
| **Anh Ho** | `AnhHo1801367` | AI Assistant, dashboard AI alerts, chatbot service layer |

> Undergraduate contributors are documented separately in [UG_docs/ug_api_documentation.md](../UG_docs/ug_api_documentation.md).

---

## Leslie — Projects, Materials & Subcontractors APIs

### Projects

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| POST | `/projects` | `aab256f`, `87f227e`, `9f7f44e`, `23b13e7`, `0357acb` | Create projects with job number uniqueness validation |
| GET | `/projects` | `aab256f`, `87f227e`, `9f7f44e`, `23b13e7`, `0357acb` | List visible projects; supports status filtering and assignment-based visibility |
| GET | `/projects/{project_id}` | `aab256f`, `23b13e7`, `239a40b` | Get project details with visibility checks |
| PATCH | `/projects/{project_id}` | `aab256f`, `23b13e7`, `239a40b` | Update project fields; status-only updates use view permission, other updates require edit permission |
| DELETE | `/projects/{project_id}` | `aab256f`, `23b13e7` | Delete one project after permission checks |
| DELETE | `/projects` | `aab256f`, `23b13e7` | Superuser-only bulk project deletion |

### Statuses

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| GET | `/statuses` | `aab256f`, `23b13e7` | Retrieve seeded project status types |

### Materials

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| GET | `/materials/` | `239a40b`, `a37274f`, `af11d75` | List material orders by due date/status with user visibility filtering |
| GET | `/projects/{project_id}/materials` | `239a40b`, `a37274f`, `af11d75` | List material orders for one visible project |
| GET | `/projects/{project_id}/materials/{material_id}` | `239a40b`, `a37274f`, `af11d75` | Retrieve one project material order |
| POST | `/projects/{project_id}/materials` | `239a40b`, `a37274f`, `af11d75` | Create material orders and validate subcontractor references |
| PATCH | `/projects/{project_id}/materials/{material_id}` | `239a40b`, `a37274f`, `af11d75` | Update material order fields and status |
| DELETE | `/projects/{project_id}/materials/{material_id}` | `239a40b`, `a37274f`, `af11d75` | Delete material orders from a project |

### Subcontractors

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| POST | `/subcontractors/` | `a37274f`, `af11d75`, `7124b74` | Create subcontractors |
| GET | `/subcontractors/` | `a37274f`, `af11d75`, `7124b74` | List subcontractors |
| PATCH | `/subcontractors/{subcontractor_id}` | `a37274f`, `af11d75`, `7124b74` | Update subcontractor details |
| DELETE | `/subcontractors/{subcontractor_id}` | `a37274f`, `af11d75`, `7124b74` | Delete subcontractors only when not referenced by assignments, materials, or time logs |
| GET | `/subcontractors/{subcontractor_id}/projects` | `a37274f`, `af11d75`, `7124b74` | List projects associated with a subcontractor, scoped to the current user's visibility |

---

## Nevil Bhalodia — Frontend Page Components & Refactoring

Nevil's work focused on designing, developing, and refactoring frontend pages and reusable components. API wiring for backend-owned feature areas is credited under the relevant backend contributors above and below.

### Frontend Areas

| Area | Representative Commit(s) | Notes |
|------|--------------------------|-------|
| Project listing page | `dff6b78`, `9277cf4`, `e27322c`, `a69e1b3`, `09c15ed`, `db1a3d1`, `d677669` | Developed and refined project listing frontend components, page layout, navigation, and project summary presentation |
| Project creation wizard | `dff6b78`, `9277cf4`, `e27322c`, `a69e1b3`, `09c15ed`, `db1a3d1`, `d677669` | Three-step project creation flow for project details, workflow, subtasks, team allocation, and hours |
| Project details workflow | `dff6b78`, `9277cf4`, `e27322c`, `a69e1b3`, `09c15ed`, `db1a3d1`, `d677669` | Edit project modal, timeline tab, milestone due-date editing, task navigation to project details |
| Task board modularisation | `5cf3275` | Refactored task board into reusable components while preserving frontend task interactions |
| Subcontractor workflows | `dff6b78`, `9277cf4`, `e27322c`, `a69e1b3`, `09c15ed`, `db1a3d1`, `d677669` | Edit subcontractor panel and day-based subcontractor alerts |
| Dashboard, AI assistant, people, settings | `dff6b78`, `9277cf4`, `e27322c`, `a69e1b3`, `09c15ed`, `db1a3d1`, `d677669` | Frontend pages and components for dashboard KPI tiles, AI assistant, People tabs, profile/security/appearance/email preferences |
| Build and deployment readiness | `5de5511` | Cleaned frontend build errors that blocked Vercel deployment |

---

## Jerry Xie — Notifications & Email Preference APIs

### Notifications

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| POST | `/notifications/trigger-reminders/` | `a3098c0`, `314ca45`, `11b94d3`, `86bcb99` | Superuser-triggered deadline reminder scan; sends personalised emails to assigned users with deadline reminders enabled |
| POST | `/notifications/trigger-invoice-reminders/` | `a3098c0`, `314ca45`, `11b94d3`, `86bcb99` | Superuser-triggered weekly invoice alert scan for completed/to-be-invoiced projects missing invoices |

### Email Preferences

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| GET | `/users/me/email-preferences` | `11b94d3`, `86bcb99` | Retrieve the current user's email notification preference settings |
| PATCH | `/users/me/email-preferences` | `11b94d3`, `86bcb99` | Update selected email notification preferences for the current user |

### Notification Helpers & Integrations

| Area | Representative Commit(s) | Notes |
|------|--------------------------|-------|
| Project update notifications | `a3098c0`, `314ca45`, `11b94d3`, `86bcb99` | Sends project status update emails to active assigned users with project-update preferences enabled |
| Task assignment/removal notifications | `a3098c0`, `314ca45`, `11b94d3`, `86bcb99` | Queues email notifications for task assignment changes when user preferences allow it |
| User email preferences | `a3098c0`, `314ca45`, `11b94d3`, `86bcb99` | Added preference fields and frontend settings integration through `frontend/src/api/users.ts` and the settings route |
| Project API integration validation | `586026f` | Integrated project metadata and synchronised dashboard data panels; some early integration code was later revised by team updates |

---

## Yongli Jiang — Roles, Task Management & Workflow APIs

### Roles

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| GET | `/roles/` | `26f478f`, `65c6af9`, `6a62d74` | List project roles |
| POST | `/roles/` | `26f478f`, `65c6af9`, `6a62d74` | Superuser role creation with duplicate-name validation |
| GET | `/roles/{role_id}` | `26f478f`, `65c6af9`, `6a62d74` | Retrieve one role |
| PUT | `/roles/{role_id}` | `26f478f`, `65c6af9`, `6a62d74` | Superuser role update with duplicate-name validation |
| DELETE | `/roles/{role_id}` | `26f478f`, `65c6af9`, `6a62d74` | Superuser role deletion blocked when the role is in use |

### Task Management

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| GET | `/projects/tasks` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | List tasks with status/date filters and employee visibility restrictions |
| GET | `/projects/{project_id}/task-management` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Return workflow milestones and nested tasks for one project |
| POST | `/projects/{project_id}/milestones` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Create project milestones |
| PATCH | `/projects/{project_id}/milestones/{milestone_id}` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Update project milestones |
| DELETE | `/projects/{project_id}/milestones/{milestone_id}` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Delete project milestones |
| POST | `/projects/{project_id}/milestones/{milestone_id}/tasks` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Create tasks/subtasks under milestones and validate assignees |
| PATCH | `/projects/{project_id}/tasks/{task_id}` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Update task fields, parent task, assignment, and status |
| DELETE | `/projects/{project_id}/milestones/{milestone_id}/tasks/{task_id}` | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Delete tasks/subtasks |

### Project Enhancements

| Area | Representative Commit(s) | Notes |
|------|--------------------------|-------|
| Project detail progress calculation | `a0bc9d3`, `29f247e`, `fee9175`, `aa079c0`, `48be489`, `d15716b` | Added completion percentage derived from completed tasks / total tasks |
| Workflow/subtask project creation integration | `97c6882`, `1ab6544` | Integrated workflow and subtask APIs with project creation |
| Task visibility restrictions | `97c6882`, `1ab6544` | Enforced employee-based task visibility in backend responses |
| Timeline/Gantt frontend integration | `97c6882`, `1ab6544` | Connected workflow due dates to project detail timeline components |

---

## Anh Ho — AI Assistant & Dashboard AI APIs

### AI Assistant

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| POST | `/chatbot/chat` | `40f6d28` | Accepts user chat prompts, optional project context, and returns AI assistant responses with command metadata |

### Dashboard AI Alerts

| Method | Endpoint | Representative Commit(s) | Notes |
|--------|----------|--------------------------|-------|
| GET | `/dashboard/ai-alerts` | `40f6d28` | Produces AI risk alert data from visible overdue, delayed, and due-soon projects |

### Supporting Service Layer

| Area | Representative Commit(s) | Notes |
|------|--------------------------|-------|
| Chatbot schemas | `40f6d28` | Request/response models for AI chat |
| Command orchestration | `40f6d28` | Command parser and orchestrator for AI assistant actions |
| LLM integration | `40f6d28` | Model-facing service wrapper and response handling |
| Chatbot tests | `40f6d28` | Route, command, and orchestrator test coverage |

---
