// Author: Nevil Bhalodia
// Module: People — modal for adding a new employee or customer
// Commit reference: feat: replace People page coming-soon toasts with working add and edit modals

// Author: Nevil Bhalodia
// Module: People — shared types for Employee and Customer records
// Commit reference: feat: replace People page coming-soon toasts with working add and edit modals

// Modal for adding a new staff member or client.
// Opens from the "+ Add Staff Member" / "+ Add Client" button in the
// People page header. The same component handles both — the parent
// route passes the active tab (`personType`) so we know whether to
// show the Department or Company field.
//
// We don't generate the id here; the parent route does that so the
// modal stays pure and doesn't need to know about the existing list
// or whether ids are sequential, timestamps, UUIDs, etc.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { Person, PersonType } from './types'

interface AddPersonModalProps {
  personType: PersonType
  onClose: () => void
  // Caller receives the new person without an id — the route generates it.
  onSave: (person: Omit<Person, 'id'>) => void
}

export function AddPersonModal({
  personType,
  onClose,
  onSave,
}: AddPersonModalProps) {
  const isStaff = personType === 'staff'

  // Default status to 'active' since most newly-added people will
  // be active. The form starts empty otherwise so the user types
  // their values fresh.
  const [formData, setFormData] = useState<Omit<Person, 'id'>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    company: '',
    status: 'active',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Inline validation — name and email are the bare minimum to
    // identify a contact later. Phone and the org field are optional
    // because some entries come in with partial info (e.g. a new
    // lead where we only have an email).
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in name and email')
      return
    }
    if (!formData.role.trim()) {
      toast.error('Please enter a role')
      return
    }

    // Strip the field that doesn't apply to this person type so we
    // don't end up with both `department` and `company` populated on
    // the same record.
    onSave({
      ...formData,
      department: isStaff ? formData.department : undefined,
      company: isStaff ? undefined : formData.company,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header — title shifts based on which tab is active */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add {isStaff ? 'Staff Member' : 'Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isStaff ? 'Name' : 'Contact / Company Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={isStaff ? 'e.g., Sarah Chen' : 'e.g., Metro Development Corp'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="name@example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isStaff ? 'Role' : 'Client Type'} *
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              placeholder={isStaff ? 'e.g., Project Manager' : 'e.g., Primary Client'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Department vs Company — only one shows at a time, based on tab */}
          {isStaff ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g., Engineering"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="e.g., Skyline Properties Ltd"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'inactive',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Add {isStaff ? 'Staff Member' : 'Client'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's cod
export default AddPersonModal
