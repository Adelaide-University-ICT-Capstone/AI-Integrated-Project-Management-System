# Test Cases Documentation

This document summarises the automated test cases currently covered in the project.

The test suite is split into:

| Test Area | Framework | Location | Current Count |
|-----------|-----------|----------|---------------|
| Backend API, CRUD, scripts, chatbot | pytest | `fullstack/backend/tests/` | 78 |
| Frontend end-to-end workflows | Playwright | `fullstack/frontend/tests/` | 41 |
| **Total** | - | - | **119** |

Counts are based on the current test definitions in the repository.

---

## Backend Tests

Backend tests are written with pytest and FastAPI's `TestClient`. They cover API route behaviour, authentication and permissions, CRUD logic, chatbot command handling, and application startup checks.

### Backend Test Files

| File | Count | Coverage Summary |
|------|-------|------------------|
| `fullstack/backend/tests/api/routes/test_users.py` | 27 | User profile, admin user management, permissions, registration, password changes, duplicate email handling, delete-user flows |
| `fullstack/backend/tests/api/routes/test_login.py` | 9 | Access token creation, incorrect password rejection, token validation, password recovery, reset password, bcrypt-to-argon2 upgrade |
| `fullstack/backend/tests/api/routes/test_projects.py` | 9 | Project authentication, project CRUD, visibility and permission rules, project-with-roles response, default milestones, subtasks, task visibility, milestone deletion, project tab grouping |
| `fullstack/backend/tests/api/routes/test_roles.py` | 8 | Role authentication, superuser-only creation/update/delete, duplicate-name rejection, get role, 404 handling, in-use deletion blocking |
| `fullstack/backend/tests/crud/test_user.py` | 10 | User creation, authentication, active/superuser flags, user retrieval/update, bcrypt hash upgrade to argon2 |
| `fullstack/backend/tests/chatbot/test_commands.py` | 4 | Visible project ID filtering, project visibility enforcement, superuser access, invoice summary permission denial |
| `fullstack/backend/tests/chatbot/test_orchestrator.py` | 4 | Invalid LLM command JSON, unknown command rejection, command exception handling, final response failure fallback |
| `fullstack/backend/tests/chatbot/test_chatbot_route.py` | 2 | Chatbot route failure fallback and mocked successful response |
| `fullstack/backend/tests/api/routes/test_employees.py` | 1 | Employee directory endpoint returns directory data |
| `fullstack/backend/tests/api/routes/test_customers.py` | 1 | Customer directory endpoint returns directory data |
| `fullstack/backend/tests/api/routes/test_subcontractors.py` | 1 | Subcontractor list is global while subcontractor project visibility is employee-scoped |
| `fullstack/backend/tests/scripts/test_backend_pre_start.py` | 1 | Backend pre-start database connection check |
| `fullstack/backend/tests/scripts/test_test_pre_start.py` | 1 | Test pre-start database connection check |

### Backend Coverage by Feature

| Feature | Covered Cases |
|---------|---------------|
| Authentication | Login success/failure, token validation, protected endpoint access, invalid credentials |
| Password recovery | Recovery email trigger, missing user handling, reset success, invalid reset token |
| User management | Current user profile, superuser user creation/update/delete, normal user permission denial, duplicate email protection |
| Password updates | Successful password update, incorrect current password, same password rejection, password hash migration |
| Projects | Create/read/update/delete, unauthenticated access rejection, project manager vs normal user permissions, status-only update behaviour |
| Project workflow/tasks | Default milestone creation, subtask creation, assigned task visibility, milestone deletion cascading to tasks |
| Project reporting metadata | Project tab grouping by completion and invoice state, project-with-roles response structure |
| Roles | Role list/create/read/update/delete, duplicate role names, in-use deletion checks |
| Directories | Employee and customer directory responses |
| Subcontractors | Global subcontractor listing and scoped project visibility |
| Chatbot | Command selection fallback, command execution safety, project visibility checks, route response handling |
| Startup checks | Database connectivity during backend/test pre-start scripts |

---

## Frontend Tests

Frontend tests are Playwright end-to-end specs. They exercise browser-visible workflows for authentication, admin user management, password reset, and user settings.

### Frontend Test Files

| File | Count | Coverage Summary |
|------|-------|------------------|
| `fullstack/frontend/tests/login.spec.ts` | 9 | Login form state, forgot-password link, successful login, invalid email/password handling, logout, protected route redirects, invalid token redirects |
| `fullstack/frontend/tests/admin.spec.ts` | 12 | Admin page visibility, add user button, create/edit/delete users, create superuser, cancel creation, validation errors, admin access control |
| `fullstack/frontend/tests/reset-password.spec.ts` | 6 | Password recovery page, reset email link flow, invalid/expired reset link, weak password validation |
| `fullstack/frontend/tests/user-settings.spec.ts` | 14 | Profile tab defaults, tab visibility, name/email updates, validation errors, cancel edit flows, password update validations, appearance/theme persistence |

### Frontend Coverage by Workflow

| Workflow | Covered Cases |
|----------|---------------|
| Login | Empty/editable inputs, visible controls, valid login, invalid credentials, logout |
| Auth guards | Logged-out users blocked from protected routes, invalid token redirects to login |
| Admin users | User create/edit/delete, superuser creation, modal cancellation, form validation |
| Admin permissions | Non-superuser blocked from admin page, superuser allowed |
| Password reset | Recovery form, email reset link, invalid reset link, weak password checks |
| User profile | Profile name/email editing, invalid email validation, cancel restores previous values |
| Password settings | Successful change, weak password, mismatch, same current/new password rejection |
| Appearance | Theme controls visible, theme switching, selected mode persists across sessions |

---