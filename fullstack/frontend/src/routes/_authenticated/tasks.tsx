import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import {
  Filter,
  Search,
  User,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TaskBoard,
})

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  project: string
  assignee: string
  dueDate: string
  aiRisk?: string
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Foundation design review',
    description: 'Review foundation calculations and soil bearing capacity',
    status: 'todo',
    priority: 'high',
    project: 'Downtown Office Complex',
    assignee: 'Sarah Chen',
    dueDate: '2026-04-05',
    aiRisk: 'Soil test results pending - may cause delay',
  },
  {
    id: '2',
    title: 'Steel frame analysis',
    description: 'Complete structural analysis for main steel frame',
    status: 'inprogress',
    priority: 'critical',
    project: 'Downtown Office Complex',
    assignee: 'Harri Rassias',
    dueDate: '2026-04-02',
  },
  {
    id: '3',
    title: 'Submit permit application',
    description: 'Prepare and submit building permit documents',
    status: 'review',
    priority: 'high',
    project: 'Highway Bridge Restoration',
    assignee: 'Mike Rodriguez',
    dueDate: '2026-04-08',
  },
  {
    id: '4',
    title: 'CAD drawings update',
    description: 'Update structural drawings with latest revisions',
    status: 'todo',
    priority: 'medium',
    project: 'Residential Tower Foundation',
    assignee: 'Mike Rodriguez',
    dueDate: '2026-04-10',
  },
  {
    id: '5',
    title: 'Load calculation verification',
    description: 'Verify dead and live load calculations',
    status: 'done',
    priority: 'high',
    project: 'Downtown Office Complex',
    assignee: 'Sarah Chen',
    dueDate: '2026-03-28',
  },
  {
    id: '6',
    title: 'Site inspection report',
    description: 'Conduct site inspection and document findings',
    status: 'inprogress',
    priority: 'medium',
    project: 'Highway Bridge Restoration',
    assignee: 'Harri Rassias',
    dueDate: '2026-04-03',
  },
]

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'review', title: 'Review', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-900/20' },
]

const priorityColors = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-200 text-blue-700',
  high: 'bg-orange-200 text-orange-700',
  critical: 'bg-red-200 text-red-700',
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 dark:text-white flex-1 text-sm">{task.title}</h3>
        <span className={`px-2 py-0.5 text-xs rounded shrink-0 ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>

      <div className="space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{task.project}</div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <User size={12} />
            <span>{task.assignee}</span>
          </div>
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            <Clock size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        {task.aiRisk && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <AlertTriangle size={12} />
            <span>{task.aiRisk}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DroppableColumn({
  column,
  tasks,
}: {
  column: (typeof columns)[0]
  tasks: Task[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[260px] ${column.color} rounded-lg p-4 transition-all ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">{column.title}</h2>
        <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 min-h-[100px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No tasks</div>
        )}
      </div>
    </div>
  )
}

function NewTaskModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (task: Partial<Task>) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    project: 'Downtown Office Complex',
    assignee: 'Harri Rassias',
    dueDate: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.dueDate) {
      toast.error('Please fill in required fields')
      return
    }
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option>Downtown Office Complex</option>
              <option>Highway Bridge Restoration</option>
              <option>Residential Tower Foundation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assignee
            </label>
            <select
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option>Harri Rassias</option>
              <option>Sarah Chen</option>
              <option>Mike Rodriguez</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
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

function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as string
    if (columns.find((c) => c.id === newStatus)) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
      toast.success('Task moved successfully')
    }
  }

  const handleCreateTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title!,
      description: taskData.description || '',
      status: 'todo',
      priority: taskData.priority!,
      project: taskData.project!,
      assignee: taskData.assignee!,
      dueDate: taskData.dueDate!,
    }
    setTasks([...tasks, newTask])
    toast.success('Task created successfully')
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Board</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track engineering tasks across projects
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
            <Filter size={20} />
            Filters
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 max-w-full">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={filteredTasks.filter((task) => task.status === column.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Task Insights</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automated dependency and risk analysis
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 mb-1">3</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks at risk of delay</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600 mb-1">5</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dependency bottlenecks</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 mb-1">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks on track</div>
          </div>
        </div>
      </div>

      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => setShowNewTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}
    </div>
  )
}