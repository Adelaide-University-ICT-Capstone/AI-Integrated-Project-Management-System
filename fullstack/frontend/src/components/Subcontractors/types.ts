// Shared types and interfaces for the Subcontractors module.
// Re-used across the route file, modals, panels, and helper utilities.

export type ServiceType = 'Survey' | 'Soil Testing' | 'Timber Framing' | 'Other'

export type OrderStatus = 'N/A' | 'Ordered' | 'Received' | 'By Client'

export type AlertTone = 'green' | 'yellow' | 'red' | 'gray'

export interface Subcontractor {
  id: string
  name: string
  email: string
  phone: string
  services: ServiceType[]
}


export interface Order {
  id: string
  subcontractorId: string
  service: string
  projectId: string
  projectJobNumber?: string
  orderedDate: string
  status: OrderStatus
  isPlaceholder?: boolean
}

export interface OrderAlert {
  label: string
  tone: AlertTone
}