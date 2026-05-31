// Modal for creating a new material/service order for a specific subcontractor.
// Opens from the "+ New Order" button on the subcontractor card in the
// "By Subcontractor" view, and gets the subcontractor passed in as a prop
// so we already know who the order is for.

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Project } from '@/api/project'
import type { Order, OrderStatus, ServiceType, Subcontractor } from './types'
import { SERVICE_TYPES } from './constants'

interface NewOrderModalProps {
  projects: Project[]
  subcontractor: Subcontractor
  onClose: () => void
  // We omit `projectName` because the parent component derives it from
  // the projects list rather than storing it on the Order itself.
  onSave: (order: Omit<Order, 'projectName'>) => void
}

export function NewOrderModal({
  projects,
  subcontractor,
  onClose,
  onSave,
}: NewOrderModalProps) {
  // Default the form to the subcontractor's first service and the first
  // project in the dropdown — saves a click in the common case where
  // there's only one of each.
  const [formData, setFormData] = useState({
    service: subcontractor.services[0] as ServiceType,
    projectId: projects?.[0]?.project_id,
    orderedDate: new Date().toISOString().split('T')[0],
    status: 'Ordered' as OrderStatus,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      // `id` here is a placeholder — the backend assigns the real ID.
      // We use projectId as a temporary value so optimistic UI updates
      // still have a unique-ish key while the request is in flight.
      id: formData.projectId,
      subcontractorId: subcontractor.id,
      service: formData.service,
      projectId: formData.projectId,
      orderedDate: formData.orderedDate,
      status: formData.status,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              New Order
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              For {subcontractor.name}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service
            </label>
            <select
              value={formData.service}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  service: e.target.value as ServiceType,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.job_number} — {p.project_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordered Date
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
                  status: e.target.value as OrderStatus,
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Create Order
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