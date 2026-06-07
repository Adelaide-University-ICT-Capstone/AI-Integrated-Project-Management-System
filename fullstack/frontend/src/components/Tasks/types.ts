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
  parentTaskId?: string | null
  jobNumber: string
  workflowPhase: string
  title: string
  description: string
  status: string
  priority: TaskPriority
  project: string
  assignee: string
  assignedEmployeeId?: string | null
  allocatedHours: number
  dueDate: string
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
  assignedEmployeeId: string
  allocatedHours: string
}


export type TaskEditFormData = {
  taskName: string
  taskDescription: string
  dueDate: string
  assignedEmployeeId: string
  allocatedHours: string
  status: string
}