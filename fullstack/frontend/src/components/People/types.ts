// Author: Nevil Bhalodia
// Module: People — shared types for Employee and Customer records
// Commit reference: feat: replace People page coming-soon toasts with working add and edit modals

// Shared types and interfaces for the People module.
// Used by the route file and both modals so we have one source of
// truth for the shape of a Person record.

// ----- PersonType -----
// Drives which conditional field shows in the modal:
//   - 'staff'   → Department field
//   - 'clients' → Company field
// Pluralised to match how the People page state arrays are named
// (staff[], clients[]) and how the tab IDs are spelled.

export type PersonType = 'staff' | 'clients'

// ----- Person -----
// Either a staff member or a client contact. We use one shape for
// both rather than two separate types because the only difference is
// which of `department` or `company` is populated, and a discriminated
// union would force a lot of narrow-here-narrow-there checks in the
// JSX for very little safety gain.

export interface Person {
  id: string
  name: string
  email: string
  phone: string
  role: string
  // Populated for staff members, undefined for clients.
  department?: string
  // Populated for clients, undefined for staff.
  company?: string
  status: 'active' | 'inactive'
}