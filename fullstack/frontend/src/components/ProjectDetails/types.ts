import type { Role } from '@/api/taskManagement'

export type Project = {
  job_number: string
  project_name: string
  company_name: string
  company_address: string
  client_name: string
  status: string
  current_status_id?: string | null
  start_date: string
  due_date: string
  days_elapsed: number
}

export type WorkflowPhase = {
  id: string
  phase: string
  status: 'pending' | 'in-progress' | 'completed'
  progress: number
  doneTasks: number
  totalTasks: number
  dueDate?: string | null
  displayOrder?: number | null
}

export type MaterialStatus = 'N/A' | 'Ordered' | 'Received' | 'By Client'

export type Material = {
  id?: string
  name: string
  status: MaterialStatus
  subcontractorId: string
  orderedDate: string
  isDefault?: boolean
}

export type WorkforceMember = {
  userId: string | null
  employeeId?: string | null
  name: string
  role: string
  roleId: string | null
  avatar: string
  status: string
  color: string
}

export type DirectoryWorker = {
  userId: string
  name: string
  defaultRoleName: string
  defaultRoleId: string | null
  status: string
}




export type WorkflowPhaseStatus = 'pending' | 'in-progress' | 'completed'

export type ProjectTab = 'overview' | 'resources' | 'timeline' | 'workforce'

export type WorkforceAllocationSave = (updated: WorkforceMember[]) => Promise<void>

export type WorkforceAllocationRole = Role

export type ProjectEditForm = Pick<
  Project,
  'project_name' | 'company_name' | 'company_address' | 'start_date' | 'due_date' | 'client_name'
>

export type SubtaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type SubtaskStatus = 'todo' | 'in-progress' | 'review' | 'done'

export type SubtaskAssignee = {
  name: string
  role: string
  initials: string
  color: string
  hours: number
}

export type Subtask = {
  id: string
  title: string
  priority: SubtaskPriority
  status: SubtaskStatus
  dueDate?: string | null
  assignees: SubtaskAssignee[]
}
