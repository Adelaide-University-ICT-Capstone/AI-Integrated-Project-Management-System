import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
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
  FolderKanban,
  Calendar,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TaskBoard,
})

// Color-coded due date helper based on Harri's spec
const getDueDateColor = (dueDate: string, status: string) => {
  if (status === 'done') return 'text-gray-500 dark:text-gray-400'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'text-red-600 font-semibold'
  if (diffDays < 3) return 'text-orange-600 font-semibold'
  if (diffDays < 7) return 'text-yellow-600 font-medium'
  if (diffDays < 14) return 'text-green-600'
  return 'text-gray-500 dark:text-gray-400'
}

const getDueDateLabel = (dueDate: string, status: string) => {
  if (status === 'done') return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays < 14) return `${diffDays} days left`
  return null
}

interface Assignee {
  name: string
  role: string
  initials: string
  hours: number
  color: string
}

interface Task {
  id: string
  jobNumber: string
  workflowPhase: string
  title: string
  description: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  project: string
  assignee: string
  dueDate: string
  aiRisk?: string
  assignees?: Assignee[]
}

const initialTasks: Task[] = [
  {
    id: '1',
    jobNumber: 'PRJ-2024-001',
    workflowPhase: 'Planning',
    title: 'Foundation design review',
    description: 'Review foundation calculations and soil bearing capacity for the proposed structural design. Coordinate with geotechnical team.',
    status: 'todo',
    priority: 'high',
    project: 'Downtown Office Complex',
    assignee: 'Sarah Chen',
    dueDate: '2026-04-05',
    aiRisk: 'Soil test results pending - may cause delay',
    assignees: [
      { name: 'Sarah Chen', role: 'Project Manager', initials: 'SC', hours: 12, color: 'bg-purple-500' },
      { name: 'Harri Rassias', role: 'Structural Engineer', initials: 'HR', hours: 20, color: 'bg-blue-500' },
      { name: 'Mike Rodriguez', role: 'Drafter', initials: 'MR', hours: 8, color: 'bg-orange-500' },
    ],
  },
  {
    id: '2',
    jobNumber: 'PRJ-2024-001',
    workflowPhase: 'Structural',
    title: 'Steel frame analysis',
    description: 'Complete structural analysis for main steel frame including load distribution and stress points.',
    status: 'inprogress',
    priority: 'critical',
    project: 'Downtown Office Complex',
    assignee: 'Harri Rassias',
    dueDate: '2026-04-02',
    assignees: [
      { name: 'Harri Rassias', role: 'Structural Engineer', initials: 'HR', hours: 32, color: 'bg-blue-500' },
    ],
  },
  {
    id: '3',
    jobNumber: 'PRJ-2024-002',
    workflowPhase: 'Permits',
    title: 'Submit permit application',
    description: 'Prepare and submit building permit documents to local council.',
    status: 'review',
    priority: 'high',
    project: 'Highway Bridge Restoration',
    assignee: 'Mike Rodriguez',
    dueDate: '2026-04-08',
    assignees: [
      { name: 'Mike Rodriguez', role: 'Drafter', initials: 'MR', hours: 6, color: 'bg-orange-500' },
    ],
  },
  {
    id: '4',
    jobNumber: 'PRJ-2024-003',
    workflowPhase: 'Design',
    title: 'CAD drawings update',
    description: 'Update structural drawings with latest revisions per client feedback.',
    status: 'todo',
    priority: 'medium',
    project: 'Residential Tower Foundation',
    assignee: 'Mike Rodriguez',
    dueDate: '2026-04-10',
    assignees: [
      { name: 'Mike Rodriguez', role: 'Drafter', initials: 'MR', hours: 10, color: 'bg-orange-500' },
    ],
  },
  {
    id: '5',
    jobNumber: 'PRJ-2024-001',
    workflowPhase: 'Calculation',
    title: 'Load calculation verification',
    description: 'Verify dead and live load calculations against engineering standards.',
    status: 'done',
    priority: 'high',
    project: 'Downtown Office Complex',
    assignee: 'Sarah Chen',
    dueDate: '2026-03-28',
    assignees: [
      { name: 'Sarah Chen', role: 'Project Manager', initials: 'SC', hours: 6, color: 'bg-purple-500' },
    ],
  },
  {
    id: '6',
    jobNumber: 'PRJ-2024-002',
    workflowPhase: 'Site',
    title: 'Site inspection report',
    description: 'Conduct site inspection and document findings with photographs.',
    status: 'inprogress',
    priority: 'medium',
    project: 'Highway Bridge Restoration',
    assignee: 'Harri Rassias',
    dueDate: '2026-04-03',
    assignees: [
      { name: 'Harri Rassias', role: 'Structural Engineer', initials: 'HR', hours: 8, color: 'bg-blue-500' },
    ],
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

function TaskCard({
  task,
  isSelected,
  onClick,
}: {
  task: Task
  isSelected: boolean
  onClick: () => void
}) {
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
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Only trigger click if not dragging
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      className={`bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-300 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Top horizontal row: Project ID + Workflow + Priority */}
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
      </div>

      {/* Subtask title */}
      <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-snug">
        {task.title}
      </h3>
    </div>
  )
}

function DroppableColumn({
  column,
  tasks,
  selectedTaskId,
  onCardClick,
}: {
  column: (typeof columns)[0]
  tasks: Task[]
  selectedTaskId: string | null
  onCardClick: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[220px] ${column.color} rounded-lg p-3 transition-all ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm">{column.title}</h2>
        <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
          {tasks.length}
        </span>
      </div>

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
          <div className="text-center py-6 text-gray-400 text-xs">No tasks</div>
        )}
      </div>
    </div>
  )
}

function DetailPanel({
  task,
  onClose,
  onMouseLeave,
}: {
  task: Task
  onClose: () => void
  onMouseLeave: () => void
}) {
  const dueDateColor = getDueDateColor(task.dueDate, task.status)
  const dueDateLabel = getDueDateLabel(task.dueDate, task.status)
  const totalHours = task.assignees?.reduce((sum, a) => sum + a.hours, 0) || 0

  return (
    <div
      onMouseLeave={onMouseLeave}
      className="fixed top-0 right-0 h-full w-[60%] bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-40 overflow-y-auto animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
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
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/projects/$projectId"
              params={{ projectId: task.jobNumber }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <ExternalLink size={14} />
              View Project
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Description
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {task.description}
          </div>
        </div>

        {/* Project + Due Date grid */}
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
                {new Date(task.dueDate).toLocaleDateString()}
                {dueDateLabel && <span className="ml-1">· {dueDateLabel}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Allocated Team */}
        {task.assignees && task.assignees.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Allocated Team
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.assignees.length} {task.assignees.length === 1 ? 'person' : 'people'} · {totalHours}h total
              </span>
            </div>
            <div className="space-y-2">
              {task.assignees.map((assignee, idx) => (
                <div
                  key={idx}
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
                    <div className="text-xs text-gray-500 dark:text-gray-400">{assignee.role}</div>
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

        {/* AI Risk */}
        {task.aiRisk && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              AI Risk Alert
            </h3>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
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

        {/* Quick fact rows */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Primary:</span>
            <span className="font-medium text-gray-900 dark:text-white">{task.assignee}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {columns.find((c) => c.id === task.status)?.title || task.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArrowTab({ onClick }: { onClick: () => void }) {
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title *</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date *</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
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
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
  const [selectedProject, setSelectedProject] = useState<string>('all')

  // Slide-out panel state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const allProjects = Array.from(new Set(tasks.map((t) => t.project)))

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
      jobNumber: 'PRJ-NEW',
      workflowPhase: 'New',
      title: taskData.title!,
      description: taskData.description || '',
      status: 'todo',
      priority: taskData.priority!,
      project: taskData.project!,
      assignee: taskData.assignee!,
      dueDate: taskData.dueDate!,
      assignees: [],
    }
    setTasks([...tasks, newTask])
    toast.success('Task created successfully')
  }

  const handleCardClick = (task: Task) => {
    setSelectedTask(task)
    setPanelOpen(true)
  }

  const handlePanelMouseLeave = () => {
    // Hide the panel but keep selectedTask so the arrow can re-open it
    setPanelOpen(false)
  }

  const handleArrowClick = () => {
    setPanelOpen(true)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    setSelectedTask(null)
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = selectedProject === 'all' || task.project === selectedProject
    return matchesSearch && matchesProject
  })

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Board</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage and track engineering tasks across projects
        </p>
      </div>

      {/* Project Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedProject('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              selectedProject === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FolderKanban size={14} />
            All Projects
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedProject === 'all' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {tasks.length}
            </span>
          </button>
          {allProjects.map((project) => {
            const count = tasks.filter((t) => t.project === project).length
            const isActive = selectedProject === project
            return (
              <button
                key={project}
                onClick={() => setSelectedProject(project)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {project}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
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
              placeholder="Search tasks, project IDs..."
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
        <div className={`flex gap-3 overflow-x-auto pb-4 transition-all duration-300 ${
          panelOpen ? 'max-w-[40%]' : 'max-w-full'
        }`}>
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={filteredTasks.filter((task) => task.status === column.id)}
              selectedTaskId={selectedTask?.id || null}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              isSelected={false}
              onClick={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* AI Insights — hide while panel is open to avoid clutter */}
      {!panelOpen && (
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
      )}

      {/* Slide-out Detail Panel */}
      {selectedTask && panelOpen && (
        <DetailPanel
          task={selectedTask}
          onClose={handlePanelClose}
          onMouseLeave={handlePanelMouseLeave}
        />
      )}

      {/* Arrow tab — shows when a task is selected but panel is hidden */}
      {selectedTask && !panelOpen && <ArrowTab onClick={handleArrowClick} />}

      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => setShowNewTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}
    </div>
  )
}