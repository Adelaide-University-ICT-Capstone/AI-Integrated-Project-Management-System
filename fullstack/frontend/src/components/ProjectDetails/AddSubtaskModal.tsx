// Author: Nevil Bhalodia
// Module: ProjectDetails — modal for adding a subtask under a selected workflow phase
// Commit reference: refactor: extract Project Details page into modular components

// Modal for adding a new subtask under a selected workflow phase.
// Opens from the "+ Add Subtask" button in the PhasePanel header.
// We pass in the parent phase name so the modal can show context
// ("Under 'Design' phase") without the modal needing to know about
// the workflow array.

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import type { Subtask, SubtaskPriority, SubtaskStatus } from './types'

interface AddSubtaskModalProps {
  // Phase name shown in the subtitle for context ('Under "Design" phase').
  phaseName: string
  onClose: () => void
  // Caller receives the partial new subtask; it adds the id + empty
  // assignees array at the workflow-array level.
  onSave: (subtask: Omit<Subtask, 'id' | 'assignees'>) => void
}

export function AddSubtaskModal({
  phaseName,
  onClose,
  onSave,
}: AddSubtaskModalProps) {
  // Sensible defaults: medium priority, to-do status, blank date/title.
  // Saves a few clicks for the common case of "add an ordinary task".
  const [formData, setFormData] = useState<{
    title: string
    priority: SubtaskPriority
    status: SubtaskStatus
    dueDate: string
  }>({
    title: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
  })

  const handleSubmit = () => {
    // Title is the only required field — everything else has a default.
    if (!formData.title.trim()) {
      toast.error('Please enter a subtask title')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Subtask
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Under "{phaseName}" phase
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

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subtask Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Steel frame analysis"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              // Pressing Enter is a shortcut for clicking the Add button.
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Priority + Status side by side — both are small enums so
              they fit nicely in a two-column row. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as SubtaskPriority,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
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
                    status: e.target.value as SubtaskStatus,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Add Subtask
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
export default AddSubtaskModal
