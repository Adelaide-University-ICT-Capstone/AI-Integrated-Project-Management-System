# API Documentation

**AI-Integrated Project Management System**

| Property | Value |
|----------|-------|
| Base URL | `/api/v1` |
| Authentication | JWT — OAuth2 Password Bearer |
| Auth Header | `Authorization: Bearer <access_token>` |
| Interactive Docs | `http://localhost:8000/docs` (Swagger UI) |
| OpenAPI Schema | `http://localhost:8000/openapi.json` |

All authenticated endpoints require a valid JWT access token in the `Authorization` header. Obtain a token via [`POST /login/access-token`](#post-loginaccess-token).

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Projects](#3-projects)
4. [Invoices](#4-invoices)
5. [Statuses](#5-statuses)
6. [Roles](#6-roles)
7. [Employees](#7-employees)
8. [Customers](#8-customers)
9. [Subcontractors](#9-subcontractors)
10. [Materials (Global)](#10-materials-global)
11. [Workforce Allocation](#11-workforce-allocation)
12. [Work Hours](#12-work-hours)
13. [Analytics](#13-analytics)
14. [Notifications](#14-notifications)
15. [Chatbot](#15-chatbot)
16. [Utilities](#16-utilities)
17. [Background Schedulers](#17-background-schedulers)

---

## Authorization Levels

| Level | How it works |
|-------|-------------|
| **None** | No token required — publicly accessible |
| **Bearer** | Any valid, active user token |
| **PM or Superuser** | Caller must be the project's assigned project manager or a superuser |
| **Superuser** | `is_superuser: true` only |

---

## 1. Authentication

### POST `/login/access-token`
OAuth2 password login — returns a JWT access token.

**Auth**: None

**Request** (form data — `application/x-www-form-urlencoded`):

| Field | Type | Required |
|-------|------|----------|
| `username` | string (email) | Yes |
| `password` | string | Yes |

**Response** `200`:
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

---

### POST `/login/test-token`
Validates the current Bearer token and returns the authenticated user's profile.

**Auth**: Bearer

**Request**: None

**Response** `200` — `UserPublic`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_active": true,
  "is_superuser": false,
  "full_name": "string | null",
  "employee_id": "uuid | null",
  "created_at": "datetime | null"
}
```

---

### POST `/password-recovery/{email}`
Sends a password reset email if the address is registered.

**Auth**: None

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `email` | string | Yes |

**Response** `200`:
```json
{
  "message": "If that email is registered, we sent a password recovery link"
}
```

---

### POST `/reset-password/`
Resets a user's password using a valid reset token received by email.

**Auth**: None

**Request Body** — `NewPassword`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `token` | string | — | Yes |
| `new_password` | string | min 8, max 128 chars | Yes |

**Response** `200`:
```json
{
  "message": "Password updated successfully"
}
```

---

### POST `/password-recovery-html-content/{email}`
Returns the HTML preview of the password recovery email template. Intended for admin testing.

**Auth**: Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `email` | string | Yes |

**Response** `200`: HTML content (`text/html`)

---

## 2. Users

### GET `/users/`
Retrieve a paginated list of all user accounts.

**Auth**: Superuser

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | integer | `0` | Records to skip |
| `limit` | integer | `100` | Max records to return |

**Response** `200` — `UsersPublic`:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "is_active": true,
      "is_superuser": false,
      "full_name": "string | null",
      "employee_id": "uuid | null",
      "created_at": "datetime | null"
    }
  ],
  "count": 0
}
```

---

### GET `/users/all-users`
Retrieve all users with their name, email, and role. Does not require superuser — used by the frontend to populate workforce selection dropdowns.

**Auth**: Bearer

**Response** `200` — `UsersDetail`:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "string | null",
      "role": "string | null"
    }
  ],
  "count": 0
}
```

---

### GET `/users/me`
Get the currently authenticated user's profile.

**Auth**: Bearer

**Response** `200` — `UserProfile`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_superuser": false,
  "first_name": "string | null",
  "last_name": "string | null",
  "full_name": "string | null",
  "role_name": "string | null",
  "is_active": true
}
```

---

### PATCH `/users/me`
Update the currently authenticated user's own profile.

**Auth**: Bearer

**Request Body** — `UserUpdateMe`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `full_name` | string \| null | max 255 chars | No |
| `email` | string \| null | max 255 chars | No |

**Response** `200` — `UserPublic` (see [GET `/users/`](#get-users) for shape)

---

### PATCH `/users/me/password`
Change the currently authenticated user's password.

**Auth**: Bearer

**Request Body** — `UpdatePassword`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `current_password` | string | min 8, max 128 chars | Yes |
| `new_password` | string | min 8, max 128 chars | Yes |

**Response** `200`:
```json
{
  "message": "Password updated successfully"
}
```

---

### GET `/users/me/email-preferences`
Get the authenticated user's email notification preferences.

**Auth**: Bearer

**Response** `200`:
```json
{
  "deadline_reminders": true,
  "task_assignments": true
}
```

---

### PATCH `/users/me/email-preferences`
Update the authenticated user's email notification preferences.

**Auth**: Bearer

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `deadline_reminders` | boolean \| null | No |
| `task_assignments` | boolean \| null | No |

**Response** `200`: Updated preferences object (same shape as GET above)

---

### GET `/users/{user_id}`
Get a specific user by ID. Non-superusers can only retrieve their own record.

**Auth**: Bearer (superuser required to view other users)

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `user_id` | UUID | Yes |

**Response** `200` — `UserPublic` (see [GET `/users/`](#get-users) for shape)

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Non-superuser attempting to view a different user |
| 404 | User not found |

---

### POST `/users/`
Create a new user account.

**Auth**: Superuser

**Request Body** — `AdminUserCreate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `email` | string | max 255 chars | Yes |
| `password` | string | min 8, max 128 chars | Yes |
| `role_name` | string \| null | max 100 chars | No |

**Response** `200` — `UserPublic` (see [GET `/users/`](#get-users) for shape)

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Email already registered |

---

### PATCH `/users/{user_id}`
Update any user's details.

**Auth**: Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `user_id` | UUID | Yes |

**Request Body** — `UserUpdate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `email` | string \| null | max 255 chars | No |
| `is_active` | boolean \| null | — | No |
| `is_superuser` | boolean \| null | — | No |
| `full_name` | string \| null | max 255 chars | No |
| `password` | string \| null | min 8, max 128 chars | No |
| `role_name` | string \| null | max 100 chars | No |

**Response** `200` — `UserPublic`

**Error Responses**:

| Status | Description |
|--------|-------------|
| 404 | User not found |

---

### DELETE `/users/me`
Delete the currently authenticated user's own account. Superusers cannot delete themselves via this endpoint.

**Auth**: Bearer

**Response** `200`:
```json
{
  "message": "User deleted successfully"
}
```

---

### DELETE `/users/{user_id}`
Delete a user by ID. Superusers cannot delete their own account.

**Auth**: Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `user_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Superuser attempting to delete their own account |
| 404 | User not found |

---

### GET `/users/time_log/{date}`
Get total working hours per employee since the given date. Used by the admin time-tracking dashboard.

**Auth**: None

**Path Parameters**:

| Parameter | Type | Format | Required |
|-----------|------|--------|----------|
| `date` | string | `dd-mm-yyyy` | Yes |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_ids` | UUID[] | No | Filter to specific users; omit to return all employees with logged hours |

**Response** `200` — `EmployeeHoursResponse`:
```json
{
  "data": [
    {
      "employee_id": "uuid",
      "name": "string | null",
      "working_hours": "decimal",
      "role": "string | null"
    }
  ],
  "count": 0
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Invalid date format (expected `dd-mm-yyyy`) |

---

## 3. Projects

The project resource follows a hierarchy: **Project → Milestones → Tasks**. All project mutation endpoints require Bearer authentication and check whether the caller is assigned to the project (or is a superuser).

---

### POST `/projects`
Create a new project.

**Auth**: Bearer

**Request Body** — `ProjectCreateRequest`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `job_number` | string | — | Yes |
| `project_types` | string | default: `"civil"` | No |
| `project_name` | string | — | Yes |
| `client_name` | string | — | Yes |
| `client_company` | string \| null | — | No |
| `client_contact` | string \| null | — | No |
| `client_address` | string \| null | — | No |
| `fee_estimate` | decimal \| null | max 10 digits, 2 decimal places | No |
| `date_received` | date | — | Yes |
| `start_date` | date | — | Yes |
| `due_date` | date | — | Yes |

**Response** `200` — `ProjectCreateResponse`:
```json
{
  "project_id": "uuid",
  "message": "project created successfully"
}
```

---

### GET `/projects`
Get all projects, optionally filtered by status.

**Auth**: None

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string \| null | No | Filter by project status name |

**Response** `200` — `ProjectDetailsResponse`:
```json
{
  "data": [
    {
      "project_id": "uuid",
      "job_number": "string",
      "project_name": "string | null",
      "company_name": "string | null",
      "company_address": "string | null",
      "client_name": "string | null",
      "status": "string | null",
      "start_date": "date | null",
      "due_date": "date | null",
      "days_elapsed": "integer | null",
      "fee_estimate": "decimal | null"
    }
  ],
  "count": 0
}
```

---

### GET `/projects/due-date`
Get projects filtered by a due date range.

**Auth**: Bearer

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | date | No | Range start (inclusive) |
| `end` | date | No | Range end (inclusive) |

**Response** `200` — `ProjectDetailsResponse` (same shape as [GET `/projects`](#get-projects))

---

### GET `/projects/tasks`
Get tasks across all projects with optional filters.

**Auth**: Bearer

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | UUID | No | Filter to a specific project |
| `is_complete` | boolean | No | Filter by completion status |

**Response** `200` — list of task objects with milestone and project context

---

### GET `/projects/all-project`
Get a summary list of all active projects with their project manager.

**Auth**: Superuser

**Response** `200` — `ProjectsListResponse`:
```json
{
  "data": [
    {
      "project_id": "uuid",
      "project_name": "string | null",
      "client_name": "string | null",
      "project_manager_name": "string | null",
      "days_since_started": "integer | null"
    }
  ],
  "count": 0
}
```

---

### GET `/projects/delay-project`
Get all active projects that are delayed past their due date.

**Auth**: Superuser

**Response** `200` — `ProjectsListResponse` (same shape as `/projects/all-project`)

---

### GET `/projects/current-project-num`
Get the count of active projects for the current month vs the previous month.

**Auth**: Superuser

**Response** `200` — `MonthlyCountResponse`:
```json
{
  "current_month": 0,
  "previous_month": 0
}
```

---

### GET `/projects/completed-project`
Get the count of completed projects for the current month vs the previous month.

**Auth**: Superuser

**Response** `200` — `MonthlyCountResponse` (same shape as above)

---

### GET `/projects/overdue`
Get all active projects that are past their due date and not yet completed.

**Auth**: None

**Response** `200` — `ProjectDetailsResponse` (same shape as [GET `/projects`](#get-projects))

---

### GET `/projects/expected-to-finish/{date}`
Get all active projects whose due date falls on or before the given date.

**Auth**: None

**Path Parameters**:

| Parameter | Type | Format | Required |
|-----------|------|--------|----------|
| `date` | string | `dd-mm-yyyy` | Yes |

**Response** `200` — `ProjectDetailsResponse`

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Invalid date format |

---

### GET `/projects/invoice-bill`
Get total invoice amounts for the current month vs the previous month.

**Auth**: Superuser

**Response** `200` — `MonthlyInvoiceResponse`:
```json
{
  "current_month_total": "decimal",
  "previous_month_total": "decimal"
}
```

---

### GET `/projects/{project_id}`
Get full details of a specific project.

**Auth**: None

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Response** `200` — `ProjectDetail`:
```json
{
  "project_id": "uuid",
  "job_number": "string",
  "project_name": "string | null",
  "company_name": "string | null",
  "company_address": "string | null",
  "client_name": "string | null",
  "status": "string | null",
  "start_date": "date | null",
  "due_date": "date | null",
  "days_elapsed": "integer | null",
  "fee_estimate": "decimal | null"
}
```

---

### GET `/projects/{project_id}/with-roles`
Get a project along with the roles assigned to it (used to populate the workforce management view).

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Response** `200` — project detail object with an additional `roles` array

---

### GET `/projects/{project_id}/task-management`
Get the full task management view for a project, including milestones and their nested tasks.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Response** `200` — `ProjectTaskManagementResponse`:
```json
{
  "project_id": "uuid",
  "milestones": [
    {
      "milestone_id": "uuid",
      "name": "string",
      "due_date": "date | null",
      "is_complete": false,
      "progress": 0,
      "tasks": [
        {
          "task_id": "uuid",
          "name": "string",
          "is_complete": false,
          "assigned_to": "uuid | null"
        }
      ]
    }
  ]
}
```

---

### PATCH `/projects/{project_id}`
Update a project's details.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — `ProjectUpdateRequest`:

| Field | Type | Required |
|-------|------|----------|
| `project_name` | string \| null | No |
| `project_types` | string \| null | No |
| `status` | string \| null | No |
| `date_received` | date \| null | No |
| `start_date` | date \| null | No |
| `due_date` | date \| null | No |
| `fee_estimate` | decimal \| null | No |

**Response** `200`:
```json
{
  "message": "Project updated successfully"
}
```

---

### DELETE `/projects/{project_id}`
Delete a specific project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "Project deleted successfully"
}
```

---

### DELETE `/projects`
Delete all projects. Use with extreme caution — this is irreversible.

**Auth**: Superuser

**Response** `200`:
```json
{
  "message": "Deleted X projects successfully"
}
```

---

### POST `/projects/{project_id}/milestones`
Create a milestone for a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — `ProjectMilestoneCreate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `name` | string | max 255 chars | Yes |
| `due_date` | date \| null | — | No |
| `progress` | integer | 0–100 | No |
| `is_complete` | boolean | default: `false` | No |

**Response** `200` — `ProjectMilestonePublic`:
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "string",
  "due_date": "date | null",
  "progress": 0,
  "is_complete": false
}
```

---

### PATCH `/projects/{project_id}/milestones/{milestone_id}`
Update a milestone.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `milestone_id` | UUID | Yes |

**Request Body** — `ProjectMilestoneUpdate` (all fields optional):

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string \| null | max 255 chars |
| `due_date` | date \| null | — |
| `progress` | integer \| null | 0–100 |
| `is_complete` | boolean \| null | — |

**Response** `200` — `ProjectMilestonePublic`

---

### DELETE `/projects/{project_id}/milestones/{milestone_id}`
Delete a milestone and all its tasks.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `milestone_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "Milestone deleted successfully"
}
```

---

### POST `/projects/{project_id}/milestones/{milestone_id}/tasks`
Create a task under a milestone.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `milestone_id` | UUID | Yes |

**Request Body** — `ProjectTaskCreate`:

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `is_complete` | boolean | No |
| `assigned_to` | UUID \| null | No |

**Response** `200` — `ProjectTaskPublic`

---

### PATCH `/projects/{project_id}/tasks/{task_id}`
Update a task.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `task_id` | UUID | Yes |

**Request Body** — `ProjectTaskUpdate` (all fields optional):

| Field | Type |
|-------|------|
| `name` | string \| null |
| `is_complete` | boolean \| null |
| `assigned_to` | UUID \| null |

**Response** `200` — `ProjectTaskPublic`

---

### DELETE `/projects/{project_id}/milestones/{milestone_id}/tasks/{task_id}`
Delete a task.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `milestone_id` | UUID | Yes |
| `task_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "Task deleted successfully"
}
```

---

### GET `/projects/{project_id}/materials`
List all materials attached to a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Response** `200` — `MaterialsPublic`:
```json
{
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "string",
      "description": "string | null",
      "unit": "string | null",
      "quantity": "decimal | null",
      "unit_cost": "decimal | null",
      "supplier_name": "string | null",
      "order_reference": "string | null",
      "ordered_date": "date | null",
      "received_date": "date | null",
      "subcontractor_id": "uuid | null",
      "status": "string",
      "notes": "string | null",
      "created_at": "datetime | null",
      "updated_at": "datetime | null"
    }
  ],
  "count": 0
}
```

---

### GET `/projects/{project_id}/materials/{material_id}`
Get a specific material on a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `material_id` | UUID | Yes |

**Response** `200` — `MaterialPublic` (single object from the list above)

---

### POST `/projects/{project_id}/materials`
Add a material to a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — `MaterialCreate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `name` | string | max 255 chars | Yes |
| `description` | string \| null | — | No |
| `unit` | string \| null | max 50 chars | No |
| `quantity` | decimal \| null | max 10 digits, 3 decimal places | No |
| `unit_cost` | decimal \| null | max 10 digits, 2 decimal places | No |
| `supplier_name` | string \| null | max 255 chars | No |
| `order_reference` | string \| null | max 100 chars | No |
| `ordered_date` | date \| null | — | No |
| `received_date` | date \| null | — | No |
| `subcontractor_id` | UUID \| null | — | No |
| `status` | string | default: `"N/A"` | No |
| `notes` | string \| null | — | No |

**Response** `200` — `MaterialPublic`

---

### PATCH `/projects/{project_id}/materials/{material_id}`
Update a material on a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `material_id` | UUID | Yes |

**Request Body** — `MaterialUpdate` (all fields optional — same fields as create)

**Response** `200` — `MaterialPublic`

---

### DELETE `/projects/{project_id}/materials/{material_id}`
Delete a material from a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |
| `material_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "Material deleted successfully"
}
```

---

## 4. Invoices

### GET `/invoices/finish/{date}`
Return invoices issued since `date` that are overdue — issued more than 14 days ago and not yet paid.

**Auth**: None

**Path Parameters**:

| Parameter | Type | Format | Required |
|-----------|------|--------|----------|
| `date` | string | `dd-mm-yyyy` | Yes |

**Response** `200` — `InvoiceListResponse`:
```json
{
  "data": [
    {
      "invoice_id": "uuid",
      "project_id": "uuid",
      "project_name": "string | null",
      "invoice_number": "string",
      "invoice_date": "date | null",
      "invoice_amount": "decimal | null",
      "paid_date": "date | null"
    }
  ],
  "count": 0,
  "total": "decimal"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Invalid date format |

---

### GET `/invoices/expected/{date}`
Return invoices not yet issued (`invoice_date` is null) on active projects whose `due_date` is on or before `date`, plus the total expected value.

**Auth**: None

**Path Parameters**:

| Parameter | Type | Format | Required |
|-----------|------|--------|----------|
| `date` | string | `dd-mm-yyyy` | Yes |

**Response** `200` — `InvoiceListResponse` (same shape as above)

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Invalid date format |

---

## 5. Statuses

### GET `/statuses`
Get all available project status values (used to populate status dropdowns in the frontend).

**Auth**: None

**Response** `200` — array of `ProjectStatusTypePublic` objects:
```json
[
  {
    "id": "uuid",
    "status_name": "active"
  }
]
```

---

## 6. Roles

### GET `/roles/`
List all available roles.

**Auth**: Bearer

**Response** `200` — `RolesPublic`:
```json
{
  "data": [
    {
      "id": "uuid",
      "role_name": "string"
    }
  ],
  "count": 0
}
```

---

### GET `/roles/{role_id}`
Get a specific role by ID.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `role_id` | UUID | Yes |

**Response** `200` — `RolePublic`:
```json
{
  "id": "uuid",
  "role_name": "string"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 404 | Role not found |

---

### POST `/roles/`
Create a new role.

**Auth**: Superuser

**Request Body** — `RoleCreate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `role_name` | string | max 100 chars | Yes |

**Response** `200` — `RolePublic`

**Error Responses**:

| Status | Description |
|--------|-------------|
| 409 | Role name already exists |

---

### PUT `/roles/{role_id}`
Replace a role's details.

**Auth**: Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `role_id` | UUID | Yes |

**Request Body** — `RoleUpdate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `role_name` | string \| null | max 100 chars | No |

**Response** `200` — `RolePublic`

**Error Responses**:

| Status | Description |
|--------|-------------|
| 404 | Role not found |
| 409 | Role name already in use by another role |

---

### DELETE `/roles/{role_id}`
Delete a role. Fails if the role is currently assigned to any user or subcontractor.

**Auth**: Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `role_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "Role deleted successfully"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Role is in use and cannot be deleted |
| 404 | Role not found |

---

## 7. Employees

### GET `/employees/`
List all active employees in the system directory.

**Auth**: Bearer

**Response** `200` — `EmployeesPublic`:
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "string | null",
      "last_name": "string | null",
      "full_name": "string | null",
      "email": "string | null",
      "role_title": "string | null",
      "is_active": true
    }
  ],
  "count": 0
}
```

---

## 8. Customers

### GET `/customers/`
List all customers, ordered by creation date (newest first).

**Auth**: Bearer

**Response** `200` — `CustomersPublic`:
```json
{
  "data": [
    {
      "id": "uuid",
      "contact_name": "string | null",
      "email": "string | null",
      "current_status": "string | null",
      "remarks": "string | null",
      "order_type_id": "uuid | null",
      "created_at": "datetime | null"
    }
  ],
  "count": 0
}
```

---

### POST `/customers/`
Create a new customer record.

**Auth**: Bearer

**Request Body** — `CustomerCreate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `contact_name` | string \| null | max 255 chars | No |
| `email` | string \| null | max 255 chars | No |
| `current_status` | string \| null | max 100 chars | No |
| `remarks` | string \| null | — | No |
| `order_type_id` | UUID \| null | — | No |

**Response** `200` — `CustomerPublic` (single object from the list above)

---

## 9. Subcontractors

### GET `/subcontractors/`
List subcontractors. Superusers see all; project managers see only subcontractors on their projects.

**Auth**: Bearer

**Response** `200` — array of `SubcontractorPublic`:
```json
[
  {
    "id": "uuid",
    "company_name": "string",
    "contact_name": "string | null",
    "contact_email": "string | null",
    "phone": "string | null",
    "specialty": "string | null",
    "role_id": "uuid | null",
    "abn": "string | null",
    "billing_address": "string | null",
    "notes": "string | null",
    "is_active": true,
    "created_at": "datetime | null",
    "updated_at": "datetime | null"
  }
]
```

---

### POST `/subcontractors/`
Create a new subcontractor.

**Auth**: Bearer

**Request Body** — `SubcontractorCreate`:

| Field | Type | Constraints | Required |
|-------|------|-------------|----------|
| `company_name` | string | max 255 chars | Yes |
| `contact_name` | string \| null | max 255 chars | No |
| `contact_email` | string \| null | max 255 chars | No |
| `phone` | string \| null | max 50 chars | No |
| `specialty` | string \| null | max 255 chars | No |
| `role_id` | UUID \| null | — | No |
| `abn` | string \| null | max 20 chars | No |
| `billing_address` | string \| null | max 500 chars | No |
| `notes` | string \| null | — | No |
| `is_active` | boolean | default: `true` | No |

**Response** `201` — `SubcontractorPublic`

---

### PATCH `/subcontractors/{subcontractor_id}`
Update a subcontractor's details.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `subcontractor_id` | UUID | Yes |

**Request Body** — `SubcontractorUpdate` (all fields optional — same fields as create)

**Response** `200` — `SubcontractorPublic`

**Error Responses**:

| Status | Description |
|--------|-------------|
| 404 | Subcontractor not found |

---

### DELETE `/subcontractors/{subcontractor_id}`
Delete a subcontractor. Fails if the subcontractor has active project assignments, materials, or time logs.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `subcontractor_id` | UUID | Yes |

**Response** `200`:
```json
{
  "message": "Subcontractor deleted successfully"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Subcontractor is in use (includes assignment/material/time-log counts) |
| 404 | Subcontractor not found |

---

### GET `/subcontractors/{subcontractor_id}/projects`
List all projects associated with a subcontractor. Superusers see all; project managers see only their own projects.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `subcontractor_id` | UUID | Yes |

**Response** `200` — `ProjectDetailsResponse` (same shape as [GET `/projects`](#get-projects))

**Error Responses**:

| Status | Description |
|--------|-------------|
| 404 | Subcontractor not found |

---

## 10. Materials (Global)

### GET `/materials/`
Get materials across all projects, filtered by due date and/or status.

**Auth**: Bearer

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `due_before` | date | No | Filter materials by project due date |
| `status` | string | No | Filter by material status (e.g. `"N/A"`, `"ordered"`, `"arrived"`) |

**Response** `200` — `MaterialsPublic` (same shape as [GET `/projects/{project_id}/materials`](#get-projectsproject_idmaterials))

---

## 11. Workforce Allocation

All three mutation endpoints operate on the `project_assignments` table. Every successful mutation is written to an audit log recording the caller, timestamp, and what was changed.

**Base path**: `/project/{project_id}/workforce-allocate` (note: no `/api/v1/` prefix — the prefix is handled by the top-level router)

---

### GET `/project/{project_id}/workforce-allocate`
Get the current workforce assignments for a project.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Response** `200` — `WorkforceAllocationListResponse`:
```json
{
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "employee_id": "uuid",
      "role_id": "uuid | null",
      "role_name": "string | null",
      "employee_name": "string | null",
      "created_at": "datetime | null"
    }
  ],
  "count": 0
}
```

---

### POST `/project/{project_id}/workforce-allocate`
Assign one or more employees to a project. Existing assignments for the same employee are not affected.

**Auth**: PM or Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — array of `WorkforceAssignmentRequest`:
```json
[
  {
    "user_id": "uuid",
    "role_id": "uuid"
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | UUID | Yes | UUID of the user to assign |
| `role_id` | UUID | Yes | UUID of the role this user will hold on the project |

**Response** `201` — `WorkforcePostResponse`:
```json
{
  "assigned": 2,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "employee_id": "uuid",
      "role_id": "uuid",
      "created_at": "datetime"
    }
  ]
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Caller is not the project owner or a superuser |
| 404 | Project, user, or role not found |
| 409 | One or more users are already assigned to this project |

---

### PATCH `/project/{project_id}/workforce-allocate`
Update the role of one or more existing project assignments. To reassign a different employee, use DELETE then POST.

**Auth**: PM or Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — array of `WorkforceAssignmentRequest`:
```json
[
  {
    "user_id": "uuid",
    "role_id": "uuid"
  }
]
```

**Response** `200` — `WorkforcePatchResponse`:
```json
{
  "updated": 1,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "employee_id": "uuid",
      "role_id": "uuid",
      "created_at": "datetime"
    }
  ]
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Caller is not the project owner or a superuser |
| 404 | Project, user, role, or existing assignment not found |

---

### DELETE `/project/{project_id}/workforce-allocate`
Remove one or more employees from a project.

**Auth**: PM or Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — `WorkforceDeleteRequest`:
```json
{
  "user_ids": ["uuid", "uuid"]
}
```

**Response** `200` — `WorkforceDeleteResponse`:
```json
{
  "removed": 2,
  "message": "Workforce allocation updated successfully"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Caller is not the project owner or a superuser |
| 404 | Project not found, or one or more users have no assignment on this project |

---

### Audit Log

Every POST, PATCH, and DELETE call to the workforce allocation endpoints writes a record with:

| Field | Description |
|-------|-------------|
| `action` | `"assign"`, `"update_role"`, or `"remove"` |
| `project_id` | Project that was modified |
| `target_user_ids` | Array of affected user UUIDs |
| `performed_by` | UUID of the authenticated caller |
| `timestamp` | UTC datetime of the operation |
| `changes` | JSON snapshot of what was added / changed / removed |

---

## 12. Work Hours

Work hour entries are per-employee, per-project, per-date, and optionally per-task. Only the superuser or the project's assigned project manager may manage (add/update/remove) entries; any authenticated user may read analytics.

**Router prefix**: `/project` (full paths: `/project/{project_id}/work-hours/...`)

---

### POST `/project/{project_id}/work-hours/add`
Add hours to an employee's daily project total. If a time log already exists for the same project/employee/date/task combination, the hours are accumulated on top.

**Auth**: PM or Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — `WorkHoursUpsert`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employee_id` | UUID | Yes | Must be assigned to the project |
| `work_date` | date | Yes | Date the work was performed |
| `hours_worked` | decimal | Yes | Hours to add |
| `task_id` | UUID \| null | No | Optional task to associate |
| `description` | string \| null | No | Notes |

**Response** `200` — `ProjectWorkHoursResponse`:
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "employee_id": "uuid",
  "task_id": "uuid | null",
  "work_date": "date",
  "hours_worked": "decimal",
  "message": "Work hours added successfully."
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 400 | Task does not belong to this project |
| 403 | Caller is not PM or superuser, or employee not assigned to project |
| 404 | Project or task not found |

---

### PATCH `/project/{project_id}/work-hours/update`
Replace (overwrite) an employee's existing daily project hours. Fails if no matching time log exists — use `/add` to create.

**Auth**: PM or Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Request Body** — `WorkHoursUpsert` (same as `/add`)

**Response** `200` — `ProjectWorkHoursResponse` (same shape as `/add`)

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Caller is not PM or superuser, or employee not assigned to project |
| 404 | No work hours found for this employee on the selected date |

---

### DELETE `/project/{project_id}/work-hours/remove`
Remove a specific work-hour entry.

**Auth**: PM or Superuser

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | UUID | Yes | Employee whose hours to remove |
| `work_date` | date | Yes | Date of the log entry to remove |
| `task_id` | UUID | No | Optional — scope removal to a specific task |

**Response** `200`:
```json
{
  "message": "Work hours removed successfully.",
  "project_id": "uuid",
  "employee_id": "uuid",
  "work_date": "date"
}
```

**Error Responses**:

| Status | Description |
|--------|-------------|
| 403 | Caller is not PM or superuser, or employee not assigned to project |
| 404 | No matching time log found |

---

### GET `/project/{project_id}/work-hours/analytics`
Return total work hours per employee for the selected day, week, and month. Used by the analytics dashboard.

**Auth**: Bearer

**Path Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `project_id` | UUID | Yes |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `selected_date` | date | Yes | Reference date for day/week/month aggregations |

**Response** `200` — `ProjectHoursAnalyticsResponse`:
```json
{
  "project_id": "uuid",
  "data": [
    {
      "employee_id": "uuid",
      "employee_name": "string",
      "role_name": "string | null",
      "day_hours": "decimal",
      "week_hours": "decimal",
      "month_hours": "decimal"
    }
  ],
  "count": 0
}
```

---

## 13. Analytics

All analytics endpoints require Bearer authentication. They read aggregated data across projects and time logs — no mutations are made.

---

### GET `/analytics/dashboard-summary`
Returns a high-level summary used by the main dashboard.

**Auth**: Bearer

**Response** `200`:
```json
{
  "response_code": 200,
  "active_projects": 0,
  "total_projects": 0,
  "high_risk_projects": 0,
  "overdue_tasks": 0,
  "uninvoiced_projects": 0,
  "pending_materials": 0,
  "avg_workload_hours": 0.0
}
```

---

### GET `/analytics/risks`
Returns a risk assessment for every active project, sorted by risk score descending.

**Auth**: Bearer

**Risk scoring** (max 100):

| Condition | Points added |
|-----------|-------------|
| Each overdue milestone | +20 (capped at 40) |
| Each pending/unordered material | +25 (capped at 50) |
| Deadline passed | +30 |
| Due within 7 days | +20 |
| Due within 14 days | +10 |

Risk levels: `"Low"` (≤ 30), `"Medium"` (31–60), `"High"` (> 60)

**Response** `200`:
```json
{
  "response_code": 200,
  "risks": [
    {
      "project_id": "uuid",
      "job_number": "string",
      "job_title": "string",
      "status": "string",
      "due_date": "date | null",
      "risk_score": 0,
      "risk_level": "Low | Medium | High",
      "risk_reasons": ["string"],
      "overdue_tasks": 0
    }
  ]
}
```

---

### GET `/analytics/project-health`
Returns project status distribution and milestone/task progress breakdown.

**Auth**: Bearer

**Response** `200`:
```json
{
  "response_code": 200,
  "total_projects": 0,
  "status_distribution": {
    "active": 5,
    "completed": 3
  },
  "task_progress": {
    "todo": 0,
    "in_progress": 0,
    "review": 0,
    "done": 0
  }
}
```

> Milestone progress mapping: `done` = `is_complete`, `review` = progress ≥ 75, `in_progress` = progress > 0, `todo` = progress = 0.

---

### GET `/analytics/workload`
Returns per-employee work hours broken down by month, plus a total and an overload flag (> 160 hours total).

**Auth**: Bearer

**Response** `200`:
```json
{
  "response_code": 200,
  "workload": [
    {
      "user_id": "uuid",
      "name": "string",
      "role": "string | null",
      "monthly": { "Jan": 40.5, "Feb": 80.0 },
      "total_hours": 120.5,
      "overloaded": false
    }
  ]
}
```

---

### GET `/analytics/revenue-leakage`
Returns active projects with uninvoiced revenue (fee minus total invoiced amount).

**Auth**: Bearer

**Response** `200`:
```json
{
  "response_code": 200,
  "total_leakage": 0.0,
  "uninvoiced_projects": [
    {
      "project_id": "uuid",
      "job_number": "string",
      "job_title": "string",
      "status": "string",
      "completion_date": "date | null",
      "uninvoiced_revenue": 0.0,
      "days_overdue": 0
    }
  ]
}
```

---

### GET `/analytics/material-delays`
Returns materials with a pending (`"N/A"` or `"ordered"`) status, sorted by days overdue descending.

**Auth**: Bearer

**Response** `200`:
```json
{
  "response_code": 200,
  "material_delays": [
    {
      "material_id": "uuid",
      "project_id": "uuid",
      "project_name": "string",
      "job_number": "string",
      "material_name": "string",
      "order_status": "string",
      "ordered_date": "date | null",
      "overdue_days": 0,
      "project_due_date": "date | null"
    }
  ]
}
```

---

### GET `/analytics/deadline-trend`
Returns a 7-week rolling breakdown of project risk levels (High / Medium / Low) for the deadline trend chart.

**Auth**: Bearer

**Response** `200`:
```json
{
  "response_code": 200,
  "trend": [
    {
      "week": "May 01",
      "high": 2,
      "medium": 5,
      "low": 10
    }
  ]
}
```

---

## 14. Notifications

### POST `/notifications/trigger-reminders/`
Manually trigger the deadline reminder job. Normally this runs automatically on the daily scheduler (07:30 Adelaide time), but this endpoint allows on-demand triggering.

**Auth**: Superuser

**Request**: None

**Response** `200`:
```json
{
  "message": "Reminders triggered"
}
```

---

## 15. Chatbot

### POST `/chatbot/chat`
Send a message to the AI assistant. The assistant has access to project context and can answer questions, run project queries, and provide insights.

**Auth**: Bearer

**Request Body** — `ChatRequest`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | The user's message |
| `project_id` | integer \| null | No | Scope the assistant to a specific project |

**Response** `200` — `ChatResponse`:
```json
{
  "response": "string",
  "command_used": "string | null",
  "command_data": { } 
}
```

| Field | Description |
|-------|-------------|
| `response` | Natural language reply from the AI |
| `command_used` | Internal command the AI executed (e.g. `"get_project"`) — `null` for conversational replies |
| `command_data` | Structured data returned by the command — `null` for conversational replies |

---

## 16. Utilities

### GET `/utils/health-check/`
Confirm the API is running. No authentication required.

**Auth**: None

**Response** `200`:
```json
true
```

---

### POST `/utils/test-email/`
Send a test email to a given address. Used to verify the email transport configuration.

**Auth**: Superuser

**Query Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| `email_to` | string (email) | Yes |

**Response** `201`:
```json
{
  "message": "Test email sent"
}
```

---

## 17. Background Schedulers

The application runs two autonomous background jobs that start automatically with the server. They can also be triggered on-demand via the Notifications endpoint.

### Daily Deadline Reminder

| Property | Value |
|----------|-------|
| Schedule | Every day at **07:30 Adelaide Time** |
| Trigger | `POST /notifications/trigger-reminders/` (manual) |
| Action | Scans all active projects and tasks for approaching deadlines, then sends personalized email reminders to assigned users |
| Respects | Individual user email preferences (`deadline_reminders` flag) |

### Weekly Invoice Checker

| Property | Value |
|----------|-------|
| Schedule | Every **Monday at 07:30 Adelaide Time** |
| Action | Detects overdue invoices (issued > 14 days ago, unpaid) and sends alerts to relevant stakeholders |

---

## Data Types Reference

| Type | Format / Notes |
|------|---------------|
| `uuid` | RFC 4122 UUID string |
| `date` | `YYYY-MM-DD` (ISO 8601) in JSON; path params use `dd-mm-yyyy` |
| `datetime` | ISO 8601 with timezone offset |
| `decimal` | Numeric string to preserve precision |
| `boolean` | `true` / `false` |

---

## Common Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Bad request — invalid input (e.g. malformed date, constraint violation) |
| `401` | Missing or invalid Bearer token |
| `403` | Authenticated but insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict — resource already exists (duplicate email, role name, assignment) |
| `422` | Validation error — request body failed schema validation |
| `500` | Internal server error |

All error responses follow the FastAPI default shape:
```json
{
  "detail": "Human-readable error message"
}
```
