# User Documentation

**AI-Integrated Project Management System**
**Audience:** All system users — staff, project managers, and administrators
**Version:** 1.0

---

## 1. Getting Started

### 1.1 Accessing the System

**Live (deployed) application:**

```
https://ai-integrated-project-management-sy.vercel.app
```

**Local development (when running via Docker):**

```
http://localhost:5173
```

> The live application is hosted on Vercel. For local development, follow the setup steps in the Technical Documentation to run the full stack with Docker Compose.

### 1.2 Logging In

1. On the login page, enter your **email address** and **password**
2. Click **Sign In**
3. You will be taken to the Dashboard

If you cannot log in, contact your system administrator to confirm your account is active.

### 1.3 Recovering a Forgotten Password

1. On the login page, click **Forgot your password?**
2. Enter the email address associated with your account
3. Check your inbox for a password reset link
4. Click the link and enter a new password (minimum 8 characters)

> Password reset links expire — if yours has expired, request a new one.

### 1.4 Changing Your Password

1. Click your name in the top navigation bar, or go to **Settings**
2. Select **Change Password**
3. Enter your current password, then your new password twice
4. Click **Save**

---

## 2. Dashboard

The Dashboard is your home page. It shows a real-time summary of everything happening across projects.

### 2.1 Summary Cards

| Card | What it shows |
|------|--------------|
| **Active Projects** | Number of projects currently in progress |
| **High Risk Projects** | Projects with a risk score above 60 |
| **Overdue Tasks** | Milestones past their due date and not complete |
| **Pending Materials** | Materials still in N/A or Ordered status |
| **Uninvoiced Projects** | Projects ready to invoice but not yet invoiced |
| **Avg. Workload Hours** | Average hours logged per employee in the last 30 days |

### 2.2 Navigating from the Dashboard

Click any summary card to jump to the relevant section of the system. Use the left sidebar to navigate to any page at any time.

---

## 3. Projects

### 3.1 Viewing All Projects

Click **Projects** in the sidebar. You will see a table of all projects you have access to:
- **Superusers** see all projects
- **Project Managers and staff** see only projects they are assigned to

You can filter projects by status using the dropdown at the top of the table.

### 3.2 Creating a New Project

> Only authenticated users with the appropriate role can create projects. Contact your administrator if you do not see the **New Project** button.

1. Click **New Project** (top right of the Projects page)
2. Fill in the required fields:
   - **Job Number** — unique identifier for the project
   - **Project Name** — descriptive name
   - **Client Name** — the client contact person
   - **Client Company** — the client's organisation (optional)
   - **Date Received** — when the brief was received
   - **Start Date** — when work begins
   - **Due Date** — the project deadline
   - **Fee Estimate** — expected revenue (optional)
3. Click **Create Project**

### 3.3 Viewing a Project

Click any project row to open the Project Details page. You will see:

- **Overview** — dates, fee, current status, client details
- **Team** — employees assigned to the project and their roles
- **Workflow / Milestones** — phases of work with progress and due dates
- **Tasks** — tasks under each milestone
- **Materials** — materials ordered or required for the project
- **Work Hours** — time logged by team members

### 3.4 Updating a Project

On the Project Details page:
1. Click the **Edit** button (pencil icon) next to the field you want to change
2. Update the value
3. Click **Save**

You can update:
- Project status (e.g., move from "Design" to "Construction")
- Dates and fee estimate
- Project name

> Only the project manager for the project or a superuser can edit project details.

### 3.5 Deleting a Project

On the Project Details page, click **Delete Project**. You will be asked to confirm. Deletion is permanent and removes all milestones, tasks, and associated data.

> Only the project manager or a superuser can delete a project.

---

## 4. Milestones and Tasks

Milestones are the phases of work within a project (e.g., "Design", "Council Approval", "Construction"). Each milestone contains tasks.

### 4.1 Adding a Milestone

1. On the Project Details page, go to the **Workflow** section
2. Click **Add Milestone**
3. Enter a name, due date, and initial progress percentage
4. Click **Save**

### 4.2 Updating Milestone Progress

1. Find the milestone in the Workflow section
2. Drag the progress slider or click the percentage to edit it
3. When a milestone is fully complete, check the **Complete** checkbox

### 4.3 Adding a Task

1. Click on a milestone to expand it
2. Click **Add Task**
3. Enter a task name and optionally assign it to a team member
4. Click **Save**

### 4.4 Completing a Task

1. Find the task in the milestone view or on the **Task Board**
2. Click the checkbox next to the task to mark it complete

> Tasks are only visible to the user they are assigned to (unless you are a superuser or project manager).

---

## 5. Task Board

The **Task Board** page shows tasks across all your projects in a board layout.

- Use the **Project** filter to see tasks for a specific project
- Click a task card to see its details in a side panel
- Click **View Project** in the task detail panel to jump to the full project

---

## 6. Workforce Management

### 6.1 Viewing Project Team

On the Project Details page, go to the **Team** section to see everyone assigned to the project and their role.

### 6.2 Assigning Team Members

> Only the project manager or a superuser can manage team assignments.

1. On the Project Details page, in the **Team** section, click **Add Member**
2. Select an employee from the dropdown
3. Select their role on this project
4. Click **Assign**

### 6.3 Changing a Team Member's Role

1. In the **Team** section, find the team member
2. Click the role dropdown next to their name
3. Select the new role
4. Click **Save**

### 6.4 Removing a Team Member

1. In the **Team** section, find the team member
2. Click the **Remove** (trash) icon
3. Confirm the removal

> All changes to team assignments are logged in the audit trail for accountability.

---

## 7. Work Hours

### 7.1 Logging Work Hours

> Only the project manager or a superuser can log hours on behalf of team members.

1. On the Project Details page, go to **Work Hours**
2. Click **Add Hours**
3. Select the team member and date
4. Enter hours worked
5. Optionally link to a specific task and add a description
6. Click **Save**

If a log already exists for that employee/date/task, the hours are added on top.

### 7.2 Editing Work Hours

1. In the **Work Hours** section, find the entry
2. Click **Edit**
3. Enter the correct hours (this replaces the existing value)
4. Click **Save**

### 7.3 Viewing Hours Analytics

On the Project Details page, the **Work Hours** section shows per-employee totals broken down by:
- **Today** (selected date)
- **This week** (Mon–Sun containing the selected date)
- **This month**

Use the date picker to view a different week or month.

---

## 8. Materials

### 8.1 Adding a Material

1. On the Project Details page, go to **Materials**
2. Click **Add Material**
3. Fill in the name, quantity, unit cost, supplier, and initial status
4. Click **Save**

### 8.2 Updating Material Status

1. Find the material in the Materials list
2. Click the **Status** dropdown
3. Select the new status: `N/A`, `Ordered`, `Arrived`, or `Installed`
4. The change saves automatically

### 8.3 Material Status Meanings

| Status | Meaning |
|--------|---------|
| N/A | Not yet ordered or not applicable |
| Ordered | Purchase order has been placed |
| Arrived | Material is on-site |
| Installed | Material has been installed |

---

## 9. Subcontractors

The **Subcontractors** page manages external contractors who work on your projects.

### 9.1 Viewing Subcontractors

Click **Subcontractors** in the sidebar. You will see a list of all subcontractors you have access to.

### 9.2 Adding a Subcontractor

1. Click **New Subcontractor**
2. Fill in company name, contact details, specialty, and ABN
3. Click **Save**

### 9.3 Editing a Subcontractor

Click on a subcontractor card or the edit icon to update their details.

### 9.4 Deleting a Subcontractor

Click the delete icon. If the subcontractor is associated with active project assignments or materials, deletion will be blocked. Resolve those associations first.

---

## 10. Analytics

Click **Analytics** in the sidebar to access the analytics dashboard.

### 10.1 Risk Assessment

The **Risks** tab shows each active project with a risk score (0–100) and risk level:

| Level | Score | Meaning |
|-------|-------|---------|
| Low | 0–30 | Project on track |
| Medium | 31–60 | Some concern — review milestones or deadlines |
| High | 61–100 | Immediate attention required |

Risk is calculated from: overdue milestones, pending materials, and deadline proximity.

### 10.2 Project Health

The **Project Health** tab shows:
- Distribution of projects across status types (pie/bar chart)
- Breakdown of milestone progress: To Do / In Progress / In Review / Done

### 10.3 Workload

The **Workload** tab shows hours logged per employee, broken down monthly. Employees with more than 160 hours total are flagged as potentially overloaded.

### 10.4 Revenue Leakage

The **Revenue Leakage** tab highlights projects where the final fee exceeds the total amount invoiced — indicating revenue that has not yet been collected.

### 10.5 Material Delays

The **Material Delays** tab lists materials still in N/A or Ordered status, sorted by how long they have been waiting.

---

## 11. People

The **People** page has two tabs:

### 11.1 Staff Tab

Lists all active employees in the system with their name, email, and role. Used to look up who to assign to a project.

### 11.2 Clients Tab

Lists customer records (client companies and contacts). Useful for finding client contact details without opening a project.

---

## 12. Email Notifications

The system sends automatic email reminders to keep you on top of deadlines.

### 12.1 What emails you receive

| Email type | When it is sent |
|-----------|----------------|
| **Deadline Reminder** | Daily at 7:30 AM, if a project or milestone you are assigned to is approaching its due date |
| **Invoice Alert** | Weekly on Mondays, for overdue unpaid invoices (superusers / admins only) |


---

## 13. AI Assistant

Click **AI Assistant** in the sidebar to chat with the AI about your projects.

### 13.1 Asking Questions

Type your question in the chat input and press Enter. Examples:
- "Which projects are overdue?"
- "How many hours has the team logged this month on Project X?"
- "What materials are still pending?"
- "Summarise the status of all high-risk projects"

### 13.2 Project-Scoped Questions

To ask about a specific project, open that project's detail page and use the chat from there — the assistant will automatically scope its answers to that project.

### 13.3 Limitations

- The assistant can answer questions and summarise data; it cannot modify records
- Responses are based on the current state of the database at the time you ask
- Very complex multi-step calculations may not be perfectly accurate — always verify against the analytics page for critical decisions

---

## 14. Settings

Navigate to **Settings** to manage your account.

| Setting | Description |
|---------|-------------|
| **Profile** | Update your display name and email address |
| **Password** | Change your login password |

> Superusers also see an **Admin** section for managing all user accounts and system roles.

---

## 15. Admin (Superusers Only)

Accessible via **Admin** in the sidebar.

### 15.1 Managing Users

1. Go to **Admin → People**
2. To create a user: click **New User**, enter their email, password, and role, then click **Create**
3. To deactivate a user: click the user row → toggle **Active** off → **Save**
4. To delete a user: click the trash icon → confirm

### 15.2 Managing Roles

1. Go to **Admin → Settings**
2. Under **Roles**, click **New Role** to create a role
3. Click a role to rename it
4. Click the trash icon to delete a role (blocked if the role is in use)


---

## 16. Frequently Asked Questions

**Q: I can't see a project I was told I'm assigned to.**
A: Ask your project manager to confirm your assignment on the Workforce section of that project. You may also need to refresh the page.

**Q: I marked a task complete but it is still showing as incomplete.**
A: Try refreshing the page. If the problem persists, check your internet connection and try again.

**Q: I can't edit a project — the edit button is greyed out.**
A: Only the project manager or a superuser can edit projects. Contact your project manager or administrator.

**Q: A material shows as "N/A" but it has already arrived.**
A: Update the material status to "Arrived". Go to the project's Materials section, click the status dropdown for that material, and select "Arrived".

**Q: How do I export a report?**
A: Report export is not available in v1. Use the analytics pages and take screenshots, or ask your administrator to run a database query.
