import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Edit2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/people')({
  component: People,
})

interface Person {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department?: string
  company?: string
  status: 'active' | 'inactive'
}

const initialStaff: Person[] = [
  { id: '1', name: 'Harri Rassias', email: 'harri@gamaconsulting.com', phone: '+1 (555) 100-0001', role: 'Structural Engineer', department: 'Engineering', status: 'active' },
  { id: '2', name: 'Sarah Chen', email: 'sarah.chen@gamaconsulting.com', phone: '+1 (555) 100-0002', role: 'Project Manager', department: 'Management', status: 'active' },
  { id: '3', name: 'Mike Rodriguez', email: 'mike.r@gamaconsulting.com', phone: '+1 (555) 100-0003', role: 'Drafter', department: 'Design', status: 'active' },
  { id: '4', name: 'Emily Watson', email: 'emily.w@gamaconsulting.com', phone: '+1 (555) 100-0004', role: 'MEP Engineer', department: 'Engineering', status: 'active' },
  { id: '5', name: 'David Kim', email: 'david.kim@gamaconsulting.com', phone: '+1 (555) 100-0005', role: 'Safety Officer', department: 'Operations', status: 'active' },
]

const initialClients: Person[] = [
  { id: '1', name: 'Metro Development Corp', email: 'contact@metrodev.com', phone: '+1 (555) 200-0001', role: 'Primary Client', company: 'Metro Development Corp', status: 'active' },
  { id: '2', name: 'State Transportation Dept', email: 'info@statetransport.gov', phone: '+1 (555) 200-0002', role: 'Government Client', company: 'State Government', status: 'active' },
  { id: '3', name: 'Skyline Properties', email: 'contact@skylineproperties.com', phone: '+1 (555) 200-0003', role: 'Primary Client', company: 'Skyline Properties Ltd', status: 'active' },
  { id: '4', name: 'GreenHaven Properties', email: 'info@greenhaven.com', phone: '+1 (555) 200-0004', role: 'Primary Client', company: 'GreenHaven Properties', status: 'active' },
]

function People() {
  const [activeTab, setActiveTab] = useState<'staff' | 'clients'>('staff')
  const [staff, setStaff] = useState(initialStaff)
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState('')

  const currentList = activeTab === 'staff' ? staff : clients
  const setCurrentList = activeTab === 'staff' ? setStaff : setClients

  const filtered = currentList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this person?')) {
      setCurrentList(currentList.filter((p) => p.id !== id))
      toast.success('Removed successfully')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">People</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage staff members and clients
          </p>
        </div>
        <button
          onClick={() => toast.info('Add person form coming soon')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add {activeTab === 'staff' ? 'Staff Member' : 'Client'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{staff.length}</p>
              <p className="text-sm text-green-600 mt-2">{staff.filter(s => s.status === 'active').length} active</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{clients.length}</p>
              <p className="text-sm text-green-600 mt-2">{clients.filter(c => c.status === 'active').length} active</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'staff'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Staff Members ({staff.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Clients ({clients.length})
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {activeTab === 'staff' ? 'Department' : 'Company'}
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">{person.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{person.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {activeTab === 'staff' ? person.department : person.company}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Mail size={12} />
                        <a href={`mailto:${person.email}`} className="hover:text-blue-600">{person.email}</a>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Phone size={12} />
                        <span>{person.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      person.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toast.info('Edit coming soon')}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No {activeTab} found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}