import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  Phone,
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Hash,
  CheckCircle2,
  TrendingUp,
  ListTodo,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
const baseUrl = import.meta.env.VITE_API_URL
import { toast } from 'react-toastify'

export const Route = createFileRoute('/_authenticated/projects/new')({
  component: NewProject,
})

type WorkflowPhase = {
  id: string
  name: string
  progress: number
}

type Subtask = {
  id: string
  title: string
  phaseId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

type StepKey = 'details' | 'workflow' | 'subtasks'

function NewProject() {
  const navigate = useNavigate()
  const [, setSubmissionError] = useState('')
  const [currentStep, setCurrentStep] = useState<StepKey>('details')
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set())

  // Step 1 — Details
  const [formData, setFormData] = useState({
    jobNumber: '',
    client: '',
    agent: '',
    contact: '',
    jobTitle: '',
    lotNo: '',
    street: '',
    suburb: '',
    dueDate: new Date().toISOString().split('T')[0],
    dateReceived: new Date().toISOString().split('T')[0],
    status: 'prelim',
    project_type: 'residential',
    feeEstimate: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 2 — Workflow Phases
  const [phases, setPhases] = useState<WorkflowPhase[]>([])
  const [newPhaseName, setNewPhaseName] = useState('')

  // Step 3 — Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtask, setNewSubtask] = useState({
    title: '',
    phaseId: '',
    priority: 'medium' as Subtask['priority'],
  })

  const calculateDaysElapsed = () => {
    if (!formData.dateReceived) return 0
    const received = new Date(formData.dateReceived)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - received.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateDetails = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.jobNumber.trim()) newErrors.jobNumber = 'Job Number is required'
    if (!formData.client.trim()) newErrors.client = 'Client is required'
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job Title is required'
    if (!formData.dateReceived) newErrors.dateReceived = 'Date Received is required'
    if (!formData.dueDate) newErrors.dueDate = 'Due Date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step navigation
  const goToStep = (step: StepKey) => {
    if (step === 'workflow' && !validateDetails()) {
      toast.error('Please fill all required fields in Details')
      return
    }
    setCurrentStep(step)
  }

  const handleNext = () => {
    if (currentStep === 'details') {
      if (!validateDetails()) {
        toast.error('Please fill all required fields')
        return
      }
      setCompletedSteps((prev) => new Set(prev).add('details'))
      setCurrentStep('workflow')
    } else if (currentStep === 'workflow') {
      setCompletedSteps((prev) => new Set(prev).add('workflow'))
      setCurrentStep('subtasks')
    }
  }

  const handleBack = () => {
    if (currentStep === 'workflow') setCurrentStep('details')
    else if (currentStep === 'subtasks') setCurrentStep('workflow')
  }

  // Phase handlers
  const addPhase = () => {
    if (!newPhaseName.trim()) {
      toast.error('Please enter a phase name')
      return
    }
    setPhases([...phases, { id: Date.now().toString(), name: newPhaseName, progress: 0 }])
    setNewPhaseName('')
  }

  const removePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id))
    // Also remove subtasks tied to this phase
    setSubtasks(subtasks.filter((s) => s.phaseId !== id))
  }

  const updatePhaseProgress = (id: string, progress: number) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, progress } : p)))
  }

  // Subtask handlers
  const addSubtask = () => {
    if (!newSubtask.title.trim()) {
      toast.error('Please enter subtask title')
      return
    }
    if (!newSubtask.phaseId) {
      toast.error('Please select a phase')
      return
    }
    setSubtasks([
      ...subtasks,
      { id: Date.now().toString(), ...newSubtask },
    ])
    setNewSubtask({ title: '', phaseId: newSubtask.phaseId, priority: 'medium' })
  }

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id))
  }

  const updateSubtaskPhase = (id: string, phaseId: string) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, phaseId } : s)))
  }

  // Final submit
  const handleSubmit = async () => {
    setSubmissionError('')

    const payload = {
      job_number: formData.jobNumber,
      project_types: formData.project_type,
      project_name: formData.jobTitle,
      client_company: formData.client,
      client_name: formData.agent,
      client_contact: formData.contact,
      client_address: [`${formData.lotNo} ${formData.street}`, formData.suburb]
        .filter(Boolean)
        .join(', '),
      fee_estimate: formData.feeEstimate,
      date_received: formData.dateReceived,
      start_date: formData.dateReceived,
      due_date: formData.dueDate,
      // workflow_phases and subtasks stored locally for now (backend doesn't accept them yet)
      // when backend is ready: phases, subtasks
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.detail || 'Failed to create project')
        return
      }
      toast.success('Project created successfully')
      navigate({ to: '/projects/' })
    } catch (error) {
      setSubmissionError('Unable to reach the backend. Please try again later.')
      toast.error('Unable to reach the backend')
    }
  }

  const priorityColors = {
    low: 'bg-gray-200 text-gray-700',
    medium: 'bg-blue-200 text-blue-700',
    high: 'bg-orange-200 text-orange-700',
    critical: 'bg-red-200 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/projects/' })}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Title */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fill in the details, define workflow phases, and add subtasks
          </p>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { id: 'details', label: 'Details', icon: FileText, num: 1 },
            { id: 'workflow', label: 'Workflow', icon: TrendingUp, num: 2 },
            { id: 'subtasks', label: 'Subtasks', icon: ListTodo, num: 3 },
          ].map((step) => {
            const isActive = currentStep === step.id
            const isDone = completedSteps.has(step.id as StepKey)
            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id as StepKey)}
                className={`py-4 mr-8 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : isDone
                    ? 'border-transparent text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : step.num}
                </span>
                {step.num}. {step.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* STEP 1 — DETAILS */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="jobNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Hash size={16} />
                      Job Number <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="jobNumber"
                    name="jobNumber"
                    value={formData.jobNumber}
                    onChange={handleChange}
                    placeholder="PRJ-2024-XXX"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 ${
                      errors.jobNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.jobNumber && <p className="mt-1 text-sm text-red-500">{errors.jobNumber}</p>}
                </div>

                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} />
                      Client <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="client"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Client name"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 ${
                      errors.client ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.client && <p className="mt-1 text-sm text-red-500">{errors.client}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="agent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} /> Agent
                    </div>
                  </label>
                  <input
                    type="text"
                    id="agent"
                    name="agent"
                    value={formData.agent}
                    onChange={handleChange}
                    placeholder="Agent name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone size={16} /> Contact
                    </div>
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} /> Job Title <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Project title or description"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 ${
                    errors.jobTitle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.jobTitle && <p className="mt-1 text-sm text-red-500">{errors.jobTitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="lotNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} /> Lot No. / Street No.
                    </div>
                  </label>
                  <input
                    type="text"
                    id="lotNo"
                    name="lotNo"
                    value={formData.lotNo}
                    onChange={handleChange}
                    placeholder="Lot 45, 123"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} /> Street
                    </div>
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Main Street"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} /> Suburb
                  </div>
                </label>
                <input
                  type="text"
                  id="suburb"
                  name="suburb"
                  value={formData.suburb}
                  onChange={handleChange}
                  placeholder="Downtown District"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="dateReceived" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} /> Date Received <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    id="dateReceived"
                    name="dateReceived"
                    value={formData.dateReceived}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                      errors.dateReceived ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.dateReceived && <p className="mt-1 text-sm text-red-500">{errors.dateReceived}</p>}
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} /> Due Date <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                      errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} /> Days Elapsed
                    </div>
                  </label>
                  <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">
                    {calculateDaysElapsed()} days
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="project_type"
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="structural">Structural</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="feeEstimate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} /> Fee Estimate
                    </div>
                  </label>
                  <input
                    type="number"
                    id="feeEstimate"
                    name="feeEstimate"
                    value={formData.feeEstimate}
                    onChange={handleChange}
                    placeholder="450000"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — WORKFLOW */}
          {currentStep === 'workflow' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Define Workflow Phases</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add phases like Planning, Foundation, Structural. You can adjust progress with the slider.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="New phase name (e.g., Excavation)"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhase())}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm placeholder:text-gray-400"
                  />
                  <button
                    onClick={addPhase}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus size={16} /> Add Phase
                  </button>
                </div>
              </div>

              {phases.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No phases added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add phases above to organize your project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-white flex-1">{phase.name}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={phase.progress}
                        onChange={(e) => updatePhaseProgress(phase.id, parseInt(e.target.value))}
                        className="flex-[2] h-2 bg-gray-200 dark:bg-gray-700 rounded-full accent-blue-600 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
                        {phase.progress}%
                      </span>
                      <button
                        onClick={() => removePhase(phase.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — SUBTASKS */}
          {currentStep === 'subtasks' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Add Subtasks to Phases</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Break each phase into actionable subtasks. These will appear on the Task Board.
                </p>
              </div>

              {phases.length === 0 ? (
                <div className="text-center py-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-700">
                  <ListTodo size={48} className="mx-auto text-yellow-500 mb-3" />
                  <p className="text-yellow-800 dark:text-yellow-400 font-medium">No workflow phases yet</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                    Go back to Step 2 and add at least one phase before adding subtasks
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={newSubtask.title}
                        onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                        placeholder="Subtask title"
                        className="md:col-span-5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm placeholder:text-gray-400"
                      />
                      <select
                        value={newSubtask.phaseId}
                        onChange={(e) => setNewSubtask({ ...newSubtask, phaseId: e.target.value })}
                        className="md:col-span-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Select phase</option>
                        {phases.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newSubtask.priority}
                        onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value as Subtask['priority'] })}
                        className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <button
                        onClick={addSubtask}
                        className="md:col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>

                  {subtasks.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <ListTodo size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No subtasks added yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Title</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Phase</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Priority</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {subtasks.map((subtask) => (
                            <tr key={subtask.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{subtask.title}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={subtask.phaseId}
                                  onChange={(e) => updateSubtaskPhase(subtask.id, e.target.value)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                  {phases.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded ${priorityColors[subtask.priority]}`}>
                                  {subtask.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => removeSubtask(subtask.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <button
            onClick={currentStep === 'details' ? () => navigate({ to: '/projects/' }) : handleBack}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {currentStep === 'details' ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft size={18} /> Back
              </>
            )}
          </button>

          {currentStep === 'subtasks' ? (
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Save size={20} />
              Save Project
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}