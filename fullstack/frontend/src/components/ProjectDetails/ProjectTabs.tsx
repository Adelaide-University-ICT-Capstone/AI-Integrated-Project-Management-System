import type { ReactNode } from 'react'
import type { ProjectTab } from './types'

const tabs: { id: ProjectTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'resources', label: 'Resources' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'workforce', label: 'Workforce' },
]

interface ProjectTabsProps {
  activeTab: ProjectTab
  onTabChange: (tab: ProjectTab) => void
  children: ReactNode
}

export function ProjectTabs({ activeTab, onTabChange, children }: ProjectTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
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
      <div className="p-6">{children}</div>
    </div>
  )
}

export default ProjectTabs
