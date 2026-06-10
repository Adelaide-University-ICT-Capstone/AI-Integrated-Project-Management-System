// Author: Nevil Bhalodia
// Module: Tasks — main route file for creating the New Task modal
// Commit reference: refactor: extract new task modal into modular components

// Modal for creating a new task. Opens from the "+ New Task" button
// in the Task Board header. The modal needs three pieces of context
// from the parent route to populate its dropdowns:
//   - projects: the list of projects the user can create tasks against
//   - milestonesByProject: precomputed milestone lookup so we can
//     repopulate the milestone dropdown when the user changes the
//     selected project
//   - roles: the list of roles the user can optionally assign to the task
//
// We default to the first project + first milestone so the form is
// immediately submittable without extra clicks. The user can still
// pick a different combination via the dropdowns.

import { type FormEvent, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type {
  ProjectMilestoneNode,
  ProjectTaskManagementProject,
  Role,
} from '@/api/taskManagement'
import type { TaskFormData } from './types'
import { getProjectName } from './utils'

interface NewTaskModalProps {
  isSaving: boolean
  milestonesByProject: Record<string, ProjectMilestoneNode[]>
  onClose: () => void
  onSave: (task: TaskFormData) => Promise<void>
  projects: ProjectTaskManagementProject[]
  roles: Role[]
}

export function NewTaskModal({
  isSaving,
  milestonesByProject,
  onClose,
  onSave,
  projects,
  roles,
}: NewTaskModalProps) {
  // Default selections — first project + first milestone for that project.
  // Falling back to empty strings means the form still mounts even if
  // there's no data yet; the submit handler validates the values before
  // calling onSave.
  const firstProjectId = projects[0]?.project_id || ''
  const firstMilestoneId = milestonesByProject[firstProjectId]?.[0]?.id || ''

  const [formData, setFormData] = useState<TaskFormData>({
    projectId: firstProjectId,
    milestoneId: firstMilestoneId,
    taskName: '',
    taskDescription: '',
    dueDate: '',
    assignedRoleId: '',
    allocatedHours: '',
  })

  const selectedMilestones = milestonesByProject[formData.projectId] || []

  // When the user changes the project we have to reset the milestone
  // selection too — the previously-selected milestone doesn't belong
  // to the new project, so we default to the first milestone of the
  // newly chosen one.
  const handleProjectChange = (projectId: string) => {
    setFormData({
      ...formData,
      projectId,
      milestoneId: milestonesByProject[projectId]?.[0]?.id || '',
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      !formData.taskName.trim() ||
      !formData.projectId ||
      !formData.milestoneId
    ) {
      toast.error('Please choose a project, milestone, and task name')
      return
    }
    await onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project + Milestone — paired in a two-column row because
              picking one influences the other and they're conceptually
              "where does this task live?". */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project *
              </label>
              <select
                value={formData.projectId}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {getProjectName(project)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Milestone *
              </label>
              <select
                value={formData.milestoneId}
                onChange={(event) =>
                  setFormData({ ...formData, milestoneId: event.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {selectedMilestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.milestone_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.taskName}
              onChange={(event) =>
                setFormData({ ...formData, taskName: event.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter task name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.taskDescription}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  taskDescription: event.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          {/* Optional metadata in a three-column row — these don't
              influence each other so they're independent. */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(event) =>
                  setFormData({ ...formData, dueDate: event.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned Role
              </label>
              <select
                value={formData.assignedRoleId}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    assignedRoleId: event.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Unassigned</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Allocated Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={formData.allocatedHours}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    allocatedHours: event.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
export default NewTaskModal
