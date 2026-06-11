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
import type { Task } from '@/components/Tasks/types'
import { priorityColors } from '@/components/Tasks/constants'

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onClick: () => void
}

export function TaskCard({
  task,
  isSelected,
  onClick,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      onKeyDown={(event) => {
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
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
          {task.jobNumber}
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
          {task.workflowPhase}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
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

export default TaskCard
