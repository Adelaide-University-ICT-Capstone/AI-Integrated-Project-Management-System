// Modal for adding a new material/subcontractor order to the project.
// Opens from the "+ Add Material" button in the MaterialsSection header.
// Lets the user pick a subcontractor from a fixed dropdown, set an
// ordered date and an initial status. The material name is free text
// because Gama orders all sorts of things beyond the three defaults.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import type { Material, MaterialStatus } from './types'
import { SUBCONTRACTORS } from './constants'

interface AddMaterialModalProps {
  onClose: () => void
  // Caller receives the material without the `isDefault` flag — only the
  // three pre-loaded items are flagged as default, so anything created
  // through this modal is by definition non-default and can be removed.
  onSave: (material: Omit<Material, 'isDefault'>) => void
}

export function AddMaterialModal({ onClose, onSave }: AddMaterialModalProps) {
  // Default to 'N/A' status so a freshly-added material doesn't trigger
  // the day-based alert system until the user explicitly marks it as
  // 'Ordered'.
  const [formData, setFormData] = useState<Omit<Material, 'isDefault'>>({
    name: '',
    status: 'N/A',
    subcontractor: '',
    orderedDate: '',
  })

  const handleSubmit = () => {
    // Name is the only required field — the rest can be filled in later.
    if (!formData.name.trim()) {
      toast.error('Please enter material name')
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
            Add Material
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
              Material Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Steel Beams"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subcontractor
            </label>
            <select
              value={formData.subcontractor}
              onChange={(e) =>
                setFormData({ ...formData, subcontractor: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select subcontractor...</option>
              {SUBCONTRACTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              When Ordered
            </label>
            <input
              type="date"
              value={formData.orderedDate}
              onChange={(e) =>
                setFormData({ ...formData, orderedDate: e.target.value })
              }
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
                setFormData({
                  ...formData,
                  status: e.target.value as MaterialStatus,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="N/A">N/A</option>
              <option value="Ordered">Ordered</option>
              <option value="Received">Received</option>
              <option value="By Client">By Client</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Add Material
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
export default AddMaterialModal
