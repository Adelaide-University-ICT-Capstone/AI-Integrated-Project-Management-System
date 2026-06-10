// Author: Nevil Bhalodia
// Module: ProjectDetails — avatar colours, default materials (Harri's spec), status pill classes
// Commit reference: refactor: extract Project Details page into modular components

// Static values used across the Project Details module.
// Centralised so colour maps, default data, and class strings stay
// consistent if styling changes later.

import type {
  Material,
  MaterialStatus,
  SubtaskPriority,
  SubtaskStatus,
} from './types'

// Avatar background colours used for team members.
// Cycled through by index so each new member gets a distinct colour.
export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
]

// Default subcontractor items pre-loaded for every project.
// These three are spec'd by Harri — every job at Gama Consulting needs
// to track Survey, Soil Testing and Timber Framing, so we surface them
// as "Default" pills in the materials grid and prevent their deletion.
export const DEFAULT_MATERIALS: Material[] = [
  {
    name: 'Survey',
    status: 'N/A',
    subcontractor: '',
    orderedDate: '',
    isDefault: true,
  },
  {
    name: 'Soil Testing',
    status: 'N/A',
    subcontractor: '',
    orderedDate: '',
    isDefault: true,
  },
  {
    name: 'Timber Framing',
    status: 'N/A',
    subcontractor: '',
    orderedDate: '',
    isDefault: true,
  },
]

// Pre-populated subcontractor names for the dropdown when assigning
// a contractor to a material order. Sourced from the demo dataset; real
// values should come from the subcontractors API in production.
export const SUBCONTRACTORS = [
  'ABC Surveyors',
  'GeoCon Labs',
  'Steel Supply Co',
  'Premier Concrete',
  'Reliable Timber Co',
]

// Pill colours for the four material statuses (N/A, Ordered, Received, By Client).
// Mirrors the day-based alert palette so the dashboard reads consistently.
export const materialStatusPillClass: Record<MaterialStatus, string> = {
  Received:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Ordered:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'By Client':
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'N/A': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

// Pill colours for the team-member availability badge.
export const workforceStatusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  available:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

// Default fallback for any workforce status that isn't in workforceStatusColor.
export const workforceStatusDefault =
  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'

// Subtask priority pill colours (escalates from gray → blue → orange → red).
export const subtaskPriorityClass: Record<SubtaskPriority, string> = {
  low: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// Subtask status pill colours.
export const subtaskStatusClass: Record<SubtaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'in-progress':
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  review:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
