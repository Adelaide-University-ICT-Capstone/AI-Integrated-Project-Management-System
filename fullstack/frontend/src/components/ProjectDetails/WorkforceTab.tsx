import { Users, Plus, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import type { Role } from '@/api/taskManagement'

type WorkforceMember = {
  userId: string | null
  name: string
  role: string
  roleId: string | null
  avatar: string
  status: string
  color: string
}

type DirectoryWorker = {
  userId: string
  name: string
  defaultRoleName: string
  defaultRoleId: string | null
  status: string
}

export function WorkforceTab({
  workforce,
  directoryWorkers,
  roles,
  workforceSaving,
  removingWorkerId,
  onRemoveWorker,
  onPersistWorkforce,
}: {
  workforce: WorkforceMember[]
  directoryWorkers: DirectoryWorker[]
  roles: Role[]
  workforceSaving: boolean
  removingWorkerId: string | null
  onRemoveWorker: (member: WorkforceMember) => Promise<void>
  onPersistWorkforce: (rows: WorkforceMember[]) => Promise<void>
}) {
  const [showAllocationModal, setShowAllocationModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} /> Workforce Allocation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{workforce.length} team member{workforce.length !== 1 ? 's' : ''} assigned</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllocationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={workforceSaving}
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
        {workforce.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No workforce data available yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {workforce.map((member, index) => (
              <div key={index} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-10 h-10 ${member.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.role}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : member.status === 'available' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {member.status}
                </span>
                <button
                  type="button"
                  onClick={() => void onRemoveWorker(member)}
                  disabled={workforceSaving || removingWorkerId === member.userId || !member.userId}
                  title={!member.userId ? 'Cannot remove — user record not found' : 'Remove member'}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                >
                  {removingWorkerId === member.userId
                    ? <Loader2 size={14} className="animate-spin" />
                    : <X size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allocation modal */}
      {showAllocationModal && (
        <AllocationModal
          workers={workforce}
          employeeOptions={directoryWorkers}
          roles={roles}
          saving={workforceSaving}
          onClose={() => setShowAllocationModal(false)}
          onSave={async (rows) => {
            try {
              await onPersistWorkforce(rows)
            } catch (err) {
              toast.error('Failed to save workforce changes')
            }
          }}
        />
      )}
    </div>
  )
}

/* Internal allocation modal used by the tab */
function AllocationModal({
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
  onSave: (rows: WorkforceMember[]) => Promise<void>
}) {
  const [rows, setRows] = useState<WorkforceMember[]>(workers)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')

  const assignedUserIds = new Set(rows.map((r) => r.userId).filter(Boolean))
  const availableEmployees = employeeOptions.filter((e) => !assignedUserIds.has(e.userId))

  const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-pink-500',
    'bg-indigo-500',
  ]

  const formatRoleLabel = (roleName?: string | null) => {
    if (!roleName) return 'Team Member'
    return roleName
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  }

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
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

export default WorkforceTab