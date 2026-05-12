import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Package,
  Wrench,
  Circle,
  Trash2,
  Edit2,
  Plus,
  X,
  Minus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
const baseUrl = import.meta.env.VITE_API_URL
import { projectsApi } from '../../../api/project'
import { useQuery } from '@tanstack/react-query'
import type { ProjectTaskManagementMilestone } from '../../../api/project'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetails,
})

type Project = {
  job_number: string
  project_name: string
  company_name: string
  company_address: string
  status: string
  start_date: string
  due_date: string
  days_elapsed: number
}

type WorkflowPhase = {
  id: string
  phase: string
  status: 'pending' | 'in-progress' | 'completed'
  progress: number
  dueDate?: string | null
  displayOrder?: number | null
}

type MaterialStatus = 'N/A' | 'Ordered' | 'Received' | 'By Client'

type Material = {
  id?: string
  name: string
  status: MaterialStatus
  subcontractor: string
  orderedDate: string
  isDefault?: boolean
}

type WorkforceMember = {
  name: string
  role: string
  avatar: string
  status: string
  color: string
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
]

// Default subcontractor items pre-loaded for every project (per Harri's spec)
const DEFAULT_MATERIALS: Material[] = [
  { name: 'Survey', status: 'N/A', subcontractor: '', orderedDate: '', isDefault: true },
  { name: 'Soil Testing', status: 'N/A', subcontractor: '', orderedDate: '', isDefault: true },
  { name: 'Timber Framing', status: 'N/A', subcontractor: '', orderedDate: '', isDefault: true },
]

// Mock subcontractor list — should match Subcontractors page.
// TODO: when backend supports it, fetch from API instead
const SUBCONTRACTORS = [
  'ABC Surveyors',
  'GeoCon Labs',
  'Steel Supply Co',
  'Premier Concrete',
  'Reliable Timber Co',
]


const mapStatusToFrontend = (backendStatus: string) => { 
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

const mapFrontendFieldToBackend = (field: keyof Material) => {
  switch (field) {
    case 'name':
      return 'name'
    case 'status':
      return 'status'
    case 'subcontractor':
      return 'subcontractor'
    case 'orderedDate':
      return 'ordered_date'
    default:
      return field
  }
}

const getMaterialStatusPillClass = (status: MaterialStatus) => {
  switch (status) {
    case 'Received':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'Ordered':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'By Client':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
}

const getWorkforceStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'available':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }
}

const getWorkflowPhaseStatus = (progress: number): WorkflowPhase['status'] => {
  if (progress >= 100) return 'completed'
  if (progress > 0) return 'in-progress'
  return 'pending'
}

const mapMilestoneToWorkflowPhase = (milestone: ProjectTaskManagementMilestone): WorkflowPhase => {
  const progress = Number.isFinite(milestone.progress)
    ? milestone.progress
    : milestone.is_complete
      ? 100
      : 0

  return {
    id: milestone.id,
    phase: milestone.milestone_name,
    progress,
    status: getWorkflowPhaseStatus(progress),
    dueDate: milestone.due_date,
    displayOrder: milestone.display_order,
  }
}

function ProjectDetails() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'timeline'>('overview')
  const [projectStatus, setProjectStatus] = useState('Proposal')
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)

  // Workflow phases are backed by project milestones.
  const [workflow, setWorkflow] = useState<WorkflowPhase[]>([])
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS)
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([])

  // Edit mode for workflow
  const [editingWorkflow, setEditingWorkflow] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')

  // Modal states for adding materials and workforce
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'isDefault'>>({
    name: '',
    status: 'N/A',
    subcontractor: '',
    orderedDate: '',
  })
  const [newWorker, setNewWorker] = useState({ name: '', role: '', status: 'active' })

  const { data: statusData } = useQuery({
    queryKey: ['statuses'],
    queryFn: projectsApi.getProjectStatuses,
  })

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        })
        const result = await response.json()
        if (!response.ok) {
          toast.error(result.detail || 'Failed to fetch project')
          return
        }
        setProjectStatus(result.status)
        setProject(result)
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
            subcontractor: m.supplier_name || '',
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
    fetchMaterials() // Fetch materials separately


  }, [projectId])

  // Calculate overall progress from workflow phases
  const overallProgress =
    workflow.length === 0
      ? 0
      : Math.round(workflow.reduce((sum, p) => sum + p.progress, 0) / workflow.length)

  if (loading) return <div>Loading...</div>

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h2>
        <button
          onClick={() => navigate({ to: '/projects/' })}
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
        toast.success('Project deleted successfully')
        navigate({ to: '/projects/' })
      } catch (error) {
        console.error('Error deleting project:', error)
        toast.error('Network error')
      }
    }
  }

  const handleUpdateProjectStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.detail || 'Failed to update project status')
        return
      }
      toast.success('Project status updated successfully')
      setProjectStatus(newStatus)
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('Network error')
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

  const updatePhaseProgress = async (index: number, progress: number) => {
    const phase = workflow[index]
    if (!phase) return
    const updated = [...workflow]
    updated[index].progress = progress
    updated[index].status = getWorkflowPhaseStatus(progress)
    setWorkflow(updated)
    try {
      await projectsApi.updateProjectMilestone(projectId, phase.id, {
        progress,
        is_complete: progress === 100,
        completion_date: progress === 100 ? new Date().toISOString().slice(0, 10) : null,
      })
    } catch (error) {
      console.error('Error updating workflow phase progress:', error)
      setWorkflow(workflow)
      toast.error('Failed to update workflow phase progress')
    }
  }

  // Material handlers
  const addMaterial = async () => {
    if (!newMaterial.name.trim()) {
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
          name: newMaterial.name,
          status: mapStatusToFrontend(newMaterial.status),
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
        subcontractor: result.supplier_name || result.subcontractor || '',
        orderedDate: result.ordered_date || '',
        isDefault: false,
      };

      setMaterials([...materials, newMaterialFromBackend]);
      setNewMaterial({ name: '', status: 'N/A', subcontractor: '', orderedDate: '' })
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

  // Workforce handlers
  const addWorker = () => {
    if (!newWorker.name.trim() || !newWorker.role.trim()) {
      toast.error('Please fill in name and role')
      return
    }
    const initials = newWorker.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    const color = AVATAR_COLORS[workforce.length % AVATAR_COLORS.length]
    setWorkforce([...workforce, { ...newWorker, avatar: initials, color }])
    setNewWorker({ name: '', role: '', status: 'active' })
    setShowAddWorker(false)
    toast.success('Team member added')
  }

  const removeWorker = (index: number) => {
    setWorkforce(workforce.filter((_, i) => i !== index))
    toast.success('Team member removed')
  }

  // Render a single material card (used in Overview and Resources sections)
  const renderMaterialCard = (material: Material, index: number) => (
    <div
      key={index}
      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 relative group"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package size={18} className="text-gray-400 flex-shrink-0" />
          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{material.name}</h4>
          {material.isDefault && (
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              Default
            </span>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getMaterialStatusPillClass(material.status)}`}>
          {material.status}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            Subcontractor
          </label>
          <select
            value={material.subcontractor}
            onChange={(e) => updateMaterialField(index, 'subcontractor', e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select subcontractor...</option>
            {SUBCONTRACTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            When Ordered
          </label>
          <input
            type="date"
            value={material.orderedDate}
            onChange={(e) => updateMaterialField(index, 'orderedDate', e.target.value)}
            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            Status
          </label>
          <select
            value={material.status}
            onChange={(e) => updateMaterialField(index, 'status', e.target.value as MaterialStatus)}
            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="N/A">N/A</option>
            <option value="Ordered">Ordered</option>
            <option value="Received">Received</option>
            <option value="By Client">By Client</option>
          </select>
        </div>
      </div>

      {!material.isDefault && (
        <button
          onClick={() => removeMaterial(index)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-opacity"
          title="Remove material"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/projects/' })}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Edit project coming soon!')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            <Edit2 size={16} />
            Edit Project
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 size={16} />
            Delete Project
          </button>
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{project.job_number}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{project.project_name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Building2 size={18} />
                <span className="text-sm">{project.company_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin size={18} />
                <span className="text-sm">{project.company_address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar size={18} />
                <span className="text-sm">Start: {project.start_date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock size={18} />
                <span className="text-sm">Delivery: {project.due_date}</span>
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Status:</span>
              <select
                value={projectStatus}
                onChange={(e) => handleUpdateProjectStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {statusData?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallProgress / 100)}`}
                  className={`${
                    overallProgress >= 80 ? 'text-green-600' : overallProgress >= 50 ? 'text-blue-600' : 'text-yellow-600'
                  } transition-all duration-500`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{overallProgress}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'resources', label: 'Resources' },
              { id: 'timeline', label: 'Timeline' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Workflow Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={20} /> Task Workflow Progress
                  </h3>
                  <button
                    onClick={() => setEditingWorkflow(!editingWorkflow)}
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
                </div>

                {/* Add Phase Input (Edit Mode) */}
                {editingWorkflow && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPhaseName}
                        onChange={(e) => setNewPhaseName(e.target.value)}
                        placeholder="New phase name (e.g., Excavation)"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm placeholder:text-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addWorkflowPhase().catch(() => undefined)
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          addWorkflowPhase().catch(() => undefined)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus size={16} /> Add Phase
                      </button>
                    </div>
                  </div>
                )}

                {workflow.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Circle size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No workflow phases yet</p>
                    <p className="text-xs text-gray-400">Click "Edit Phases" above to add your first phase</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflow.map((phase, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                            <span className="font-medium text-gray-900 dark:text-white">{phase.phase}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
                              {phase.progress}%
                            </span>
                            {editingWorkflow && (
                              <button
                                onClick={() => {
                                  removeWorkflowPhase(index).catch(() => undefined)
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="ml-11">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={phase.progress}
                            onChange={(e) => {
                              updatePhaseProgress(index, parseInt(e.target.value)).catch(() => undefined)
                            }}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials & Subcontractor Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package size={20} /> Materials &amp; Subcontractor Orders
                  </h3>
                  <button
                    onClick={() => setShowAddMaterial(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} /> Add Material
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map((material, index) => renderMaterialCard(material, index))}
                </div>
              </div>

              {/* Workforce */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={20} /> Workforce Allocation
                  </h3>
                  <button
                    onClick={() => setShowAddWorker(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} /> Add Member
                  </button>
                </div>

                {workforce.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Users size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No team members added yet</p>
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
                        <button
                          onClick={() => removeWorker(index)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-opacity"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wrench size={20} /> Resources &amp; Materials
                </h3>
                <button
                  onClick={() => setShowAddMaterial(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} /> Add Material
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Material</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Subcontractor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">When Ordered</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {materials.map((material, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{material.name}</span>
                            {material.isDefault && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={material.subcontractor}
                            onChange={(e) => updateMaterialField(index, 'subcontractor', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="">Select...</option>
                            {SUBCONTRACTORS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={material.orderedDate}
                            onChange={(e) => updateMaterialField(index, 'orderedDate', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={material.status}
                            onChange={(e) => updateMaterialField(index, 'status', e.target.value as MaterialStatus)}
                            className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${getMaterialStatusPillClass(material.status)}`}
                          >
                            <option value="N/A">N/A</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Received">Received</option>
                            <option value="By Client">By Client</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {material.isDefault ? (
                            <span className="text-xs text-gray-400 italic">Default</span>
                          ) : (
                            <button
                              onClick={() => removeMaterial(index)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>Timeline view coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Material</h2>
              <button onClick={() => setShowAddMaterial(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Name</label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  placeholder="e.g., Steel Beams"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcontractor</label>
                <select
                  value={newMaterial.subcontractor}
                  onChange={(e) => setNewMaterial({ ...newMaterial, subcontractor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select subcontractor...</option>
                  {SUBCONTRACTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">When Ordered</label>
                <input
                  type="date"
                  value={newMaterial.orderedDate}
                  onChange={(e) => setNewMaterial({ ...newMaterial, orderedDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={newMaterial.status}
                  onChange={(e) => setNewMaterial({ ...newMaterial, status: e.target.value as MaterialStatus })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="N/A">N/A</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Received">Received</option>
                  <option value="By Client">By Client</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addMaterial} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Material
                </button>
                <button onClick={() => setShowAddMaterial(false)} className="px-6 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Team Member</h2>
              <button onClick={() => setShowAddWorker(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  placeholder="e.g., Sarah Chen"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <input
                  type="text"
                  value={newWorker.role}
                  onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                  placeholder="e.g., Project Manager"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={newWorker.status}
                  onChange={(e) => setNewWorker({ ...newWorker, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="available">Available</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addWorker} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Member
                </button>
                <button onClick={() => setShowAddWorker(false)} className="px-6 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
