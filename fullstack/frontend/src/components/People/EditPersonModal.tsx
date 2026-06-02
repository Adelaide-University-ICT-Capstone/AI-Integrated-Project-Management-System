// Modal for editing an existing staff member or client.
// Opens from the pencil (Edit) icon in the People table rows.
// Same layout as AddPersonModal but the form is pre-populated with
// the person's current values so the user only has to change what
// they want — no retyping everything.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { Person, PersonType } from './types'

interface EditPersonModalProps {
  person: Person
  personType: PersonType
  onClose: () => void
  // Caller receives the full Person (id included) so it can swap the
  // updated record into the list at the right index without a lookup.
  onSave: (person: Person) => void
}

export function EditPersonModal({
  person,
  personType,
  onClose,
  onSave,
}: EditPersonModalProps) {
  const isStaff = personType === 'staff'

  // Initialise the form with the existing person's values so the user
  // sees what's currently saved and can adjust from there. Falling
  // back to '' for optional fields keeps the inputs as controlled
  // components (React complains if value goes from undefined → string).
  const [formData, setFormData] = useState({
    name: person.name,
    email: person.email,
    phone: person.phone,
    role: person.role,
    department: person.department ?? '',
    company: person.company ?? '',
    status: person.status,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in name and email')
      return
    }
    if (!formData.role.trim()) {
      toast.error('Please enter a role')
      return
    }

    // Spread the original person first so we preserve its id (and any
    // other future fields we haven't surfaced in the form yet), then
    // overwrite with the user's edits. Department / company gets
    // cleared on the side that doesn't apply to this person type so
    // we don't carry stale data between tabs.
    onSave({
      ...person,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      department: isStaff ? formData.department : undefined,
      company: isStaff ? undefined : formData.company,
      status: formData.status,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header with the person's name as a subtitle so the user can
            confirm they're editing the right record at a glance. */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit {isStaff ? 'Staff Member' : 'Client'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {person.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form — identical layout to AddPersonModal so users get the
            same shape whether they're adding or editing. */}
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Department for staff, Company for clients */}
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
              Save Changes
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
// TanStack Router's code-splitting (same workaround as the other panels).
export default EditPersonModal