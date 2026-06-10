// Author: Nevil Bhalodia
// Module: Tasks — Kanban card component showing project, milestone, title, priority
// Commit reference: refactor: extract Task Board page into modular components

// Draggable task card displayed in each kanban column.
// Two distinct interactions live on the same card:
//   1. Click anywhere (except the drag handle) → opens the detail panel
//   2. Click + hold on the drag handle → drags the card between columns
// We use @dnd-kit's useDraggable hook to get the drag handlers and
// translate the card visually while it's being dragged. The drag
// handle is wired up explicitly via {...listeners} {...attributes}
// so the rest of the card stays clickable.

import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import type { Task } from './types'
import { priorityColors } from './constants'

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onClick: () => void
}

export function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id })

  // Transform comes from dnd-kit while the card is being dragged.
  // Applying it as an inline style follows the canonical dnd-kit
  // pattern — we don't try to animate it ourselves.
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        // Skip the click handler if the user just finished dragging —
        // otherwise dropping the card would also trigger a click and
        // open the detail panel, which feels wrong.
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      onKeyDown={(event) => {
        // Keyboard accessibility — Enter or Space activates the card
        // the same way a click does. Skipped while dragging for the
        // same reason as the click handler above.
        if ((event.key === 'Enter' || event.key === ' ') && !isDragging) {
          event.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      className={`bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-300 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Top row — pills for project ID, workflow phase, priority, plus drag handle */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
          {task.jobNumber}
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
          {task.workflowPhase}
        </span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto ${priorityColors[task.priority]}`}
        >
          {task.priority}
        </span>

        {/* Drag handle — only this element starts a drag. Anywhere else
            on the card behaves like a normal click. The stopPropagation
            on its onClick prevents the card's onClick from firing if
            the user clicks the handle but doesn't actually drag. */}
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={(event) => event.stopPropagation()}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          title="Drag task"
        >
          <GripVertical size={14} />
        </button>
      </div>

      <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-snug">
        {task.title}
      </h3>
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's code-splitting (same workaround as the other panels).
export default TaskCard