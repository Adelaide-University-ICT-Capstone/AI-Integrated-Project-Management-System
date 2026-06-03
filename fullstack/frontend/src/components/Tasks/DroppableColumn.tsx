// Kanban column wrapper. One of these is rendered per status (To Do,
// In Progress, Review, Done). Each column registers itself as a drop
// target with @dnd-kit via useDroppable, and the parent TaskBoard
// reads the column ID off the drag-end event to know where to move
// the dropped task.
//
// The column doesn't fetch its own tasks — it receives a pre-filtered
// list from the parent and just renders them. That keeps the column
// stateless and makes it easy to swap in different filtering logic
// later (e.g. priority lanes, person-specific boards).

import { useDroppable } from '@dnd-kit/core'
import type { Task } from './types'
import { columns } from './constants'
import { TaskCard } from './TaskCard'

interface DroppableColumnProps {
  // The column config — id, title, and background colour class.
  // Typed against the inferred element type of the columns array
  // so adding more columns later doesn't break this signature.
  column: (typeof columns)[0]
  tasks: Task[]
  selectedTaskId: string | null
  onCardClick: (task: Task) => void
}

export function DroppableColumn({
  column,
  tasks,
  selectedTaskId,
  onCardClick,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[220px] ${column.color} rounded-lg p-3 transition-all ${
        // Highlight the column while a card is being dragged over it
        // so the user gets visual feedback about where they're about
        // to drop.
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      {/* Column header — title + task count pill */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm">
          {column.title}
        </h2>
        <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
          {tasks.length}
        </span>
      </div>

      {/* Card list with a min-height so empty columns still have a
          visible drop zone the user can drag cards into. */}
      <div className="space-y-2 min-h-[100px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onClick={() => onCardClick(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's code-splitting (same workaround as the other panels).
export default DroppableColumn