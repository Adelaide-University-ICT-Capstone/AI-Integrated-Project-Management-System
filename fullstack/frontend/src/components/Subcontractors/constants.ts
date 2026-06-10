// Author: Nevil Bhalodia
// Module: Subcontractors — static constants, colour maps, grid templates
// Commit reference: refactor: extract Subcontractors page into modular components

// Static values used across the Subcontractors module.
// Centralised here so colour maps, service lists, and grid layouts
// stay consistent if styling changes later.

import type { ServiceType, OrderStatus, AlertTone } from './types'

// Master list of services Gama subcontracts out (Harri's spec).
export const SERVICE_TYPES: ServiceType[] = [
  'Survey',
  'Soil Testing',
  'Timber Framing',
  'Other',
]

// Tailwind class strings keyed by alert tone (used for the day-based alerts).
export const alertToneClass: Record<AlertTone, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

// Pill colours for order status (N/A, Ordered, Received, By Client).
export const statusPillClass: Record<OrderStatus, string> = {
  'N/A': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  Ordered:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Received:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'By Client':
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

// Pill colours per service type (used in tables and chips).
export const servicePillClass: Record<ServiceType, string> = {
  Survey:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Soil Testing':
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Timber Framing':
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

// Grid column templates — kept identical between header row and data row
// so columns align perfectly across the subcontractor and service views.
export const ROW_COLS_BY_SC = 'grid-cols-[1.4fr_1.1fr_1fr_1fr_1.1fr_36px]'
export const ROW_COLS_BY_SVC =
  'grid-cols-[1.2fr_1.4fr_1.1fr_1fr_1fr_1.1fr_36px]'