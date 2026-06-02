// Slide-out detail panel for a selected task. Mirrors the hover-tab
// pattern used in PhasePanel on the Project Details page — when the
// user hovers off the panel it slides away but the ArrowTab stays
// anchored to the right edge so they can re-open the same task
// without losing their place.
//
// The panel doubles as the edit surface. Clicking "Edit" reveals an
// inline form at the top of the body section; the read-only display
// fields below it stay visible so the user always sees the current
// saved values alongside their pending changes.

import { type FormEvent, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  Clock,
  ExternalLink,
  FolderKanban,
  Pencil,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Role } from '@/api/taskManagement'
import type { Task, TaskEditFormData } from './types'
import { columns, priorityColors } from './constants'
import { getDueDateColor, getDueDateLabel } from './utils'

interface DetailPanelProps {
  task: Task
  isSaving: boolean
  onClose: () => void
  onDelete: (task: Task) => void
  // Fired when the cursor leaves the panel (but not while the edit
  // form is open — we don't want to lose unsaved edits to an accidental
  // mouse move).
  onMouseLeave: () => void
  onSave: (task: Task, formData: TaskEditFormData) => Promise<void>
  onStatusChange: (task: Task, status: string) => void
  roles: Role[]
}

export function DetailPanel({
  task,
  isSaving,
  onClose,
  onDelete,
  onMouseLeave,
  onSave,
  onStatusChange,
  roles,
}: DetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Initialise the edit form with the task's current values.
  // We slice the dueDate to ten characters because the backend often
  // returns ISO timestamps and the <input type="date"> element only
  // accepts the YYYY-MM-DD prefix.
  const [formData, setFormData] = useState<TaskEditFormData>({
    taskName: task.title,
    taskDescription: task.description,
    dueDate: task.dueDate.slice(0, 10),
    assignedRoleId: task.assignedRoleId || '',
    allocatedHours: task.allocatedHours ? String(task.allocatedHours) : '',
    status: task.status,
  })

  const dueDateColor = getDueDateColor(task.dueDate, task.status)
  const dueDateLabel = getDueDateLabel(task.dueDate, task.status)
  const totalHours =
    task.assignees?.reduce((sum, assignee) => sum + assignee.hours, 0) || 0

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!formData.taskName.trim()) {
      toast.error('Task name is required')
      return
    }
    await onSave(task, formData)
    setIsEditing(false)
  }

  return (
    <div
      // Only fire the hover-leave handler when the edit form is closed.
      // Editing should be an "intentional" mode — the panel shouldn't
      // disappear because the user moved their cursor away to grab a
      // reference value from another tab.
      onMouseLeave={isEditing ? undefined : onMouseLeave}
      className="fixed top-0 right-0 h-full w-[60%] bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-40 overflow-y-auto animate-in slide-in-from-right duration-300"
    >
      {/* Sticky header — stays visible while the user scrolls through a long task */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                {task.jobNumber}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                {task.workflowPhase}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Project — jumps to the parent project's detail page
                so the user can drill into wider context. */}
            <Link
              to="/projects/$projectId"
              params={{ projectId: task.projectId }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <ExternalLink size={14} />
              View Project
            </Link>

            <button
              onClick={() => setIsEditing((current) => !current)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              title="Edit task"
            >
              <Pencil size={14} />
              Edit
            </button>

            <button
              onClick={() => onDelete(task)}
              disabled={isSaving}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 size={20} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Inline edit form — only mounted when the user is editing.
            Sits at the top of the body so the read-only display fields
            below still show what's currently saved. */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-900/20"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Edit Task
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel edit
              </button>
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData({ ...formData, status: event.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Description (read-only) */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Description
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {task.description || 'No description provided.'}
          </div>
        </div>

        {/* Project + Due Date side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Project
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
              <FolderKanban size={16} className="text-gray-400" />
              {task.project}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Due Date
            </h3>
            <div className={`flex items-center gap-2 text-sm ${dueDateColor}`}>
              <Calendar size={16} />
              <span>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : 'No due date'}
                {dueDateLabel && <span className="ml-1">- {dueDateLabel}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Status dropdown — duplicates the edit form's status field
            so the user can change column without opening the editor. */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Status
          </h3>
          <select
            value={task.status}
            disabled={isSaving}
            onChange={(event) => onStatusChange(task, event.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee list — only shown when there's at least one assignee.
            Empty state would be confusing on its own. */}
        {task.assignees && task.assignees.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Allocated Role
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalHours}h total
              </span>
            </div>
            <div className="space-y-2">
              {task.assignees.map((assignee) => (
                <div
                  key={`${task.id}-${assignee.role}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg"
                >
                  <div
                    className={`w-10 h-10 ${assignee.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {assignee.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {assignee.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {assignee.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {assignee.hours}h
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      allocated
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI risk alert — yellow callout when the backend flagged the
            task. Optional, so we only render when there's a real value. */}
        {task.aiRisk && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              AI Risk Alert
            </h3>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle
                size={20}
                className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  {task.aiRisk}
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Detected by AI risk analysis
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer summary — role + status repeated as inline labels.
            Mirrors the kanban card header so the panel feels connected
            to the card the user clicked from. */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Role:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {task.assignee}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {columns.find((column) => column.id === task.status)?.title ||
                task.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- Arrow tab -----
// Tiny re-opener anchored to the right edge. Appears whenever the user
// has a task selected but the panel itself is closed (e.g. after they
// hovered away). Clicking it slides the panel back in without losing
// the selected task. Kept in this file because conceptually it's part
// of the same UX as DetailPanel.

export function ArrowTab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-1/2 right-0 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 text-white w-8 h-20 rounded-l-lg shadow-lg flex items-center justify-center transition-all hover:w-10 group"
      title="Show task details"
    >
      <ChevronLeft
        size={20}
        className="group-hover:scale-110 transition-transform"
      />
    </button>
  )
}

// Default export alongside the named exports to keep TanStack Router's
// code-splitting happy (same workaround as the other panels).
export default DetailPanel