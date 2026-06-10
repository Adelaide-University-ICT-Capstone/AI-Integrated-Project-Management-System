// Author: Nevil Bhalodia
// Module: ProjectDetails — due-date colour coding, progress helpers, initials/avatar utilities
// Commit reference: refactor: extract Project Details page into modular components

// Pure helper functions used across the Project Details module.
// Stateless and side-effect-free so they can be unit-tested in isolation.

import type {
  MaterialStatus,
  SubtaskStatus,
} from './types'
import {
  materialStatusPillClass,
  workforceStatusColor,
  workforceStatusDefault,
} from './constants'

// ----- Material helpers -----

// Pick the right Tailwind class for a material status pill.
// Defaults to the gray N/A style if an unexpected value sneaks in.
export const getMaterialStatusPillClass = (status: MaterialStatus): string =>
  materialStatusPillClass[status] ?? materialStatusPillClass['N/A']

// ----- Workforce helpers -----

// Pick the right colour for the team-member availability badge.
// Falls back to a neutral gray for any status string we don't recognise.
export const getWorkforceStatusColor = (status: string): string =>
  workforceStatusColor[status] ?? workforceStatusDefault

// ----- Subtask due-date helpers -----

// Colour-code the due date based on how soon it is.
// Per Harri's spec the thresholds are:
//   < 0 days   → red (overdue)
//   < 3 days   → orange (urgent)
//   < 7 days   → yellow (this week)
//   >= 7 days  → gray (plenty of time)
// Completed subtasks always render gray regardless of the date.
export const getSubtaskDueDateColor = (
  dueDate: string,
  status: SubtaskStatus,
): string => {
  if (status === 'done') return 'text-gray-500 dark:text-gray-400'
  if (!dueDate) return 'text-gray-500 dark:text-gray-400'

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
  return 'text-gray-600 dark:text-gray-400'
}

// Human-readable countdown label that matches the colour above.
// Returns '' for missing dates so the caller can conditionally render.
export const getSubtaskDueDateLabel = (
  dueDate: string,
  status: SubtaskStatus,
): string => {
  if (status === 'done') return 'Completed'
  if (!dueDate) return ''

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `${diffDays} days left`
}

// ----- Avatar / initials helpers -----

// First letter of each word in a name, max 2 chars, uppercase.
// Used for the avatar circle when adding new team members.
export const getInitialsFromName = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

// ----- Progress circle helpers -----

// Average progress across all workflow phases.
// Returns 0 if there are no phases yet so we don't divide by zero.
export const calcOverallProgress = (
  progresses: number[],
): number => {
  if (progresses.length === 0) return 0
  return Math.round(
    progresses.reduce((sum, p) => sum + p, 0) / progresses.length,
  )
}

// Pick the colour class for the progress circle based on completion.
// >= 80% green, >= 50% blue, otherwise yellow.
export const getProgressCircleColor = (overallProgress: number): string => {
  if (overallProgress >= 80) return 'text-green-600'
  if (overallProgress >= 50) return 'text-blue-600'
  return 'text-yellow-600'
}
