// Pure helper functions used across the Tasks module.
// Stateless and side-effect-free so they can be unit-tested in isolation.
// The trickiest one is flattenTaskNodes — it walks the nested
// milestone → tasks → child-tasks tree the backend returns and
// produces a flat Task[] the kanban board can render directly.

import type {
  ProjectMilestoneNode,
  ProjectTaskManagementProject,
  ProjectTaskManagementResponse,
  ProjectTaskNode,
} from '@/api/taskManagement'
import type { Task, TaskPriority } from './types'

// ----- Generic helpers -----

// Two-character uppercase initials. Falls back to 'NA' when the name
// is missing or empty so the avatar circle never renders blank.
export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NA'

// Coerce anything that looks like a number into a safe finite number.
// Used a lot when reading the backend response since allocated_hours
// and due_date offsets come back as nullable strings sometimes.
export const toNumber = (value?: number | string | null) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

// ----- Status helpers -----

// The backend stores statuses in a few different shapes (spaces,
// underscores, dashes) so we normalise to one of the four kanban
// IDs. Anything we don't recognise falls into 'todo' so unknown
// tasks still show up rather than disappearing.
export const normalizeTaskStatus = (status?: string | null) => {
  const normalized = (status || '').toLowerCase().replace(/[\s_-]/g, '')
  if (['done', 'complete', 'completed'].includes(normalized)) return 'done'
  if (['inprogress', 'progress', 'doing'].includes(normalized))
    return 'inprogress'
  if (['review', 'qa', 'checking'].includes(normalized)) return 'review'
  return 'todo'
}

// ----- Priority + due date helpers -----

// Derive priority from how close the due date is, not from a stored
// field. Reasoning: priority drifts with time anyway, so reading it
// from the date keeps the kanban honest. 'done' tasks are pinned at
// medium so they don't keep flashing red after they're already finished.
export const getPriority = (
  dueDate?: string | null,
  status?: string | null,
): TaskPriority => {
  if (!dueDate || normalizeTaskStatus(status) === 'done') return 'medium'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays < 0) return 'critical'
  if (diffDays < 3) return 'high'
  if (diffDays < 7) return 'medium'
  return 'low'
}

// Pair-of helpers for the detail panel's due-date display.
// Colour scales with urgency and the label is a humanised countdown.
// Both return safe defaults so callers don't need to null-check.

export const getDueDateColor = (dueDate: string, status: string) => {
  if (!dueDate || status === 'done') return 'text-gray-500 dark:text-gray-400'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays < 0) return 'text-red-600 font-semibold'
  if (diffDays < 3) return 'text-orange-600 font-semibold'
  if (diffDays < 7) return 'text-yellow-600 font-medium'
  if (diffDays < 14) return 'text-green-600'
  return 'text-gray-500 dark:text-gray-400'
}

export const getDueDateLabel = (dueDate: string, status: string) => {
  if (!dueDate || status === 'done') return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays < 14) return `${diffDays} days left`
  return null
}

// ----- Project label helpers -----

// Try increasingly less-specific name fields before falling back to
// the project ID. Different projects in the dataset have populated
// different subsets of these fields, so we go down the list until we
// find something usable.
export const getProjectName = (project: ProjectTaskManagementProject) =>
  project.project_name ||
  project.contract_title ||
  project.job_title ||
  project.job_number ||
  project.project_id

// Compact label used on the project filter tabs. The job number is
// short and uniquely identifies the project, so we prefer that over
// the full name when there's room for one or the other.
export const getProjectTabLabel = (project: ProjectTaskManagementProject) =>
  project.job_number || getProjectName(project)

// ----- Task tree flattening -----

// Reduces the same rows into a Record keyed by project ID, so the
// new-task modal can populate the milestone dropdown once the user
// picks a project. We need to look up milestones-per-project a lot
// so we pre-build the map rather than filtering on every render.
export const buildMilestonesByProject = (
  rows: Array<{
    project: ProjectTaskManagementProject
    taskManagement: ProjectTaskManagementResponse
  }>,
) =>
  rows.reduce<Record<string, ProjectMilestoneNode[]>>((acc, row) => {
    acc[row.project.project_id] = row.taskManagement.milestones
    return acc
  }, {})