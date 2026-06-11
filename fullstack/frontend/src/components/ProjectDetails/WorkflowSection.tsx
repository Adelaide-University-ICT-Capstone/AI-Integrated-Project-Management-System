// Author: Nevil Bhalodia
// Module: ProjectDetails — workflow phase list with editable progress sliders and milestone due dates
// Commit reference: feat: add milestone due date editor on workflow phases

// Workflow Progress section on the Project Details page.
// Lists every phase of the project as a clickable row with:
//   - A status icon (pending / in-progress / completed)
//   - The phase name + a count of its subtasks
//   - A percentage label
//   - A progress slider (0-100 in steps of 5)
// In edit mode an "Add Phase" input appears and each row gets a
// delete button so phases can be added/removed inline.

import {
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
  canEditWorkflowDates: boolean
  savingPhaseDateId: string | null
  // Click handlers wired up by the parent route.
  onToggleEditing: () => void
  onNewPhaseNameChange: (name: string) => void
  onAddPhase: () => void
  onRemovePhase: (index: number) => void
  onUpdatePhaseDueDate: (index: number, value: string) => void
  onUpdatePhaseName: (index: number, value: string) => void
}

export function WorkflowSection({
  workflow,
  selectedPhaseIndex,
  editingWorkflow,
  newPhaseName,
  canEditWorkflowDates,
  savingPhaseDateId,
  onToggleEditing,
  onNewPhaseNameChange,
  onAddPhase,
  onRemovePhase,
  onUpdatePhaseDueDate,
  onUpdatePhaseName,
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
            Progress is calculated from completed project tasks
          </p>
        </div>
        {canEditWorkflowDates && (
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
        )}
      </div>

      {/* Add Phase input — only visible while in edit mode.
          Pressing Enter is a shortcut for clicking Add Phase. */}
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

      {/* Phase list, or empty state if no phases yet */}
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
              isSelected={selectedPhaseIndex === index}
              editingWorkflow={editingWorkflow}
              canEditWorkflowDates={canEditWorkflowDates}
              isSavingDate={savingPhaseDateId === phase.id}
              onRemove={() => onRemovePhase(index)}
              onUpdateDueDate={(value) => onUpdatePhaseDueDate(index, value)}
              onUpdateName={(value) => onUpdatePhaseName(index, value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ----- Internal phase row -----
// Pulled out so the JSX above stays compact. Each row shows the phase's
// status icon, name, subtask count, progress slider, and an inline delete
// button when in edit mode.

interface PhaseRowProps {
  phase: WorkflowPhase
  isSelected: boolean
  editingWorkflow: boolean
  canEditWorkflowDates: boolean
  isSavingDate: boolean
  onRemove: () => void
  onUpdateDueDate: (value: string) => void
  onUpdateName: (value: string) => void
}

function PhaseRow({
  phase,
  isSelected,
  editingWorkflow,
  canEditWorkflowDates,
  isSavingDate,
  onRemove,
  onUpdateDueDate,
  onUpdateName
}: PhaseRowProps) {
  const showDateInputs = editingWorkflow && canEditWorkflowDates

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status icon — green check for done, blue clock for in-progress, gray circle for pending */}
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
            {editingWorkflow && canEditWorkflowDates ? (
              <input
                type="text"
                defaultValue={phase.phase}
                onBlur={(event) => onUpdateName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="px-2 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <span className="font-medium text-gray-900 dark:text-white">
                {phase.phase}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              Due on {phase.dueDate}
            </span>

            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {phase.doneTasks}/{phase.totalTasks} tasks done
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
            {phase.progress}%
          </span>
          {/* Inline delete only shows while in edit mode */}
          {editingWorkflow && (
            <button
              onClick={onRemove}
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

      <div className="ml-11">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={phase.progress}
          readOnly
          disabled
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-not-allowed accent-blue-600 opacity-80"
        />
        {showDateInputs && (
          <div className="mt-3 max-w-xs">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              <span className="mb-1 flex items-center gap-1.5">
                <Clock size={14} /> Due date
              </span>
              <input
                type="date"
                value={phase.dueDate || ''}
                disabled={isSavingDate}
                onChange={(event) => onUpdateDueDate(event.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </label>
          </div>
        )}
      </div>

      
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's code-splitting (same workaround as PhasePanel).
export default WorkflowSection
