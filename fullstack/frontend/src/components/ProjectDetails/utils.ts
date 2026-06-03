import type { ProjectTaskManagementMilestone, ProjectTaskNode } from '@/api/project'
import { materialStatusPillClass, workforceStatusColor, workforceStatusDefault } from './constants'
import type { Material, MaterialStatus, WorkflowPhase } from './types'

export const mapStatusToFrontend = (backendStatus: string): MaterialStatus => {
  switch (backendStatus) {
    case 'ordered':
      return 'Ordered'
    case 'received':
      return 'Received'
    case 'by_client':
      return 'By Client'
    default:
      return 'N/A'
  }
}

export const mapMaterialStatusToBackend = (status: MaterialStatus) => {
  switch (status) {
    case 'Ordered':
      return 'ordered'
    case 'Received':
      return 'received'
    case 'By Client':
      return 'by_client'
    default:
      return 'n/a'
  }
}

export const mapFrontendFieldToBackend = (field: keyof Material) => {
  switch (field) {
    case 'name':
      return 'name'
    case 'status':
      return 'status'
    case 'subcontractorId':
      return 'subcontractor_id'
    case 'orderedDate':
      return 'ordered_date'
    default:
      return field
  }
}

export const getMaterialStatusPillClass = (status: MaterialStatus): string =>
  materialStatusPillClass[status] ?? materialStatusPillClass['N/A']

export const getWorkforceStatusColor = (status: string): string =>
  workforceStatusColor[status] ?? workforceStatusDefault

export const formatRoleLabel = (roleName?: string | null) => {
  if (!roleName) return 'Team Member'
  return roleName
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export const getInitialsFromName = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'NA'

export const getWorkflowPhaseStatus = (progress: number): WorkflowPhase['status'] => {
  if (progress >= 100) return 'completed'
  if (progress > 0) return 'in-progress'
  return 'pending'
}

export const isDoneTaskStatus = (status?: string | null) => status?.trim().toLowerCase() === 'done'

export const calculateTaskCompletion = (tasks: ProjectTaskNode[]): { doneTasks: number; totalTasks: number } =>
  tasks.reduce(
    (counts, task) => {
      const childCounts = calculateTaskCompletion(task.children || [])
      return {
        doneTasks: counts.doneTasks + (isDoneTaskStatus(task.milestone_status) ? 1 : 0) + childCounts.doneTasks,
        totalTasks: counts.totalTasks + 1 + childCounts.totalTasks,
      }
    },
    { doneTasks: 0, totalTasks: 0 },
  )

export const calculateProgressPercent = (doneTasks: number, totalTasks: number) =>
  totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

export const mapMilestoneToWorkflowPhase = (milestone: ProjectTaskManagementMilestone): WorkflowPhase => {
  const { doneTasks, totalTasks } = calculateTaskCompletion(milestone.tasks || [])
  const progress = calculateProgressPercent(doneTasks, totalTasks)

  return {
    id: milestone.id,
    phase: milestone.milestone_name,
    progress,
    doneTasks,
    totalTasks,
    status: getWorkflowPhaseStatus(progress),
    dueDate: milestone.due_date,
    displayOrder: milestone.display_order,
  }
}

export const getProgressCircleColor = (overallProgress: number): string => {
  if (overallProgress >= 80) return 'text-green-600'
  if (overallProgress >= 50) return 'text-blue-600'
  return 'text-yellow-600'
}

export const getSubtaskDueDateColor = (dueDate?: string | null, status?: string): string => {
  if (!dueDate || status === 'done') return 'text-gray-500 dark:text-gray-400'

  const today = new Date()
  const due = new Date(dueDate)
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  if (due < today) return 'text-red-600 dark:text-red-400'
  if (due.getTime() === today.getTime()) return 'text-orange-600 dark:text-orange-400'
  return 'text-gray-500 dark:text-gray-400'
}

export const getSubtaskDueDateLabel = (dueDate?: string | null, status?: string): string => {
  if (!dueDate || status === 'done') return ''

  const today = new Date()
  const due = new Date(dueDate)
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.round((due.getTime() - today.getTime()) / dayMs)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'due today'
  return ''
}
