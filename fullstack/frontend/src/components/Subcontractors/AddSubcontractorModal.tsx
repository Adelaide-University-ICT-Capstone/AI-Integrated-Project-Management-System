// Author: Nevil Bhalodia
// Module: Subcontractors — modal for adding a new subcontractor to the directory
// Commit reference: refactor: extract Subcontractors page into modular components

// Modal for adding a brand new subcontractor to the system.
// Opens from the "Add Subcontractor" button in the left sidebar.
// Pure presentation — the actual API call lives in the parent route,
// so this component just collects form data and hands it back via onSave.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceType, Subcontractor } from './types'
import { SERVICE_TYPES } from './constants'

interface AddSubcontractorModalProps {
  onClose: () => void
  onSave: (sc: Omit<Subcontractor, 'id'>) => void
}

export function AddSubcontractorModal({
  onClose,
  onSave,
}: AddSubcontractorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    services: [] as ServiceType[],
  })

  // Toggle a service in/out of the selected set.
  // We use a Set-like array because order isn't important and React
  // re-renders cheaply on small arrays.
  const toggleService = (s: ServiceType) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(s)
        ? prev.services.filter((x) => x !== s)
        : [...prev.services, s],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Inline validation rather than relying on the HTML5 `required`
    // attribute alone — gives us nicer toast messages and lets us
    // validate the services array (which a plain input can't enforce).
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in name and email')
      return
    }
    if (formData.services.length === 0) {
      toast.error('Pick at least one service')
      return
    }

    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Subcontractor
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
              Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Big Wood Suppliers"
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
              placeholder="contact@example.com"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Services Provided
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    formData.services.includes(s)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Add Subcontractor
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
