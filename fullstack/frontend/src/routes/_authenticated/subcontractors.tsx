import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  X,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/subcontractors')({
  component: Subcontractors,
})

interface Subcontractor {
  id: string
  name: string
  type: string
  email: string
  phone: string
  location: string
  status: 'active' | 'pending' | 'completed'
  project: string
  service: string
  deadline: string
  aiAlert?: string
}

const initialSubcontractors: Subcontractor[] = [
  {
    id: '1',
    name: 'GeoCon Labs',
    type: 'Soil Testing',
    email: 'contact@geoconlabs.com',
    phone: '+1 (555) 123-4567',
    location: 'Downtown District',
    status: 'pending',
    project: 'Highway Bridge Restoration',
    service: 'Soil bearing capacity test',
    deadline: '2026-04-05',
    aiAlert: 'Deadline approaching - schedule reminder sent',
  },
  {
    id: '2',
    name: 'ABC Surveyors',
    type: 'Land Survey',
    email: 'info@abcsurveyors.com',
    phone: '+1 (555) 234-5678',
    location: 'Metro Area',
    status: 'active',
    project: 'Downtown Office Complex',
    service: 'Topographic survey and boundary marking',
    deadline: '2026-04-10',
  },
  {
    id: '3',
    name: 'Steel Supply Co',
    type: 'Materials Supplier',
    email: 'orders@steelsupply.com',
    phone: '+1 (555) 345-6789',
    location: 'Industrial Zone',
    status: 'active',
    project: 'Downtown Office Complex',
    service: 'Structural steel beams and columns',
    deadline: '2026-04-15',
  },
  {
    id: '4',
    name: 'Foundation Masters',
    type: 'Subcontractor',
    email: 'contact@foundationmasters.com',
    phone: '+1 (555) 456-7890',
    location: 'City Center',
    status: 'completed',
    project: 'Residential Tower Foundation',
    service: 'Foundation excavation and preparation',
    deadline: '2026-03-25',
  },
  {
    id: '5',
    name: 'TimberFrame Pro',
    type: 'Materials Supplier',
    email: 'sales@timberframepro.com',
    phone: '+1 (555) 567-8901',
    location: 'Westside',
    status: 'pending',
    project: 'Residential Tower Foundation',
    service: 'Engineered timber framing materials',
    deadline: '2026-04-02',
    aiAlert: 'Order deadline in 3 days - confirm quantities',
  },
]

const subcontractorTypes = [
  'Soil Testing', 'Land Survey', 'Materials Supplier', 'Subcontractor',
  'Consultant', 'Testing Lab', 'Equipment Rental', 'Concrete Supplier',
  'Electrical', 'Plumbing',
]

function SubcontractorCard({
  subcontractor,
  onEdit,
  onDelete,
  onPrompt,
}: {
  subcontractor: Subcontractor
  onEdit: () => void
  onDelete: () => void
  onPrompt: () => void
}) {
  const statusColors = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }

  const statusIcons = {
    active: <Clock size={14} />,
    pending: <AlertCircle size={14} />,
    completed: <CheckCircle size={14} />,
  }

  const isUrgent =
    subcontractor.status === 'pending' &&
    new Date(subcontractor.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${
      isUrgent ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200 dark:border-gray-700'
    } p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">{subcontractor.name}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subcontractor.type}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColors[subcontractor.status]}`}>
          {statusIcons[subcontractor.status]}
          <span className="capitalize ml-1">{subcontractor.status}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Mail size={14} className="text-gray-400 flex-shrink-0" />
          <a href={`mailto:${subcontractor.email}`} className="hover:text-blue-600 truncate">
            {subcontractor.email}
          </a>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Phone size={14} className="text-gray-400 flex-shrink-0" />
          <span>{subcontractor.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
          <span>{subcontractor.location}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{subcontractor.project}</div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Required</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{subcontractor.service}</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Deadline</span>
          <span className={`font-medium ${isUrgent ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {new Date(subcontractor.deadline).toLocaleDateString()}
          </span>
        </div>
      </div>

      {subcontractor.aiAlert && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-yellow-800 dark:text-yellow-400 mb-1">AI Alert</div>
              <div className="text-xs text-yellow-700 dark:text-yellow-500">{subcontractor.aiAlert}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onPrompt}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send size={14} />
          Send Prompt
        </button>
        <button
          onClick={onEdit}
          className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 border border-gray-300 dark:border-gray-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function SubcontractorModal({
  subcontractor,
  onClose,
  onSave,
}: {
  subcontractor?: Subcontractor
  onClose: () => void
  onSave: (data: Partial<Subcontractor>) => void
}) {
  const [formData, setFormData] = useState({
    name: subcontractor?.name || '',
    type: subcontractor?.type || 'Soil Testing',
    email: subcontractor?.email || '',
    phone: subcontractor?.phone || '',
    location: subcontractor?.location || '',
    project: subcontractor?.project || 'Downtown Office Complex',
    service: subcontractor?.service || '',
    deadline: subcontractor?.deadline || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.deadline) {
      toast.error('Please fill in required fields')
      return
    }
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {subcontractor ? 'Edit Subcontractor' : 'Add New Subcontractor'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {subcontractorTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="contact@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="City or region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline *</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project</label>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Required</label>
              <textarea
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Describe the service or work required"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              {subcontractor ? 'Update' : 'Add'} Subcontractor
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

function Subcontractors() {
  const [subcontractors, setSubcontractors] = useState(initialSubcontractors)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | undefined>()

  const handleAdd = () => { setEditingSubcontractor(undefined); setShowModal(true) }
  const handleEdit = (s: Subcontractor) => { setEditingSubcontractor(s); setShowModal(true) }
  const handleDelete = (id: string) => {
    setSubcontractors(subcontractors.filter((s) => s.id !== id))
    toast.success('Subcontractor removed')
  }
  const handleSave = (data: Partial<Subcontractor>) => {
    if (editingSubcontractor) {
      setSubcontractors(subcontractors.map((s) => s.id === editingSubcontractor.id ? { ...s, ...data } : s))
      toast.success('Subcontractor updated')
    } else {
      setSubcontractors([...subcontractors, { ...data as Subcontractor, id: Date.now().toString(), status: 'pending' }])
      toast.success('Subcontractor added')
    }
  }
  const handlePrompt = (s: Subcontractor) => toast.success(`AI prompt sent to ${s.name}`)

  const filtered = subcontractors.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: subcontractors.length,
    active: subcontractors.filter((s) => s.status === 'active').length,
    pending: subcontractors.filter((s) => s.status === 'pending').length,
    completed: subcontractors.filter((s) => s.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subcontractor Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and coordinate third-party engagements</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Subcontractor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white', border: 'border-gray-200 dark:border-gray-700' },
          { label: 'Active', value: stats.active, color: 'text-blue-600', border: 'border-blue-200 dark:border-blue-800' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600', border: 'border-yellow-200 dark:border-yellow-800' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600', border: 'border-green-200 dark:border-green-800' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white dark:bg-gray-800 rounded-lg border ${stat.border} p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Automation */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Send className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI-Powered Coordination</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automated tracking and intelligent prompting</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: '5', label: 'Auto-reminders sent this week', color: 'text-purple-600' },
            { value: '2', label: 'Urgent deadlines detected', color: 'text-blue-600' },
            { value: '98%', label: 'On-time completion rate', color: 'text-green-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subcontractors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <SubcontractorCard
            key={s.id}
            subcontractor={s}
            onEdit={() => handleEdit(s)}
            onDelete={() => handleDelete(s.id)}
            onPrompt={() => handlePrompt(s)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subcontractors found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}

      {showModal && (
        <SubcontractorModal
          subcontractor={editingSubcontractor}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}