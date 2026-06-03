import type { ProjectStatusType } from '@/api/project'
import { ArrowLeft, Building2, Calendar, Clock, DollarSign, Edit2, Loader2, MapPin, Trash2, User } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Project } from './types'
import { getProgressCircleColor } from './utils'

interface ProjectHeaderProps {
  project: Project
  overallProgress: number
  projectStatusOptions: ProjectStatusType[]
  selectStatusValue: string
  isUpdatingStatus: boolean
  onBack: () => void
  onDelete?: () => void
  onEdit: () => void
  onUpdateStatus: (statusId: string) => void
}

export function ProjectHeader({
  project,
  overallProgress,
  projectStatusOptions,
  selectStatusValue,
  isUpdatingStatus,
  onBack,
  onDelete,
  onEdit,
  onUpdateStatus,
}: ProjectHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>
        <div className="flex items-center gap-2">
          {onDelete && (
            <>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <Edit2 size={16} />
              Edit Project
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Delete Project
            </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{project.job_number}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{project.project_name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProjectMeta icon={<Building2 size={18} />} text={project.company_name} />
              <ProjectMeta icon={<User size={18} />} text={`Client: ${project.client_name || 'N/A'}`} />
              <ProjectMeta icon={<MapPin size={18} />} text={project.company_address} />
              <ProjectMeta icon={<DollarSign size={18} />} text={`Fee Estimate: ${project.fee_estimate || 'N/A'}`} />
              <ProjectMeta icon={<Calendar size={18} />} text={`Start: ${project.start_date}`} />
              <ProjectMeta icon={<Clock size={18} />} text={`Delivery: ${project.due_date}`} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Status:</span>
              <div className="relative">
                <select
                  value={selectStatusValue}
                  onChange={(event) => onUpdateStatus(event.target.value)}
                  disabled={isUpdatingStatus || projectStatusOptions.length === 0}
                  className="px-3 py-1.5 pr-8 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {projectStatusOptions.length === 0 ? (
                    <option value="">No statuses available</option>
                  ) : (
                    projectStatusOptions.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.status_name}
                      </option>
                    ))
                  )}
                </select>
                {isUpdatingStatus ? (
                  <Loader2 size={14} className="absolute right-2 top-2 animate-spin text-gray-500 dark:text-gray-300" />
                ) : null}
              </div>
            </div>
          </div>

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
                  className={`${getProgressCircleColor(overallProgress)} transition-all duration-500`}
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
    </>
  )
}

function ProjectMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  )
}

export default ProjectHeader
