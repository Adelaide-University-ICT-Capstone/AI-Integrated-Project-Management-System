import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import { toast } from 'sonner'
import { readUsersWithDetails } from '@/client/adminApi'

export const Route = createFileRoute('/_authenticated/projects/workforce/$projectId')({
  component: WorkforcePage,
})

interface ProjectWorker {
  id: number | string
  name: string
  assignedRole: string
  status?: 'active' | 'completed' | 'available'
}

const AVATAR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#14b8a6', '#6366f1', '#22c55e', '#f43f5e',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function AllocationModal({
  workers,
  employeeOptions,
  onClose,
  onSave,
}: {
  workers: ProjectWorker[]
  employeeOptions: ProjectWorker[]
  onClose: () => void
  onSave: (updated: ProjectWorker[]) => void
}) {
  const [rows, setRows] = useState<ProjectWorker[]>(workers)
  const [employeeId, setEmployeeId] = useState('')
  const [role, setRole] = useState('')

  const availableEmployees = useMemo(
    () => employeeOptions.filter((employee) => !rows.some((row) => String(row.id) === String(employee.id))),
    [employeeOptions, rows],
  )

  const roleOptions = useMemo(
    () => Array.from(new Set(employeeOptions.map((employee) => employee.assignedRole).filter(Boolean))),
    [employeeOptions],
  )

  const handleAdd = () => {
    const selectedEmployee = availableEmployees.find((employee) => String(employee.id) === employeeId)
    if (!selectedEmployee || !role) return

    setRows((prev) => [
      ...prev,
      {
        ...selectedEmployee,
        assignedRole: role,
        status: 'active',
      },
    ])
    setEmployeeId('')
    setRole('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-7 pt-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workforce Allocation</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add or remove team members</p>
        </div>

        <div className="flex gap-2 px-7 pb-4">
          <select
            value={employeeId}
            onChange={(e) => {
              const selectedEmployee = availableEmployees.find(
                (employee) => String(employee.id) === e.target.value,
              )
              setEmployeeId(e.target.value)
              setRole(selectedEmployee?.assignedRole || '')
            }}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Employee</option>
            {availableEmployees.map((employee) => (
              <option key={employee.id} value={String(employee.id)}>
                {employee.name}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Role</option>
            {roleOptions.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleOption}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
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
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-7 py-6 text-sm text-center text-gray-400">
                    No team members assigned yet
                  </td>
                </tr>
              ) : rows.map((worker) => (
                <tr key={worker.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-7 py-3 text-sm text-gray-800 dark:text-gray-200">{worker.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{worker.assignedRole}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setRows((prev) => prev.filter((row) => String(row.id) !== String(worker.id)))}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none"
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(rows)
              onClose()
            }}
            className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkforcePage() {
  const { projectId } = Route.useParams()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employeeOptions, setEmployeeOptions] = useState<ProjectWorker[]>([])
  const [workforce, setWorkforce] = useState<ProjectWorker[]>([])

  useEffect(() => {
    let isMounted = true

    const loadWorkforce = async () => {
      try {
        const users = await readUsersWithDetails()
        if (!isMounted) return

        const mappedWorkers: ProjectWorker[] = users.map((user: any, index: number) => ({
          id: user.id || index + 1,
          name: user.full_name?.trim() || user.email?.split('@')[0] || `User ${index + 1}`,
          assignedRole: user.role_name || 'Team Member',
          status: user.is_active ? 'active' : 'available',
        }))

        setEmployeeOptions(mappedWorkers)
        setWorkforce(mappedWorkers.slice(0, Math.min(2, mappedWorkers.length)))
      } catch (error) {
        if (isMounted) {
          setEmployeeOptions([])
          setWorkforce([])
          toast.error('Failed to load workforce data')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadWorkforce()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <Link
        to="/projects/$projectId"
        params={{ projectId }}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Project
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Users className="text-blue-600" size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workforce Allocation</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{workforce.length} team members assigned</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Member
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading workforce data...</p>
          </div>
        ) : workforce.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No workforce data available yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {workforce.map((worker) => (
              <div key={worker.id} className="flex items-center gap-4 px-6 py-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor(worker.name) }}
                >
                  {worker.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{worker.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{worker.assignedRole}</p>
                </div>
                {worker.status && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    worker.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : worker.status === 'available'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {worker.status}
                  </span>
                )}
                <button
                  onClick={() => setWorkforce((prev) => prev.filter((member) => String(member.id) !== String(worker.id)))}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none ml-2"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AllocationModal
          workers={workforce}
          employeeOptions={employeeOptions}
          onClose={() => setShowModal(false)}
          onSave={(updated) => {
            setWorkforce(updated)
            toast.success('Workforce updated successfully')
          }}
        />
      )}
    </div>
  )
}
