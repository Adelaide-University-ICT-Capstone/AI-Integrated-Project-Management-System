import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Users,
  X,
  Loader2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { projectsApi } from '../../../api/project'
import { getApiErrorMessage } from '@/api/client'
import { useQuery } from '@tanstack/react-query'
import { Subcontractor, subcontractorsApi } from '@/api/subcontractors'
import { workforceAllocationApi } from '@/api/workforceAllocation'
import { readUsersWithDetails } from '@/client/adminApi'
import { taskManagementApi, type Role } from '@/api/taskManagement'
import { AddMaterialModal } from '@/components/ProjectDetails/AddMaterialModal'
import { MaterialsSection } from '@/components/ProjectDetails/MaterialsSection'
import { ProjectHeader } from '@/components/ProjectDetails/ProjectHeader'
import { ProjectTabs } from '@/components/ProjectDetails/ProjectTabs'
import { TimelineSection } from '@/components/ProjectDetails/TimelineSection'
import { WorkflowSection } from '@/components/ProjectDetails/WorkflowSection'
import type { DirectoryWorker, Material, Project, ProjectTab, WorkflowPhase, WorkforceMember } from '@/components/ProjectDetails/types'
import { EditProjectModal } from '@/components/ProjectDetails/EditProjectModal'
import type { ProjectEditForm } from '@/components/ProjectDetails/types'
import { WorkforceTab } from '@/components/ProjectDetails/WorkforceTab'
import { AVATAR_COLORS } from '@/components/ProjectDetails/constants'
import { calculateProgressPercent, formatRoleLabel, getWorkforceStatusColor, mapFrontendFieldToBackend, mapMilestoneToWorkflowPhase, mapStatusToFrontend } from '@/components/ProjectDetails/utils'
import useAuth from '@/hooks/useAuth'
const baseUrl = import.meta.env.VITE_API_URL

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetails,
})


function WorkforceAllocationModal({
  workers,
  employeeOptions,
  roles,
  saving,
  onClose,
  onSave,
}: {
  workers: WorkforceMember[]
  employeeOptions: DirectoryWorker[]
  roles: Role[]
  saving: boolean
  onClose: () => void
  onSave: (updated: WorkforceMember[]) => Promise<void>
}) {
  const [rows, setRows] = useState<WorkforceMember[]>(workers)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')

  const assignedUserIds = new Set(rows.map((r) => r.userId).filter(Boolean))
  const availableEmployees = employeeOptions.filter((e) => !assignedUserIds.has(e.userId))

  const handleAdd = () => {
    const employee = availableEmployees.find((e) => e.userId === selectedUserId)
    const role = roles.find((r) => r.id === selectedRoleId)
    if (!employee || !role) {
      toast.error('Please choose an employee and role')
      return
    }
    const avatar = employee.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('').slice(0, 2) || 'NA'
    setRows((prev) => [
      ...prev,
      {
        userId: employee.userId,
        name: employee.name,
        role: formatRoleLabel(role.role_name),
        roleId: role.id,
        avatar,
        status: employee.status,
        color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
      },
    ])
    setSelectedUserId('')
    setSelectedRoleId('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-7 pt-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Workforce</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add or remove team members for this project</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 px-7 pb-4">
          <select
            value={selectedUserId}
            onChange={(e) => {
              const emp = availableEmployees.find((w) => w.userId === e.target.value)
              setSelectedUserId(e.target.value)
              setSelectedRoleId(emp?.defaultRoleId || '')
            }}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Employee</option>
            {availableEmployees.map((e) => (
              <option key={e.userId} value={e.userId}>{e.name}</option>
            ))}
          </select>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{formatRoleLabel(r.role_name)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 overflow-y-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-7 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-7 py-6 text-sm text-center text-gray-400">No team members assigned yet</td>
                </tr>
              ) : (
                rows.map((worker, idx) => (
                  <tr key={worker.userId ?? idx} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-7 py-3 text-sm text-gray-800 dark:text-gray-200">{worker.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{worker.role}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={saving}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave(rows)}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectDetails() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview')
  const [projectStatus, setProjectStatus] = useState('')
  const [projectStatusId, setProjectStatusId] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);

  // Workflow phases are backed by project milestones.
  const [workflow, setWorkflow] = useState<WorkflowPhase[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([])

  // Edit mode for workflow
  const [editingWorkflow, setEditingWorkflow] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [savingPhaseDateId, setSavingPhaseDateId] = useState<string | null>(null)

  // Workforce allocation management state
  const [roles, setRoles] = useState<Role[]>([])
  const [directoryWorkers, setDirectoryWorkers] = useState<DirectoryWorker[]>([])
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [workforceSaving, setWorkforceSaving] = useState(false)
  const [removingWorkerId, setRemovingWorkerId] = useState<string | null>(null)
  const [initialWorkforce, setInitialWorkforce] = useState<WorkforceMember[]>([])

  // Modal states for adding materials and workforce
  const [showAddMaterial, setShowAddMaterial] = useState(false)

  // Edit project form
  const [showEditProject, setShowEditProject] = useState(false)
  const [editForm, setEditForm] = useState<ProjectEditForm>({
    project_name: '',
    company_name: '',
    company_address: '',
    client_name: '',
    start_date: '',
    due_date: '',
  })



  const { data: statusData } = useQuery({
    queryKey: ['statuses'],
    queryFn: projectsApi.getProjectStatuses,
  })

  useEffect(() => {
    const fetchSubcontractors = async () => {
      try {
        const data = await subcontractorsApi.getSubcontractors()
        setSubcontractors(data)
        console.log('Fetched subcontractors:', data)
      } catch (error) {
        console.error('Error fetching subcontractors:', error)
        toast.error('Network error while fetching subcontractors')
      }
    }

    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const [response, workforceData, users, rolesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          workforceAllocationApi.getWorkforceAllocations(projectId).catch(() => null),
          readUsersWithDetails().catch(() => []),
          taskManagementApi.getRoles().catch(() => ({ data: [] as Role[], count: 0 })),
        ])

        const result = await response.json()
        if (!response.ok) {
          toast.error(result.detail || 'Failed to fetch project')
          return
        }
        setProjectStatus(result.status || '');
        setProjectStatusId(result.current_status_id || '');
        setProject(result);
        setEditForm({
          project_name: result.project_name || '',
          company_name: result.company_name || '',
          company_address: result.company_address || '',
          client_name: result.client_name || '',
          start_date: result.start_date || '',
          due_date: result.due_date || '',
        });

        const activeRoles = rolesResponse.data.filter((r: Role) => r.is_active)
        setRoles(activeRoles)

        const directory: DirectoryWorker[] = users.map((user: any, index: number) => {
          const name = user.full_name?.trim() || user.email?.split('@')[0] || `User ${index + 1}`
          return {
            userId: user.id,
            name,
            defaultRoleName: 'team_member',
            defaultRoleId: null,
            status: user.is_active ? 'active' : 'available',
          }
        })
        setDirectoryWorkers(directory)

        const directoryByName = new Map(directory.map((d) => [d.name.trim().toLowerCase(), d]))

        const mappedMembers: WorkforceMember[] = (workforceData?.assignments || []).map(
          (assignment, index) => {
            const name = assignment.employee_name?.trim() || `User ${index + 1}`
            const matchedUser = directoryByName.get(name.toLowerCase())
            const avatar =
              name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part: string) => part[0]?.toUpperCase())
                .join('')
                .slice(0, 2) || 'NA'

            return {
              userId: matchedUser?.userId ?? null,
              name,
              role: formatRoleLabel(assignment.role_name),
              roleId: assignment.role_id,
              avatar,
              status: matchedUser?.status ?? 'available',
              color: AVATAR_COLORS[index % AVATAR_COLORS.length],
            }
          },
        )

        setWorkforce(mappedMembers)
        setInitialWorkforce(mappedMembers)
      } catch (error) {
        console.error('Error fetching project data:', error)
        toast.error('Network error')
      } finally {
        setLoading(false)
      }
    }


    const fetchMaterials = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}/materials`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        })

        const result = await response.json();
        console.log('Fetched materials:', result);
        if (response.ok) {

          const apiMaterials: Material[] = result.map((m: any) => ({
            id: m.id,
            name: m.name || '',
            status: mapStatusToFrontend(m.status),
            orderedDate: m.ordered_date || '',
            subcontractorId: m.subcontractor_id || '',
          }))
          setMaterials(apiMaterials)
        } 

      } catch (error) {
        console.error('Error fetching materials:', error)
        toast.error('Network error while fetching materials')
      }
    }

    const fetchWorkflow = async () => {
      try {
        const taskManagement = await projectsApi.getProjectTaskManagement(projectId)
        setWorkflow(taskManagement.milestones.map(mapMilestoneToWorkflowPhase))
      } catch (error) {
        console.error('Error fetching workflow phases:', error)
        toast.error('Network error while fetching workflow phases')
      }
    }


    fetchProject()
    fetchWorkflow()
    fetchSubcontractors()
    fetchMaterials() // Fetch materials separately


  }, [projectId])

  // Calculate overall progress from all tasks in the project.
  const totalTasks = workflow.reduce((sum, phase) => sum + phase.totalTasks, 0)
  const doneTasks = workflow.reduce((sum, phase) => sum + phase.doneTasks, 0)
  const overallProgress = calculateProgressPercent(doneTasks, totalTasks)
  const projectStatusOptions = statusData || []
  const selectStatusValue = projectStatusId || projectStatusOptions.find((status) => status.status_name === projectStatus)?.id || ''
  const canEditWorkflowDates =
    Boolean(user?.is_superuser) || user?.role_name?.trim().toLowerCase() === 'project_manager'

  if (loading) return <div>Loading...</div>

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h2>
        <button
          onClick={() => navigate({ to: '/projects' })}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Projects
        </button>
      </div>
    )
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setProject(null)
      try {
        const token = localStorage.getItem('access_token');
        fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        toast.success('Project deleted successfully');
        navigate({ to: '/projects' });
      } catch (error) {
        console.error('Error deleting project:', error)
        toast.error('Network error')
      }
    }
  }

  const handleUpdateProjectStatus = async (newStatusId: string) => {
    if (!newStatusId || newStatusId === projectStatusId || isUpdatingStatus) return

    const selectedStatus = projectStatusOptions.find((status) => status.id === newStatusId)
    if (!selectedStatus) return

    const previousStatus = projectStatus
    const previousStatusId = projectStatusId
    setProjectStatus(selectedStatus.status_name)
    setProjectStatusId(newStatusId)
    setProject((current) => current ? { ...current, status: selectedStatus.status_name, current_status_id: newStatusId } : current)
    setIsUpdatingStatus(true)

    try {
      await projectsApi.updateProject(projectId, { current_status_id: newStatusId })
      toast.success('Project status updated successfully')
    } catch (error) {
      console.error('Error updating project status:', error)
      setProjectStatus(previousStatus)
      setProjectStatusId(previousStatusId)
      setProject((current) => current ? { ...current, status: previousStatus, current_status_id: previousStatusId } : current)
      toast.error(getApiErrorMessage(error) || 'Failed to update project status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Workflow handlers
  const addWorkflowPhase = async () => {
    if (!newPhaseName.trim()) {
      toast.error('Please enter a phase name')
      return
    }
    try {
      const created = await projectsApi.createProjectMilestone(projectId, {
        milestone_name: newPhaseName.trim(),
        display_order: workflow.length + 1,
        progress: 0,
        is_complete: false,
      })
      setWorkflow([...workflow, mapMilestoneToWorkflowPhase(created)])
      setNewPhaseName('')
      toast.success(`Added "${newPhaseName}" phase`)
    } catch (error) {
      console.error('Error adding workflow phase:', error)
      toast.error('Failed to add workflow phase')
    }
  }

  const removeWorkflowPhase = async (index: number) => {
    const phase = workflow[index]
    if (!phase) return
    try {
      await projectsApi.deleteProjectMilestone(projectId, phase.id)
      setWorkflow(workflow.filter((_, i) => i !== index))
      toast.success('Phase removed')
    } catch (error) {
      console.error('Error removing workflow phase:', error)
      toast.error('Failed to remove workflow phase')
    }
  }


  const updateWorkflowPhaseName = async (index: number, value: string) => {
    const phase = workflow[index]
    const nextName = value.trim()

    if (!phase || !nextName || nextName === phase.phase) return

    try {
      const updated = await projectsApi.updateProjectMilestone(projectId, phase.id, {
        milestone_name: nextName,
      })

      setWorkflow((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, phase: updated.milestone_name }
            : item,
        ),
      )

      toast.success('Workflow phase name updated')
    } catch (error) {
      console.error('Error updating workflow phase name:', error)
      toast.error(getApiErrorMessage(error) || 'Failed to update workflow phase name')
    }
  }


  const updateWorkflowPhaseDueDate = async (index: number, value: string) => {
    const phase = workflow[index]
    if (!phase) return

    if (project?.start_date && value && value < project.start_date) {
      toast.error('Phase due date cannot be before the project start date')
      return
    }

    setSavingPhaseDateId(phase.id)
    try {
      const updated = await projectsApi.updateProjectMilestone(projectId, phase.id, {
        due_date: value || null,
      })

      setWorkflow((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                dueDate: updated.due_date ?? null,
              }
            : item,
        ),
      )
      toast.success('Workflow phase date updated')
    } catch (error) {
      console.error('Error updating workflow phase date:', error)
      toast.error(getApiErrorMessage(error) || 'Failed to update workflow phase date')
    } finally {
      setSavingPhaseDateId(null)
    }
  }

  // Material handlers
  const addMaterial = async (materialToAdd: Omit<Material, 'isDefault'>) => {
    if (!materialToAdd.name.trim()) {
      toast.error('Please enter material name')
      return
    }
    
    // add material to backend
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          name: materialToAdd.name,
          status: materialToAdd.status.toLowerCase().replace(' ', '_'),
          subcontractor_id: materialToAdd.subcontractorId || null,
          ordered_date: materialToAdd.orderedDate || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to add material');
      } 

      // Add the response data (with id) to the materials array
      const newMaterialFromBackend: Material = {
        id: result.id,
        name: result.name,
        status: mapStatusToFrontend(result.status),
        subcontractorId: result.subcontractor_id || '',
        orderedDate: result.ordered_date || '',
        isDefault: false,
      };

      setMaterials([...materials, newMaterialFromBackend]);
      setShowAddMaterial(false);
      toast.success('Material added');

    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add material');
    } 
  }

  const removeMaterial = (index: number) => {
    if (materials[index].isDefault) {
      toast.info('Default subcontractor items cannot be removed')
      return
    }
    setMaterials(materials.filter((_, i) => i !== index))
    
    // delete material from backend
    try {
      const token = localStorage.getItem('access_token');
      console.log(`Deleting material with ID ${materials[index].id} from backend`)
      fetch(`${baseUrl}/api/v1/projects/${projectId}/materials/${materials[index].id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      toast.success('Material removed');

    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    } 
  }

  const updateMaterialField = async <K extends keyof Material>(
    index: number,
    field: K,
    value: Material[K],
  ) => {

    console.log(`Updating material at index ${index}: setting ${field} to ${value}`)
    const material = materials[index];
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}/materials/${material.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [mapFrontendFieldToBackend(field)]: value?.toString().toLowerCase() }),  // Send only the changed field
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update material');
      }

      // Update local state on success
      const updated = [...materials];
      updated[index] = { ...updated[index], [field]: value };
      setMaterials(updated);
      toast.success('Material updated successfully');
    } catch (error) {
      console.error('Error updating material:', error);
    }
  }

  const reloadWorkforce = async () => {
    try {
      const workforceData = await workforceAllocationApi.getWorkforceAllocations(projectId)
      const directoryByName = new Map(directoryWorkers.map((d) => [d.name.trim().toLowerCase(), d]))
      const mappedMembers: WorkforceMember[] = (workforceData?.assignments || []).map(
        (assignment, index) => {
          const name = assignment.employee_name?.trim() || `User ${index + 1}`
          const matchedUser = directoryByName.get(name.toLowerCase())
          const avatar =
            name.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('').slice(0, 2) || 'NA'
          return {
            userId: matchedUser?.userId ?? null,
            name,
            role: formatRoleLabel(assignment.role_name),
            roleId: assignment.role_id,
            avatar,
            status: matchedUser?.status ?? 'available',
            color: AVATAR_COLORS[index % AVATAR_COLORS.length],
          }
        },
      )
      setWorkforce(mappedMembers)
      setInitialWorkforce(mappedMembers)
    } catch (error) {
      console.error('Error reloading workforce:', error)
      toast.error('Failed to reload workforce')
    }
  }

  const persistWorkforceChanges = async (updatedRows: WorkforceMember[]) => {
    const additions = updatedRows.filter(
      (w) => w.userId && w.roleId && !initialWorkforce.some((iw) => iw.userId === w.userId),
    )
    const removals = initialWorkforce.filter(
      (iw) => iw.userId && !updatedRows.some((w) => w.userId === iw.userId),
    )
    if (additions.length === 0 && removals.length === 0) {
      setShowAllocationModal(false)
      toast.success('No changes to save')
      return
    }
    setWorkforceSaving(true)
    try {
      if (additions.length > 0) {
        await workforceAllocationApi.assignWorkforce(
          projectId,
          additions.map((w) => ({ user_id: w.userId as string, role_id: w.roleId as string })),
        )
      }
      if (removals.length > 0) {
        await workforceAllocationApi.removeWorkforce(projectId, {
          user_ids: removals.map((w) => w.userId as string),
        })
      }
      await reloadWorkforce()
      setShowAllocationModal(false)
      toast.success('Workforce updated successfully')
    } catch (error) {
      console.error('Error saving workforce:', error)
      toast.error('Failed to save workforce changes')
    } finally {
      setWorkforceSaving(false)
    }
  }

  const handleRemoveWorker = async (member: WorkforceMember) => {
    if (!member.userId) {
      toast.error('This assignment cannot be removed — user record not found')
      return
    }
    setRemovingWorkerId(member.userId)
    try {
      await workforceAllocationApi.removeWorkforce(projectId, { user_ids: [member.userId] })
      await reloadWorkforce()
      toast.success('Team member removed')
    } catch (error) {
      console.error('Error removing worker:', error)
      toast.error('Failed to remove team member')
    } finally {
      setRemovingWorkerId(null)
    }
  }

  const handleSaveProjectEdit = async () => {
    try {
      const updated = await projectsApi.updateProject(projectId, {
        project_name: editForm.project_name,
        client_company: editForm.company_name,
        client_address: editForm.company_address,
        client_name: editForm.client_name,
        start_date: editForm.start_date,
        due_date: editForm.due_date,
      })

      console.log('Project updated:', updated)

      setProject((current) =>
        current
          ? {
              ...current,
              project_name: updated.project_name ?? editForm.project_name,
              company_name: updated.company_name ?? editForm.company_name,
              company_address: updated.company_address ?? editForm.company_address,
              client_name: updated.client_name ?? editForm.client_name,
              start_date: updated.start_date ?? editForm.start_date,
              due_date: updated.due_date ?? editForm.due_date,
            }
          : current,
      )

      console.log('Project state after update:', project)

      setShowEditProject(false)
      toast.success('Project updated successfully')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error(getApiErrorMessage(error) || 'Failed to update project')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ProjectHeader
        project={project}
        overallProgress={overallProgress}
        projectStatusOptions={projectStatusOptions}
        selectStatusValue={selectStatusValue}
        isUpdatingStatus={isUpdatingStatus}
        onBack={() => navigate({ to: '/projects' })}
        onDelete={handleDelete}
        onEdit={() => setShowEditProject(true)}
        onUpdateStatus={(statusId) => void handleUpdateProjectStatus(statusId)}
      />

      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <WorkflowSection
                workflow={workflow}
                selectedPhaseIndex={null}
                editingWorkflow={editingWorkflow}
                newPhaseName={newPhaseName}
                canEditWorkflowDates={canEditWorkflowDates}
                savingPhaseDateId={savingPhaseDateId}
                onToggleEditing={() => setEditingWorkflow((current) => !current)}
                onNewPhaseNameChange={setNewPhaseName}
                onAddPhase={() => void addWorkflowPhase()}
                onRemovePhase={(index) => void removeWorkflowPhase(index)}
                onUpdatePhaseDueDate={(index, value) => {
                  void updateWorkflowPhaseDueDate(index, value)
                }}
                onUpdatePhaseName={(index, value) => {
                  void updateWorkflowPhaseName(index, value)
                }}
              />

              {/* Materials & Subcontractor Orders */}
              <MaterialsSection
                materials={materials}
                subcontractors={subcontractors}
                onOpenAddMaterial={() => setShowAddMaterial(true)}
                onRemoveMaterial={removeMaterial}
                onUpdateMaterialField={(index, field, value) => {
                  void updateMaterialField(index, field, value)
                }}
              />

              {/* Workforce */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={20} /> Workforce Allocation
                  </h3>
                  <Link
                    to="/projects/workforce/$projectId"
                    params={{ projectId }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add
                  </Link>
                </div>
                {workforce.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Users size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No workforce data available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workforce.map((member, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 relative group">
                        <div className={`w-12 h-12 ${member.color} rounded-full flex items-center justify-center text-white font-bold`}>
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{member.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{member.role}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getWorkforceStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <MaterialsSection
              materials={materials}
              subcontractors={subcontractors}
              onOpenAddMaterial={() => setShowAddMaterial(true)}
              onRemoveMaterial={removeMaterial}
              onUpdateMaterialField={(index, field, value) => {
                void updateMaterialField(index, field, value)
              }}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineSection workflow={workflow} startDate={project.start_date} dueDate={project.due_date} />
          )}

          {activeTab === 'workforce' && (
            <WorkforceTab
              workforce={workforce}
              directoryWorkers={directoryWorkers}
              roles={roles}
              workforceSaving={workforceSaving}
              removingWorkerId={removingWorkerId}
              onRemoveWorker={handleRemoveWorker}
              onPersistWorkforce={persistWorkforceChanges}
            />
          )}
      </ProjectTabs>

      {/* Workforce Allocation Modal */}
      {showAllocationModal && (
        <WorkforceAllocationModal
          workers={workforce}
          employeeOptions={directoryWorkers}
          roles={roles}
          saving={workforceSaving}
          onClose={() => setShowAllocationModal(false)}
          onSave={persistWorkforceChanges}
        />
      )}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <AddMaterialModal
          subcontractors={subcontractors}
          onClose={() => setShowAddMaterial(false)}
          onSave={(material) => void addMaterial(material)}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <EditProjectModal
          editForm={editForm}
          onClose={() => setShowEditProject(false)}
          onChange={setEditForm}
          onSave={() => void handleSaveProjectEdit()}
        />
      )}
    </div>
  )
}
