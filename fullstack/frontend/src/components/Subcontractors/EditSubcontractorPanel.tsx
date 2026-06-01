// Slide-out panel for editing an existing subcontractor.
// Matches the slide-out pattern used elsewhere in the app (e.g. the
// phase panel on the project details page) for visual consistency.
// Slides in from the right at 480px wide with a backdrop overlay.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceType, Subcontractor } from './types'
import { SERVICE_TYPES } from './constants'
import { avatarColorFromName, initials } from './utils'

interface EditSubcontractorPanelProps {
  subcontractor: Subcontractor
  onClose: () => void
  onSave: (sc: Subcontractor) => void
}

export function EditSubcontractorPanel({
  subcontractor,
  onClose,
  onSave,
}: EditSubcontractorPanelProps) {
  // Initialise the form with the existing subcontractor's values so the
  // user sees what's currently saved and can edit from there.
  // We spread the services array so edits don't mutate the original.
  const [formData, setFormData] = useState({
    name: subcontractor.name,
    email: subcontractor.email,
    phone: subcontractor.phone,
    services: [...subcontractor.services],
  })

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

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in name and email')
      return
    }
    if (formData.services.length === 0) {
      toast.error('Pick at least one service')
      return
    }

    // Spread the original subcontractor so we preserve its id (and any
    // other fields we might add later) while overwriting the editable
    // fields with what the user changed.
    onSave({
      ...subcontractor,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      services: formData.services,
    })
  }

  return (
    <>
      {/* Click-outside backdrop. Lower z-index than the panel so the panel
          renders on top. */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
      />

      {/* Slide-out panel — full width on mobile, 480px on tablet+ */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Sticky header so the company name stays visible when the user
            scrolls down through a long form (more fields might be added
            later — keeping the header sticky now means we won't have to
            redo this when that happens). */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-10 h-10 ${avatarColorFromName(subcontractor.name)} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
              >
                {initials(subcontractor.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Edit Subcontractor
                </p>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {subcontractor.name}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close edit panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Services Provided <span className="text-red-500">*</span>
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
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
              Tap to toggle. At least one service is required.
            </p>
          </div>

          {/* Footer actions stick to the bottom of the visible form area */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
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
    </>
  )
}

export default EditSubcontractorPanel
