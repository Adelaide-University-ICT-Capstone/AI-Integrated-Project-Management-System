// Slide-out panel that shows the subtasks of a selected workflow phase.
// Triggered by clicking any phase card in the workflow list.
// Slides in from the right at 60% width with a sticky header.
// Hovering away (onMouseLeave) hides the panel but keeps it primed —
// a small arrow tab re-opens it without losing the selected phase.

import { Calendar, ChevronLeft, Circle, Clock, Plus, Trash2, X } from 'lucide-react'
import { subtaskPriorityClass, subtaskStatusClass } from './constants'
import type { Subtask, SubtaskStatus, WorkflowPhase } from './types'
import { getSubtaskDueDateColor, getSubtaskDueDateLabel } from './utils'

interface PhasePanelProps {
  // Project ID for the header pill (e.g. "PRJ-2024-001").
  jobNumber: string
  selectedPhase: WorkflowPhase | null
  phasePanelOpen: boolean
  // Click-handlers wired up by the parent route.
  onShowPanel: () => void
  onHidePanel: () => void
  onClose: () => void
  onAddSubtask: () => void
  onRemoveSubtask: (subtaskId: string) => void
  onUpdateSubtaskStatus: (subtaskId: string, status: SubtaskStatus) => void
}

export function PhasePanel({
  jobNumber,
  selectedPhase,
  phasePanelOpen,
  onShowPanel,
  onHidePanel,
  onClose,
  onAddSubtask,
  onRemoveSubtask,
  onUpdateSubtaskStatus,
}: PhasePanelProps) {
  // Nothing to render at all if no phase is selected.
  // Both the slide-out and the arrow tab are scoped to a selected phase.
  if (!selectedPhase) return null

  // Roll up the allocated hours across all assignees in all subtasks
  // for the header summary line ("3 subtasks · 60% complete · 24h allocated").
  const subtasks = selectedPhase.subtasks ?? []
  const totalPhaseHours = subtasks.reduce(
    (sum, s) => sum + s.assignees.reduce((sub, a) => sub + a.hours, 0),
    0,
  )

  return (
    <>
      {/* Slide-out panel — only mounted when both a phase is selected AND
          the panel is open. Hovering off the panel sets phasePanelOpen
          to false and the arrow tab below takes over until the user
          re-opens it. */}
      {phasePanelOpen && (
        <div
          role="dialog"
          aria-label="Phase subtasks"
          onMouseLeave={onHidePanel}
          className="fixed top-0 right-0 h-full w-[60%] bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-40 overflow-y-auto animate-in slide-in-from-right duration-300"
        >
          {/* Sticky header — visible while scrolling through long subtask lists */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                    {jobNumber}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider">
                    Phase
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedPhase.phase}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subtasks.length} subtasks ·{' '}
                  {selectedPhase.progress}% complete
                  {totalPhaseHours > 0 && ` · ${totalPhaseHours}h allocated`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onAddSubtask}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus size={14} />
                  Add Subtask
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Panel body — subtasks list or empty state */}
          <div className="p-6">
            {subtasks.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Circle
                  size={48}
                  className="mx-auto text-gray-300 mb-3"
                />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No subtasks yet
                </p>
                <p className="text-sm text-gray-400">
                  Click "Add Subtask" above to create your first one
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <SubtaskCard
                    key={subtask.id}
                    subtask={subtask}
                    onRemove={() => onRemoveSubtask(subtask.id)}
                    onUpdateStatus={(s) => onUpdateSubtaskStatus(subtask.id, s)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arrow tab — re-opens the panel after the user has hovered away.
          Stays anchored to the right edge at vertical centre. */}
      {!phasePanelOpen && (
        <button
          type="button"
          onClick={onShowPanel}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 text-white w-8 h-20 rounded-l-lg shadow-lg flex items-center justify-center transition-all hover:w-10 group"
          title="Show phase subtasks"
        >
          <ChevronLeft
            size={20}
            className="group-hover:scale-110 transition-transform"
          />
        </button>
      )}
    </>
  )
}

// ----- Internal subtask card -----
// Pulled out as a sub-component to keep PhasePanel's JSX readable.
// Not exported because it's only ever used inside PhasePanel.

interface SubtaskCardProps {
  subtask: Subtask
  onRemove: () => void
  onUpdateStatus: (s: SubtaskStatus) => void
}

function SubtaskCard({ subtask, onRemove, onUpdateStatus }: SubtaskCardProps) {
  const dueColor = getSubtaskDueDateColor(subtask.dueDate, subtask.status)
  const dueLabel = getSubtaskDueDateLabel(subtask.dueDate, subtask.status)
  const subtaskHours = subtask.assignees.reduce((sum, a) => sum + a.hours, 0)

  return (
    <div className="bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group">
      {/* Top row: priority badge, status dropdown, delete on hover */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded ${subtaskPriorityClass[subtask.priority]}`}
        >
          {subtask.priority}
        </span>
        <select
          value={subtask.status}
          onChange={(e) => onUpdateStatus(e.target.value as SubtaskStatus)}
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer border-0 ${subtaskStatusClass[subtask.status]}`}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
          title="Remove subtask"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
        {subtask.title}
      </h4>

      {/* Due date + hours summary */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        {subtask.dueDate && (
          <div className={`flex items-center gap-1 ${dueColor}`}>
            <Calendar size={12} />
            <span>{new Date(subtask.dueDate).toLocaleDateString()}</span>
            {dueLabel && <span>· {dueLabel}</span>}
          </div>
        )}
        {subtaskHours > 0 && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock size={12} />
            <span>{subtaskHours}h allocated</span>
          </div>
        )}
      </div>

      {/* Assignee list — only render the block when there's at least one */}
      {subtask.assignees.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="space-y-1.5">
            {subtask.assignees.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div
                  className={`w-6 h-6 ${a.color} rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}
                >
                  {a.initials}
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {a.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {a.role}
                </span>
                <span className="ml-auto font-medium text-gray-700 dark:text-gray-300">
                  {a.hours}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ----- Default export -----
// Same workaround as EditSubcontractorPanel — TanStack Router's
// code-splitting plugin occasionally fails to resolve named exports
// for components that contain heavy JSX. Providing both a named and
// a default export keeps the route file imports happy either way.
export default PhasePanel
