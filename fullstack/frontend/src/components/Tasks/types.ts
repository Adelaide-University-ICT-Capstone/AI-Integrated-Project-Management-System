// Author: Nevil Bhalodia
// Module: Tasks — shared types for the Kanban board (Task, TaskStatus, TaskPriority)
// Commit reference: refactor: extract Task Board page into modular components

// Shared types and interfaces for the Tasks module.
// Re-used across the route file, kanban columns, task cards, the
// slide-out detail panel, and the create-task modal so all parts of
// the module agree on the shape of task data.

// ----- Priority -----
// Four-level priority enum, escalating from low to critical.
// We derive this from the due date rather than letting the backend
// dictate it — see utils.getPriority for the rules.

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

// ----- Assignee -----
// Render-friendly shape of a person/role assigned to a task.
// We keep `name`, `initials` and `color` pre-computed so the JSX
// doesn't have to derive them every render. `hours` is the number
// of allocated hours on this specific task (not the assignee's total).

export interface Assignee {
  name: string
  role: string
  initials: string
  hours: number
  color: string
}

// ----- Task -----
// The denormalised shape we feed to the UI. The backend returns a
// nested tree of milestones → tasks → child-tasks, so utils.flattenTaskNodes
// walks that tree and produces a flat Task[] with the project info
// already embedded.

export interface Task {
  id: string
  projectId: string
  milestoneId: string
  // Null at the root of a milestone; populated for nested child tasks.
  parentTaskId?: string | null
  jobNumber: string
  workflowPhase: string
  title: string
  description: string
  // Normalised kanban status: 'todo' | 'inprogress' | 'review' | 'done'.
  // Kept as a plain string so we can match against the columns config
  // and avoid a circular dependency between types and constants.
  status: string
  priority: TaskPriority
  // Display name of the project — denormalised so the kanban card
  // doesn't have to look it up from the projects list every render.
  project: string
  // Role assigned to the task, or 'Unassigned' if none.
  assignee: string
  assignedRoleId?: string | null
  allocatedHours: number
  dueDate: string
  // Optional AI-generated risk warning shown in the detail panel.
  aiRisk?: string
  assignees?: Assignee[]
}

// ----- Form shapes -----
// Mirror the editable subset of Task — we keep them as separate types
// rather than Partial<Task> so the form validation rules can require
// specific fields without TypeScript getting confused about which
// ones are optional in the source.

export type TaskFormData = {
  projectId: string
  milestoneId: string
  taskName: string
  taskDescription: string
  dueDate: string
  assignedRoleId: string
  // Stored as a string while the user is typing so the input field
  // can show partial values; coerced to a number when the form is
  // submitted.
  allocatedHours: string
}

export type TaskEditFormData = {
  taskName: string
  taskDescription: string
  dueDate: string
  assignedRoleId: string
  allocatedHours: string
  // Includes status because editing in the detail panel lets the user
  // change the kanban column inline.
  status: string
}