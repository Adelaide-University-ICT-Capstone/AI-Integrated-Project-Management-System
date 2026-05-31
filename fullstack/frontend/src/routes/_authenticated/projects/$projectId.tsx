// Project Details — main route file.
//
// All the heavy UI lives in src/components/ProjectDetails/:
//   - WorkflowSection      — the phase list with progress sliders
//   - PhasePanel           — slide-out subtask panel + arrow tab
//   - MaterialsSection     — the materials grid (default + custom)
//   - WorkforceSection     — team member cards
//   - AddSubtaskModal      — modal triggered from the phase panel
//   - AddMaterialModal     — modal triggered from the materials section
//   - AddWorkerModal       — modal triggered from the workforce section
//   - EditProjectModal     — modal triggered from the header
//   - types / constants / utils — shared module helpers
//
// This file handles:
//   - Data fetching (project + status list)
//   - All page-level state (workflow, materials, workforce, modals, etc.)
//   - The handler functions that the extracted components call back into
//   - The project header (info card + progress circle + status dropdown)
//   - The Overview / Resources / Timeline tabs and the Resources table

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Edit2,
  MapPin,
  Package,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react'

import { projectsApi } from '../../../api/project'

// Extracted module — see src/components/ProjectDetails/
import type {
  Material,
  MaterialStatus,
  ProjectEditForm,
  Subtask,
  SubtaskStatus,
  WorkflowPhase,
  WorkforceMember,
} from '@/components/ProjectDetails/types'
import {
  AVATAR_COLORS,
  DEFAULT_MATERIALS,
  SUBCONTRACTORS,
} from '@/components/ProjectDetails/constants'
import {
  calcOverallProgress,
  getInitialsFromName,
  getMaterialStatusPillClass,
  getProgressCircleColor,
} from '@/components/ProjectDetails/utils'
import WorkflowSection from '@/components/ProjectDetails/WorkflowSection'
import PhasePanel from '@/components/ProjectDetails/PhasePanel'
import MaterialsSection from '@/components/ProjectDetails/MaterialsSection'
import WorkforceSection from '@/components/ProjectDetails/WorkforceSection'
import AddSubtaskModal from '@/components/ProjectDetails/AddSubtaskModal'
import AddMaterialModal from '@/components/ProjectDetails/AddMaterialModal'
import AddWorkerModal from '@/components/ProjectDetails/AddWorkerModal'
import EditProjectModal from '@/components/ProjectDetails/EditProjectModal'

const baseUrl = import.meta.env.VITE_API_URL

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetails,
})

// Local Project type — kept here because it shapes the API response
// and isn't referenced by the extracted components.
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

function ProjectDetails() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()

  // ----- Page-level state -----
  const [activeTab, setActiveTab] = useState
    'overview' | 'resources' | 'timeline'
  >('overview')
  const [projectStatus, setProjectStatus] = useState('Proposal')
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)

  // Domain state — workflow phases, materials, team
  const [workflow, setWorkflow] = useState<WorkflowPhase[]>([])
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS)
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([])

  // Workflow editing
  const [editingWorkflow, setEditingWorkflow] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')

  // Modal visibility flags
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)

  // Edit Project form state — pre-populated when the user clicks Edit
  const [editForm, setEditForm] = useState<ProjectEditForm>({
    project_name: '',
    company_name: '',
    company_address: '',
    start_date: '',
    due_date: '',
  })

  // Slide-out subtask panel state
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(
    null,
  )
  const [phasePanelOpen, setPhasePanelOpen] = useState(false)

  // ----- Status enum dropdown -----
  // useQuery caches the list across navigations so we don't re-fetch
  // every time someone opens a different project.
  const { data: statusData } = useQuery({
    queryKey: ['statuses'],
    queryFn: projectsApi.getProjectStatuses,
  })

  // ----- Fetch the project on mount -----
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
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
    fetchProject()
  }, [projectId])

  // Average completion across all phases — drives the progress circle.
  const overallProgress = calcOverallProgress(workflow.map((p) => p.progress))

  // ----- Guard rendering until we have a project -----
  if (loading) return <div>Loading...</div>

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Project Not Found
        </h2>
        <button
          onClick={() => navigate({ to: '/projects' })}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Projects
        </button>
      </div>
    )
  }

  // ----- Project-level handlers -----

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this project? This action cannot be undone.',
      )
    ) {
      // Clear state optimistically and fire the DELETE in the background.
      // If the backend rejects it we'll catch the error and surface a toast.
      setProject(null)
      try {
        fetch(`${baseUrl}/api/v1/projects/${projectId}`, { method: 'DELETE' })
        toast.success('Project deleted successfully')
        navigate({ to: '/projects' })
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  const handleSaveProjectEdit = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.detail || 'Failed to update project')
        return
      }
      // Merge the patch onto the existing project so the header updates
      // immediately without a re-fetch.
      setProject((prev) => (prev ? { ...prev, ...editForm } : prev))
      setShowEditProject(false)
      toast.success('Project updated successfully')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Network error')
    }
  }

  const handleOpenEditProject = () => {
    if (!project) return
    setEditForm({
      project_name: project.project_name,
      company_name: project.company_name,
      company_address: project.company_address,
      start_date: project.start_date,
      due_date: project.due_date,
    })
    setShowEditProject(true)
  }

  // ----- Workflow handlers -----

  const addWorkflowPhase = () => {
    if (!newPhaseName.trim()) {
      toast.error('Please enter a phase name')
      return
    }
    setWorkflow([
      ...workflow,
      { phase: newPhaseName, status: 'pending', progress: 0, subtasks: [] },
    ])
    setNewPhaseName('')
    toast.success(`Added "${newPhaseName}" phase`)
  }

  const removeWorkflowPhase = (index: number) => {
    setWorkflow(workflow.filter((_, i) => i !== index))
    if (selectedPhaseIndex === index) {
      setSelectedPhaseIndex(null)
      setPhasePanelOpen(false)
    }
    toast.success('Phase removed')
  }

  const updatePhaseProgress = (index: number, progress: number) => {
    const updated = [...workflow]
    updated[index].progress = progress
    // Auto-set status based on progress so users don't have to manually
    // flip a status flag — 100% becomes 'completed', any progress is
    // 'in-progress', and 0% reverts to 'pending'.
    updated[index].status =
      progress === 100
        ? 'completed'
        : progress > 0
          ? 'in-progress'
          : 'pending'
    setWorkflow(updated)
  }

  // ----- Phase panel handlers -----

  const handlePhaseClick = (index: number) => {
    setSelectedPhaseIndex(index)
    setPhasePanelOpen(true)
  }

  // ----- Subtask handlers -----

  const addSubtask = (data: Omit<Subtask, 'id' | 'assignees'>) => {
    if (selectedPhaseIndex === null) return
    const updated = [...workflow]
    const subtask: Subtask = {
      id: Date.now().toString(),
      title: data.title,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate,
      assignees: [],
    }
    updated[selectedPhaseIndex].subtasks = [
      ...updated[selectedPhaseIndex].subtasks,
      subtask,
    ]
    setWorkflow(updated)
    setShowAddSubtask(false)
    toast.success('Subtask added')
  }

  const removeSubtask = (subtaskId: string) => {
    if (selectedPhaseIndex === null) return
    const updated = [...workflow]
    updated[selectedPhaseIndex].subtasks = updated[
      selectedPhaseIndex
    ].subtasks.filter((s) => s.id !== subtaskId)
    setWorkflow(updated)
    toast.success('Subtask removed')
  }

  const updateSubtaskStatus = (subtaskId: string, newStatus: SubtaskStatus) => {
    if (selectedPhaseIndex === null) return
    const updated = [...workflow]
    updated[selectedPhaseIndex].subtasks = updated[
      selectedPhaseIndex
    ].subtasks.map((s) => (s.id === subtaskId ? { ...s, status: newStatus } : s))
    setWorkflow(updated)
  }

  // ----- Material handlers -----

  const addMaterial = (material: Omit<Material, 'isDefault'>) => {
    setMaterials([...materials, { ...material }])
    setShowAddMaterial(false)
    toast.success('Material added')
  }

  const removeMaterial = (index: number) => {
    if (materials[index].isDefault) {
      toast.info('Default subcontractor items cannot be removed')
      return
    }
    setMaterials(materials.filter((_, i) => i !== index))
    toast.success('Material removed')
  }

  const updateMaterialField = <K extends keyof Material>(
    index: number,
    field: K,
    value: Material[K],
  ) => {
    const updated = [...materials]
    updated[index] = { ...updated[index], [field]: value }
    setMaterials(updated)
  }

  // ----- Workforce handlers -----

  const addWorker = (worker: { name: string; role: string; status: string }) => {
    const initials = getInitialsFromName(worker.name)
    // Cycle through AVATAR_COLORS so members visually distinguish from
    // each other on the workforce grid.
    const color = AVATAR_COLORS[workforce.length % AVATAR_COLORS.length]
    setWorkforce([...workforce, { ...worker, avatar: initials, color }])
    setShowAddWorker(false)
    toast.success('Team member added')
  }

  const removeWorker = (index: number) => {
    setWorkforce(workforce.filter((_, i) => i !== index))
    toast.success('Team member removed')
  }

  // ----- Render -----

  const selectedPhase =
    selectedPhaseIndex !== null ? workflow[selectedPhaseIndex] : null

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar — Back / Edit / Delete */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/projects' })}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEditProject}
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

      {/* Project Header — info + progress circle + status dropdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {project.job_number}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {project.project_name}
            </h1>
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

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Status:
              </span>
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

          {/* Progress circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallProgress / 100)}`}
                  className={`${getProgressCircleColor(overallProgress)} transition-all duration-500`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overallProgress}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Overall Progress
            </p>
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
          {/* OVERVIEW TAB — workflow + materials grid + workforce */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <WorkflowSection
                workflow={workflow}
                selectedPhaseIndex={selectedPhaseIndex}
                editingWorkflow={editingWorkflow}
                newPhaseName={newPhaseName}
                onToggleEditing={() => setEditingWorkflow(!editingWorkflow)}
                onNewPhaseNameChange={setNewPhaseName}
                onAddPhase={addWorkflowPhase}
                onRemovePhase={removeWorkflowPhase}
                onPhaseClick={handlePhaseClick}
                onUpdatePhaseProgress={updatePhaseProgress}
              />

              <MaterialsSection
                materials={materials}
                onOpenAddMaterial={() => setShowAddMaterial(true)}
                onRemoveMaterial={removeMaterial}
                onUpdateMaterialField={updateMaterialField}
              />

              <WorkforceSection
                workforce={workforce}
                onOpenAddWorker={() => setShowAddWorker(true)}
                onRemoveWorker={removeWorker}
              />
            </div>
          )}

          {/* RESOURCES TAB — same materials data but in a table view.
              Kept inline because it shares state directly with the
              grid above and extracting it would mean prop-drilling
              the same handlers twice. */}
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Material
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Subcontractor
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        When Ordered
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {materials.map((material, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {material.name}
                            </span>
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
                            onChange={(e) =>
                              updateMaterialField(
                                index,
                                'subcontractor',
                                e.target.value,
                              )
                            }
                            className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="">Select...</option>
                            {SUBCONTRACTORS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={material.orderedDate}
                            onChange={(e) =>
                              updateMaterialField(
                                index,
                                'orderedDate',
                                e.target.value,
                              )
                            }
                            className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={material.status}
                            onChange={(e) =>
                              updateMaterialField(
                                index,
                                'status',
                                e.target.value as MaterialStatus,
                              )
                            }
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
                            <span className="text-xs text-gray-400 italic">
                              Default
                            </span>
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

          {/* TIMELINE TAB — placeholder for future Gantt-style view */}
          {activeTab === 'timeline' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>Timeline view coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out subtask panel + arrow tab.
          Rendered as a sibling so they sit on top of the main layout. */}
      <PhasePanel
        jobNumber={project.job_number}
        selectedPhase={selectedPhase}
        phasePanelOpen={phasePanelOpen}
        onShowPanel={() => setPhasePanelOpen(true)}
        onHidePanel={() => setPhasePanelOpen(false)}
        onClose={() => {
          setPhasePanelOpen(false)
          setSelectedPhaseIndex(null)
        }}
        onAddSubtask={() => setShowAddSubtask(true)}
        onRemoveSubtask={removeSubtask}
        onUpdateSubtaskStatus={updateSubtaskStatus}
      />

      {/* Modals — only mounted when active to keep the DOM light */}
      {showAddSubtask && selectedPhase && (
        <AddSubtaskModal
          phaseName={selectedPhase.phase}
          onClose={() => setShowAddSubtask(false)}
          onSave={addSubtask}
        />
      )}

      {showAddMaterial && (
        <AddMaterialModal
          onClose={() => setShowAddMaterial(false)}
          onSave={addMaterial}
        />
      )}

      {showAddWorker && (
        <AddWorkerModal
          onClose={() => setShowAddWorker(false)}
          onSave={addWorker}
        />
      )}

      {showEditProject && (
        <EditProjectModal
          editForm={editForm}
          onClose={() => setShowEditProject(false)}
          onChange={setEditForm}
          onSave={handleSaveProjectEdit}
        />
      )}
    </div>
  )
}