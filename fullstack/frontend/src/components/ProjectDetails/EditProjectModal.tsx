// Author: Nevil Bhalodia
// Module: ProjectDetails — Edit Project modal with PATCH backend integration
// Commit reference: feat: add Edit Project modal with PATCH backend integration

// Modal for editing the basic details of an existing project.
// Opens from the "Edit Project" button in the header of the Project
// Details page. Pre-filled with the current project's values so the
// user sees what's saved and can adjust from there. Status, job number,
// and days_elapsed are intentionally NOT editable here:
//   - Status has its own dropdown next to the project header
//   - Job number is the immutable identifier
//   - Days elapsed is auto-calculated from the start date

import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import type { ProjectEditForm } from './types'

interface EditProjectModalProps {
  editForm: ProjectEditForm
  onClose: () => void
  onChange: (form: ProjectEditForm) => void
  onSave: () => void
}

export function EditProjectModal({
  editForm,
  onClose,
  onChange,
  onSave,
}: EditProjectModalProps) {
  // Validation is intentionally light — only project_name is required.
  // The rest can be edited later or left blank if the data isn't known
  // yet (e.g. dates for very early-stage proposals).
  const handleSave = () => {
    if (!editForm.project_name.trim()) {
      toast.error('Project name is required')
      return
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Project
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form fields — note we update the WHOLE form object on each
            change. This keeps the parent's state structure simple and
            avoids prop-drilling individual setters per field. */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={editForm.project_name}
              onChange={(e) =>
                onChange({ ...editForm, project_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Downtown Office Complex"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client / Company Name
            </label>
            <input
              type="text"
              value={editForm.company_name}
              onChange={(e) =>
                onChange({ ...editForm, company_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Metro Development Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Address
            </label>
            <input
              type="text"
              value={editForm.address || ''}
              onChange={(e) =>
                onChange({ ...editForm, address: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 123 Main St, Downtown"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={editForm.client_name}
              onChange={(e) =>
                onChange({ ...editForm, client_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fee Estimate
            </label>
            <input
              type="text"
              value={editForm.fee_estimate}
              onChange={(e) =>
                onChange({ ...editForm, fee_estimate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 15000"
            />
          </div>

          {/* Start + Due dates side by side — both are small enough to
              fit in a two-column row and they're conceptually paired. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={editForm.start_date}
                onChange={(e) =>
                  onChange({ ...editForm, start_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={editForm.due_date}
                onChange={(e) =>
                  onChange({ ...editForm, due_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Save Changes
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

// Default export alongside the named export — keeps TanStack Router's
// code-splitting plugin happy (same workaround as the other panels).
export default EditProjectModal
