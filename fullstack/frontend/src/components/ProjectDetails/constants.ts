// Author: Nevil Bhalodia
// Module: ProjectDetails — avatar colours, default materials (Harri's spec), status pill classes
// Commit reference: refactor: extract Project Details page into modular components

// Static values used across the Project Details module.
// Centralised so colour maps, default data, and class strings stay
// consistent if styling changes later.
import type { MaterialStatus, SubtaskPriority, SubtaskStatus } from './types'

export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
]

export const materialStatusPillClass: Record<MaterialStatus, string> = {
  Received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Ordered: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'By Client': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'N/A': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export const workforceStatusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  available: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

export const workforceStatusDefault = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'

export const subtaskPriorityClass: Record<SubtaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const subtaskStatusClass: Record<SubtaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
