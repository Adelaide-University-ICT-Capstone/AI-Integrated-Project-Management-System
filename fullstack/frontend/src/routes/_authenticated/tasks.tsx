// Author: Nevil Bhalodia
// Module: Tasks — main route file (refactored, includes View Project button on detail panel)
// Commit reference: refactor: extract Task Board page into modular components

// Task Board — main route file.
//
// All the heavy UI lives in src/components/Tasks/:
//   - TaskCard         — draggable kanban card
//   - DroppableColumn  — column wrapper that registers as a drop target
//   - DetailPanel      — slide-out task editor + ArrowTab
//   - NewTaskModal     — modal triggered from the "+ New Task" button
//   - types / constants / utils — shared module helpers
//
// This file handles:
//   - Data fetching (projects, task management, roles) via React Query
//   - Mutations (create / update / delete) with cache invalidation
//   - Page-level state (search, filters, drag overlay, panel, modal)
//   - Drag-and-drop wiring via DndContext
//   - Project filter tabs, search bar, AI insights summary

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  AlertTriangle,
  Filter,
  FolderKanban,
  Loader2,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api/client'
import { taskManagementApi } from '@/api/taskManagement'
import type {
  ProjectTaskPayload,
  ProjectTaskUpdatePayload,
} from '@/api/taskManagement'

// Extracted module — see src/components/Tasks/
import type {
  Task,
  TaskEditFormData,
  TaskFormData,
} from '@/components/Tasks/types'
import { columns } from '@/components/Tasks/constants'
import {
  buildMilestonesByProject,
  getProjectName,
  getProjectTabLabel,
  mapTaskManagementToTasks,
} from '@/components/Tasks/utils'
import TaskCard from '@/components/Tasks/TaskCard'
import DroppableColumn from '@/components/Tasks/DroppableColumn'
import DetailPanel, { ArrowTab } from '@/components/Tasks/DetailPanel'
import NewTaskModal from '@/components/Tasks/NewTaskModal'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TaskBoard,
})

function TaskBoard() {
  const queryClient = useQueryClient()

  // ----- Page-level state -----
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  // The card being dragged — used to render the DragOverlay so the
  // user sees a "floating" version of the card under their cursor.
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  // 'all' or a specific project id. Drives the filter tabs at the top.
  const [selectedProject, setSelectedProject] = useState<string>('all')
  // The task currently shown in the detail panel.
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  // Whether the panel itself is visible — gets toggled false on
  // mouse-leave so the user can see the kanban behind it.
  const [panelOpen, setPanelOpen] = useState(false)

  // PointerSensor with an activation distance prevents accidental
  // drag starts on quick clicks. 8px of movement is required before
  // a drag actually engages.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  // ----- Data fetching -----

  const projectsQuery = useQuery({
    queryKey: ['task-management-projects'],
    queryFn: taskManagementApi.getProjects,
  })

  const projects = projectsQuery.data?.data || []
  const projectIds = projects.map((project) => project.project_id)

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: taskManagementApi.getRoles,
  })

  // Tasks are fetched per project then merged client-side. We wait
  // until the projects list resolves before firing this query so
  // the queryKey is stable.
  const taskManagementQuery = useQuery({
    queryKey: ['task-management', projectIds],
    enabled: projects.length > 0,
    queryFn: async () =>
      Promise.all(
        projects.map(async (project) => ({
          project,
          taskManagement: await taskManagementApi.getProjectTaskManagement(
            project.project_id,
          ),
        })),
      ),
  })

  const taskRows = taskManagementQuery.data || []
  const tasks = mapTaskManagementToTasks(taskRows)
  const milestonesByProject = buildMilestonesByProject(taskRows)
  const roles = rolesQuery.data?.data || []

  // ----- Mutations -----
  // Each mutation invalidates the task-management cache on success so
  // the kanban refreshes automatically. Errors are surfaced via toast
  // through the shared getApiErrorMessage helper.

  const createTaskMutation = useMutation({
    mutationFn: ({
      milestoneId,
      payload,
      projectId,
    }: {
      milestoneId: string
      payload: ProjectTaskPayload
      projectId: string
    }) => taskManagementApi.createTask(projectId, milestoneId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-management'] })
      toast.success('Task created successfully')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({
      payload,
      task,
    }: {
      payload: ProjectTaskUpdatePayload
      task: Task
    }) => taskManagementApi.updateTask(task.projectId, task.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-management'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (task: Task) =>
      taskManagementApi.deleteTask(task.projectId, task.milestoneId, task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-management'] })
      setSelectedTask(null)
      setPanelOpen(false)
      toast.success('Task deleted successfully')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  // ----- Drag handlers -----

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((item) => item.id === event.active.id)
    if (task) setActiveTask(task)
  }

  // Used by both drag-end and the inline status dropdown in the
  // detail panel. Skips the no-op case where the task is already in
  // the target column so we don't fire wasted PATCH requests.
  const handleUpdateStatus = async (task: Task, newStatus: string) => {
    if (task.status === newStatus) return
    await updateTaskMutation.mutateAsync({
      task,
      payload: { milestone_status: newStatus },
    })
    setSelectedTask((current) =>
      current?.id === task.id ? { ...current, status: newStatus } : current,
    )
    toast.success('Task updated successfully')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return
    const task = tasks.find((item) => item.id === active.id)
    const newStatus = String(over.id)
    if (!task || !columns.find((column) => column.id === newStatus)) return
    try {
      await handleUpdateStatus(task, newStatus)
    } catch {
      // The mutation already surfaces an error toast — swallow here
      // so dnd-kit doesn't see an unhandled rejection.
    }
  }

  // ----- CRUD handlers -----

  const handleCreateTask = async (taskData: TaskFormData) => {
    const allocatedHours = Number(taskData.allocatedHours)
    const payload: ProjectTaskPayload = {
      task_name: taskData.taskName.trim(),
      task_description: taskData.taskDescription.trim() || null,
      due_date: taskData.dueDate || null,
      assigned_role_id: taskData.assignedRoleId || null,
      // Send null instead of 0 when the field is blank so the backend
      // can distinguish "no value" from "explicitly zero hours".
      allocated_hours:
        Number.isFinite(allocatedHours) && allocatedHours > 0
          ? allocatedHours
          : null,
      milestone_status: 'todo',
    }
    await createTaskMutation.mutateAsync({
      projectId: taskData.projectId,
      milestoneId: taskData.milestoneId,
      payload,
    })
    setShowNewTaskModal(false)
  }

  const handleSaveTask = async (task: Task, taskData: TaskEditFormData) => {
    const allocatedHours = Number(taskData.allocatedHours)
    const payload: ProjectTaskUpdatePayload = {
      task_name: taskData.taskName.trim(),
      task_description: taskData.taskDescription.trim() || null,
      due_date: taskData.dueDate || null,
      assigned_role_id: taskData.assignedRoleId || null,
      allocated_hours:
        Number.isFinite(allocatedHours) && allocatedHours > 0
          ? allocatedHours
          : null,
      milestone_status: taskData.status,
    }
    await updateTaskMutation.mutateAsync({ task, payload })

    // Optimistically merge the patch into the locally-cached selected
    // task so the detail panel updates immediately, before the
    // invalidate-and-refetch cycle finishes.
    setSelectedTask((current) =>
      current?.id === task.id
        ? {
            ...current,
            title: payload.task_name || current.title,
            description: payload.task_description || '',
            dueDate: payload.due_date || '',
            assignedRoleId: payload.assigned_role_id,
            allocatedHours: payload.allocated_hours || 0,
            status: payload.milestone_status || current.status,
            assignee:
              roles.find((role) => role.id === payload.assigned_role_id)
                ?.role_name || 'Unassigned',
          }
        : current,
    )
    toast.success('Task updated successfully')
  }

  // ----- Panel handlers -----

  const handleCardClick = (task: Task) => {
    setSelectedTask(task)
    setPanelOpen(true)
  }

  const handlePanelMouseLeave = () => {
    setPanelOpen(false)
  }

  const handleArrowClick = () => {
    setPanelOpen(true)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    setSelectedTask(null)
  }

  // ----- Filtering -----
  // Combines the search term (substring match across title, project
  // name, job number) with the project filter pill.

  const filteredTasks = tasks.filter((task) => {
    const normalizedSearch = searchTerm.toLowerCase()
    const matchesSearch =
      task.title.toLowerCase().includes(normalizedSearch) ||
      task.project.toLowerCase().includes(normalizedSearch) ||
      task.jobNumber.toLowerCase().includes(normalizedSearch)
    const matchesProject =
      selectedProject === 'all' || task.projectId === selectedProject
    return matchesSearch && matchesProject
  })

  const loading =
    projectsQuery.isLoading || taskManagementQuery.isLoading
  const error =
    projectsQuery.error || taskManagementQuery.error || rolesQuery.error

  // ----- Render -----

  return (
    <div className="space-y-6 min-w-0">
      {/* Header row — title + New Task button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Task Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track engineering tasks across projects
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          disabled={loading || projects.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* API error banner — only renders when one of the queries errored. */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {getApiErrorMessage(error)}
        </div>
      )}

      {/* Project filter pills */}
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
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedProject === 'all'
                  ? 'bg-white/20'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {tasks.length}
            </span>
          </button>
          {projects.map((project) => {
            const count = tasks.filter(
              (task) => task.projectId === project.project_id,
            ).length
            const isActive = selectedProject === project.project_id
            return (
              <button
                key={project.project_id}
                onClick={() => setSelectedProject(project.project_id)}
                title={getProjectName(project)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {getProjectTabLabel(project)}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search bar + Filters button. The Filters button is a placeholder
          for now — wiring up an actual filter UI is a future enhancement. */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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

      {/* Kanban board OR loading spinner. The width is constrained when
          the detail panel is open so the board doesn't sit underneath
          the slide-out. */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 animate-spin" size={20} />
          Loading tasks from backend...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className={`flex gap-3 overflow-x-auto pb-4 transition-all duration-300 ${
              panelOpen ? 'max-w-[40%]' : 'max-w-full'
            }`}
          >
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={filteredTasks.filter(
                  (task) => task.status === column.id,
                )}
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
      )}

      {/* AI insights summary — hidden while the detail panel is open
          so the user gets more room for the kanban itself. */}
      {!panelOpen && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Task Insights
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automated dependency and risk analysis
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {tasks.filter((task) => task.priority === 'critical').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tasks at risk of delay
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {tasks.filter((task) => task.status === 'review').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tasks in review
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {tasks.filter((task) => task.status !== 'done').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Open tasks
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out detail panel — mounts only when a task is selected
          AND the panel is open. ArrowTab takes over when the panel
          is hidden but a task is still selected. */}
      {selectedTask && panelOpen && (
        <DetailPanel
          key={selectedTask.id}
          task={selectedTask}
          isSaving={
            updateTaskMutation.isPending || deleteTaskMutation.isPending
          }
          onClose={handlePanelClose}
          onDelete={(task) => deleteTaskMutation.mutate(task)}
          onMouseLeave={handlePanelMouseLeave}
          onSave={handleSaveTask}
          onStatusChange={(task, status) => {
            handleUpdateStatus(task, status).catch(() => undefined)
          }}
          roles={roles}
        />
      )}

      {selectedTask && !panelOpen && <ArrowTab onClick={handleArrowClick} />}

      {/* New task modal */}
      {showNewTaskModal && (
        <NewTaskModal
          isSaving={createTaskMutation.isPending}
          milestonesByProject={milestonesByProject}
          onClose={() => setShowNewTaskModal(false)}
          onSave={handleCreateTask}
          projects={projects}
          roles={roles}
        />
      )}
    </div>
  )
}