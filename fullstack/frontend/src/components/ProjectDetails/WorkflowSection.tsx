// Workflow Progress section on the Project Details page.
// Lists every phase of the project as a clickable row with:
//   - A status icon (pending / in-progress / completed)
//   - The phase name + a count of its subtasks + the due date (if set)
//   - A percentage label
//   - A progress slider (0-100 in steps of 5)
// In edit mode an "Add Phase" input appears, each row gets a delete
// button, and a date input is exposed so the user can set/change the
// milestone due date.

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Edit2,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import type { WorkflowPhase } from './types'

interface WorkflowSectionProps {
  workflow: WorkflowPhase[]
  selectedPhaseIndex: number | null
  editingWorkflow: boolean
  newPhaseName: string
  // Click handlers wired up by the parent route.
  onToggleEditing: () => void
  onNewPhaseNameChange: (name: string) => void
  onAddPhase: () => void
  onRemovePhase: (index: number) => void
  onPhaseClick: (index: number) => void
  onUpdatePhaseProgress: (index: number, progress: number) => void
  // New: lets the parent persist a milestone due date for a phase.
  // Currently writes to local state only — Lee/Depresso will wire
  // this to PATCH /projects/{id}/milestones/{id} when the backend
  // integration lands.
  onUpdatePhaseDueDate: (index: number, dueDate: string) => void
}

export function WorkflowSection({
  workflow,
  selectedPhaseIndex,
  editingWorkflow,
  newPhaseName,
  onToggleEditing,
  onNewPhaseNameChange,
  onAddPhase,
  onRemovePhase,
  onPhaseClick,
  onUpdatePhaseProgress,
  onUpdatePhaseDueDate,
}: WorkflowSectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} /> Task Workflow Progress
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Click any phase to see its subtasks
          </p>
        </div>
        <button
          onClick={onToggleEditing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {editingWorkflow ? (
            <>
              <CheckCircle2 size={16} /> Done Editing
            </>
          ) : (
            <>
              <Edit2 size={16} /> Edit Phases
            </>
          )}
        </button>
      </div>

      {/* Add Phase input — only visible while in edit mode. */}
      {editingWorkflow && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPhaseName}
              onChange={(e) => onNewPhaseNameChange(e.target.value)}
              placeholder="New phase name (e.g., Excavation)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm placeholder:text-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && onAddPhase()}
            />
            <button
              onClick={onAddPhase}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus size={16} /> Add Phase
            </button>
          </div>
        </div>
      )}

      {/* Phase list, or empty state */}
      {workflow.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Circle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No workflow phases yet
          </p>
          <p className="text-xs text-gray-400">
            Click "Edit Phases" above to add your first phase
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflow.map((phase, index) => (
            <PhaseRow
              key={index}
              phase={phase}
              index={index}
              isSelected={selectedPhaseIndex === index}
              editingWorkflow={editingWorkflow}
              onClick={() => onPhaseClick(index)}
              onRemove={() => onRemovePhase(index)}
              onUpdateProgress={(p) => onUpdatePhaseProgress(index, p)}
              onUpdateDueDate={(d) => onUpdatePhaseDueDate(index, d)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PhaseRowProps {
  phase: WorkflowPhase
  index: number
  isSelected: boolean
  editingWorkflow: boolean
  onClick: () => void
  onRemove: () => void
  onUpdateProgress: (progress: number) => void
  onUpdateDueDate: (dueDate: string) => void
}

function PhaseRow({
  phase,
  isSelected,
  editingWorkflow,
  onClick,
  onRemove,
  onUpdateProgress,
  onUpdateDueDate,
}: PhaseRowProps) {
  // Format the due date for display in view mode. We use the locale
  // formatter so it shows in the user's expected format. Returns null
  // when there's no date so the caller can conditionally hide the chip.
  const displayDate = phase.dueDate
    ? new Date(phase.dueDate).toLocaleDateString()
    : null

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status icon */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              phase.status === 'completed'
                ? 'bg-green-100 dark:bg-green-900/30'
                : phase.status === 'in-progress'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            {phase.status === 'completed' ? (
              <CheckCircle2 size={16} className="text-green-600" />
            ) : phase.status === 'in-progress' ? (
              <Clock size={16} className="text-blue-600" />
            ) : (
              <Circle size={16} className="text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-white">
              {phase.phase}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {phase.subtasks.length}{' '}
              {phase.subtasks.length === 1 ? 'subtask' : 'subtasks'}
            </span>
            {/* Read-only due date chip shown when the date is set, regardless of edit mode */}
            {displayDate && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full">
                <Calendar size={11} /> Due {displayDate}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
            {phase.progress}%
          </span>
          {editingWorkflow && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Remove phase"
            >
              <Trash2 size={16} />
            </button>
          )}
          <ChevronRight
            size={18}
            className={`text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`}
          />
        </div>
      </div>

      {/* Progress slider */}
      <div className="ml-11" onClick={(e) => e.stopPropagation()}>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={phase.progress}
          onChange={(e) => onUpdateProgress(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Due date input — only exposed while in edit mode so the
          read-only view stays clean. Wrapped in a stopPropagation
          handler so clicking the input doesn't bubble up to the row
          and toggle the panel selection. */}
      {editingWorkflow && (
        <div
          className="ml-11 mt-2 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
            <Calendar size={12} /> Due:
          </label>
          <input
            type="date"
            value={phase.dueDate || ''}
            onChange={(e) => onUpdateDueDate(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          {phase.dueDate && (
            <button
              onClick={() => onUpdateDueDate('')}
              className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              title="Clear date"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's code-splitting.
export default WorkflowSection