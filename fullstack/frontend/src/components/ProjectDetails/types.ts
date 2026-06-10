// Author: Nevil Bhalodia
// Module: ProjectDetails — shared types (WorkflowPhase, Subtask, Material, WorkforceMember)
// Commit reference: refactor: extract Project Details page into modular components

// Shared types and interfaces for the Project Details page.
// Used by the route file, slide-out panels, modals, and helper utilities
// so all parts of the module agree on the shape of project data.

// ----- Workflow / subtask domain -----

export type SubtaskStatus = 'todo' | 'in-progress' | 'review' | 'done'

export type SubtaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface SubtaskAssignee {
  name: string
  initials: string
  color: string
  // Role on this particular subtask (e.g. 'PM', 'Engineer', 'Drafter')
  // rather than the team-member's general role.
  role: string
  hours: number
}

export interface Subtask {
  id: string
  title: string
  priority: SubtaskPriority
  status: SubtaskStatus
  dueDate: string
  assignees: SubtaskAssignee[]
}

export type WorkflowPhaseStatus = 'pending' | 'in-progress' | 'completed'

export interface WorkflowPhase {
  phase: string
  status: WorkflowPhaseStatus
  progress: number
  // Optional milestone due date. Backend exposes PATCH
  // /projects/{id}/milestones/{id} to persist this — currently
  // local-only until that's wired up.
  dueDate?: string
  subtasks: Subtask[]
}

// ----- Materials / subcontractor orders -----

export type MaterialStatus = 'N/A' | 'Ordered' | 'Received' | 'By Client'

export interface Material {
  name: string
  status: MaterialStatus
  subcontractor: string
  orderedDate: string
  // Flagged true for the three default items Gama always orders
  // (Survey, Soil Testing, Timber Framing). Defaults can't be removed.
  isDefault?: boolean
}

// ----- Workforce / team members -----

export interface WorkforceMember {
  name: string
  role: string
  // Initials shown inside the avatar circle.
  avatar: string
  // Tailwind class for the avatar background.
  color: string
  status: string
}

// ----- Project edit form -----
// Shape of the form data when the user clicks "Edit Project".
// Mirrors the editable subset of the Project type (omits job_number,
// days_elapsed, status — those are managed elsewhere).

export interface ProjectEditForm {
  project_name: string
  company_name: string
  company_address: string
  start_date: string
  due_date: string
}