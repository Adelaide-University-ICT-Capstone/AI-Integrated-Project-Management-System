// Pure helper functions used across the Subcontractors module.
// Everything here is stateless and side-effect-free so the functions
// can be unit-tested in isolation if needed.

import type { Order, OrderAlert, OrderStatus, ServiceType } from './types'
import { SERVICE_TYPES, servicePillClass } from './constants'

// Days between the supplied date string and today (whole-day diff).
// Returns 0 for empty/invalid input so calling code doesn't need extra
// null checks before doing comparisons against thresholds.
export const daysBetween = (dateStr: string): number => {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.floor((t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

// Day-based alert thresholds per Harri's spec:
//   <7 days  → green (on track)
//   7-20    → yellow (over a week, send daily reminder)
//   >=21    → red (follow-up urgently)
// Received / By Client / N/A short-circuit to green/gray since no
// chasing is required for those states.
export const getOrderAlert = (order: Order): OrderAlert => {
  if (order.status === 'Received') return { label: '✓ Done', tone: 'green' }
  if (order.status === 'By Client') return { label: '✓ N/A', tone: 'green' }
  if (order.status === 'N/A') return { label: '—', tone: 'gray' }

  const days = daysBetween(order.orderedDate)
  if (days >= 30) return { label: '🚨 >30d follow-up', tone: 'red' }
  if (days >= 21) return { label: '🚨 >21d follow-up', tone: 'red' }
  if (days >= 7) return { label: '⏰ >7d', tone: 'yellow' }
  return { label: '✓ On track', tone: 'green' }
}

// Coerce a free-text service string from the backend into one of our
// four canonical service types. Unknown values fall back to 'Other'
// so the UI never blows up on unexpected backend data.
export const mapStringToServiceType = (service: string): ServiceType => {
  switch (service.toLowerCase()) {
    case 'survey':
      return 'Survey'
    case 'soil testing':
      return 'Soil Testing'
    case 'timber framing':
      return 'Timber Framing'
    default:
      return 'Other'
  }
}

// Map backend status strings (lowercase / snake_case) to our display values.
export const mapMaterialStatus = (
  status: string | null | undefined,
): OrderStatus => {
  if (!status) return 'N/A'
  switch (status.toLowerCase()) {
    case 'ordered':
      return 'Ordered'
    case 'received':
      return 'Received'
    case 'by client':
    case 'by_client':
      return 'By Client'
    default:
      return 'N/A'
  }
}

// Inverse of mapMaterialStatus — used when sending status updates
// back to the backend in the format it expects.
export const mapStatus = (status: OrderStatus): string => {
  switch (status) {
    case 'Ordered':
      return 'ordered'
    case 'Received':
      return 'received'
    case 'By Client':
      return 'by_client'
    default:
      return 'N/A'
  }
}

// Safe lookup for service pill colour — falls back to neutral gray
// if the service string isn't one of the recognised SERVICE_TYPES.
export const getServicePillClass = (service: string): string =>
  SERVICE_TYPES.includes(service as ServiceType)
    ? servicePillClass[service as ServiceType]
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'

// Pick a deterministic avatar background colour from a name.
// Same name will always produce the same colour, so the UI is stable
// across refreshes.
export const avatarColorFromName = (name: string): string => {
  const colors = [
    'bg-blue-600',
    'bg-purple-600',
    'bg-orange-600',
    'bg-teal-600',
    'bg-pink-600',
    'bg-green-600',
    'bg-indigo-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// First letter of each word in a name, max 2 chars, uppercase.
// Used for the avatar circle text (e.g. "Big Wood Suppliers" -> "BW").
export const initials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

// Human-readable relative date for "When Ordered" column.
export const formatDaysAgo = (dateStr: string): string => {
  if (!dateStr) return '—'
  const d = daysBetween(dateStr)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  return `${d} days ago`
}