// Author: Nevil Bhalodia
// Module: ProjectDetails — modal for adding a team member to project workforce
// Commit reference: refactor: extract Project Details page into modular components

// Modal for adding a new team member to the project's workforce.
// Opens from the "+ Add Member" button in the WorkforceSection header.
// Collects the basic member info; the parent route handles assigning
// the avatar initials and the cycling background colour so this modal
// doesn't need to know about the existing workforce array.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'

interface AddWorkerModalProps {
  onClose: () => void
  // Only the three editable fields — initials and colour are derived
  // by the parent (initials from name, colour cycled from AVATAR_COLORS).
  onSave: (worker: { name: string; role: string; status: string }) => void
}

export function AddWorkerModal({ onClose, onSave }: AddWorkerModalProps) {
  // Default to 'active' status — most members added to a project are
  // expected to start working on it immediately. 'available' is for
  // members on standby who can be assigned later.
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    status: 'active',
  })
  
  const handleSubmit = () => {
    // Both name and role are required so the workforce card has enough
    // information to be useful. Empty role would leave the card looking
    // half-finished.
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error('Please fill in name and role')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Sarah Chen"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              placeholder="e.g., Project Manager"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="available">Available</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Add Member
            </button>
            <button
              onClick={onClose}
              className="px-6 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's code-splitting (same workaround as the other panels).
export default AddWorkerModal