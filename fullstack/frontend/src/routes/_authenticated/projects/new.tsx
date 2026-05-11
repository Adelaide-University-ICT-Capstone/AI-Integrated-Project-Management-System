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
} from 'lucide-react'
const baseUrl = import.meta.env.VITE_API_URL;
import { toast } from "react-toastify";


export const Route = createFileRoute('/_authenticated/projects/new')({
  component: NewProject,
})

function NewProject() {
  const navigate = useNavigate()
  const [, setSubmissionError] = useState('')
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

  const calculateDaysElapsed = () => {
    if (!formData.dateReceived) return 0
    const received = new Date(formData.dateReceived)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - received.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }


  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.jobNumber.trim()) newErrors.jobNumber = 'Job Number is required'
    if (!formData.client.trim()) newErrors.client = 'Client is required'
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job Title is required'
    if (!formData.dateReceived) newErrors.dateReceived = 'Date Received is required'
    if (!formData.status) newErrors.status = 'Status is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmissionError('')

    const payload = {
      job_number: formData.jobNumber,
      project_types: formData.project_type,
      project_name: formData.jobTitle,
      client_company: formData.client,
      client_name: formData.agent,
      client_contact: formData.contact,
      client_address: [`${formData.lotNo} ${formData.street}`, formData.suburb].filter(Boolean).join(', '),
      fee_estimate: formData.feeEstimate,
      date_received: formData.dateReceived,
      start_date: formData.dateReceived,
      due_date: formData.dueDate,
    }

    console.log('Submitting payload:', payload)
    

    try {
      const response = await fetch(`${baseUrl}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.detail || 'Failed to create project')
        return
      }

      toast.success("Project created successfully");
      navigate({ to: '/projects/' })
    } catch (error) {
      setSubmissionError('Unable to reach the backend. Please try again later.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fill in the details to create a new engineering project
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Number & Client */}
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
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.client ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.client && <p className="mt-1 text-sm text-red-500">{errors.client}</p>}
            </div>
          </div>

          {/* Agent & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="agent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  Agent
                </div>
              </label>
              <input
                type="text"
                id="agent"
                name="agent"
                value={formData.agent}
                onChange={handleChange}
                placeholder="Agent name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  Contact
                </div>
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                Job Title <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="Project title or description"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.jobTitle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.jobTitle && <p className="mt-1 text-sm text-red-500">{errors.jobTitle}</p>}
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lotNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  Lot No. / Street No.
                </div>
              </label>
              <input
                type="text"
                id="lotNo"
                name="lotNo"
                value={formData.lotNo}
                onChange={handleChange}
                placeholder="Lot 45, 123"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  Street
                </div>
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Main Street"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                Suburb
              </div>
            </label>
            <input
              type="text"
              id="suburb"
              name="suburb"
              value={formData.suburb}
              onChange={handleChange}
              placeholder="Downtown District"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date Received & Days Elapsed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="dateReceived" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Date Received <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="date"
                id="dateReceived"
                name="dateReceived"
                value={formData.dateReceived}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dateReceived ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.dateReceived && <p className="mt-1 text-sm text-red-500">{errors.dateReceived}</p>}
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Due Date <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  Days Elapsed
                </div>
              </label>
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">
                {calculateDaysElapsed()} days
              </div>
            </div>
          </div>

          {/* Status & Fee Estimate */}
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
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.project_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="structural">Structural</option>

              </select>
              {errors.project_type && <p className="mt-1 text-sm text-red-500">{errors.project_type}</p>}
            </div>

            <div>
              <label htmlFor="feeEstimate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} />
                  Fee Estimate
                </div>
              </label>
              <input
                type="number"
                id="feeEstimate"
                name="feeEstimate"
                value={formData.feeEstimate}
                onChange={handleChange}
                placeholder="450000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate({ to: '/projects/' })}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={20} />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}