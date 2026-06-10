// Author: Nevil Bhalodia
// Module: Tasks — Kanban column definitions, priority colours, status pill classes
// Commit reference: refactor: extract Task Board page into modular components

// Static configuration for the Tasks module.
// Centralised so column definitions, priority colours, and avatar
// colours stay in sync between the kanban board, the detail panel,
// and the create-task modal.

import type { TaskPriority } from './types'

// ----- Kanban columns -----
// The four status buckets a task can sit in. Order matters — this is
// the left-to-right rendering order in the kanban board. The `color`
// class is applied to the column background so each lane is visually
// distinguishable even when collapsed.
//
// We use `id` rather than the column title for status matching because
// titles are display-only and could be translated later without breaking
// the underlying status logic.

export const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  {
    id: 'inprogress',
    title: 'In Progress',
    color: 'bg-blue-50 dark:bg-blue-900/20',
  },
  { id: 'review', title: 'Review', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-900/20' },
]

// ----- Priority pill colours -----
// Escalates from neutral gray (low) → blue (medium) → orange (high) →
// red (critical). Matches the day-based alert palette used elsewhere
// in the app (Subcontractors page) for visual consistency.

export const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-200 text-blue-700',
  high: 'bg-orange-200 text-orange-700',
  critical: 'bg-red-200 text-red-700',
}

// ----- Assignee avatar colours -----
// Cycled through by index so each assignee gets a visually distinct
// circle. Kept as an array (not a map) because the cycle position is
// what matters here, not a stable name → colour mapping. If we ever
// need a stable mapping (so the same person gets the same colour
// across the app) we'd switch to a hash-based lookup.

export const assigneeColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-orange-500',
  'bg-green-500',
]