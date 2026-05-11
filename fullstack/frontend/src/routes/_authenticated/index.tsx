import { createFileRoute, Link } from '@tanstack/react-router'
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Building,
} from 'lucide-react'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

import { useState } from 'react'
import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "../../api/project"



ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

const projectData = [
  { month: 'Jan', completed: 4, inProgress: 8 },
  { month: 'Feb', completed: 6, inProgress: 7 },
  { month: 'Mar', completed: 8, inProgress: 9 },
  { month: 'Apr', completed: 5, inProgress: 12 },
  { month: 'May', completed: 9, inProgress: 10 },
  { month: 'Jun', completed: 7, inProgress: 11 },
]

const taskStatusData = [
  { name: 'Completed', value: 45, color: '#10b981' },
  { name: 'In Progress', value: 32, color: '#3b82f6' },
  { name: 'Pending', value: 18, color: '#f59e0b' },
  { name: 'Overdue', value: 5, color: '#ef4444' },
]

/* const _recentProjects = [
  {
    id: '1',
    name: 'Downtown Office Complex',
    type: 'Commercial',
    progress: 65,
    dueDate: '2026-05-15',
    client: 'Metro Development Corp',
  },
  {
    id: '2',
    name: 'Highway Bridge Restoration',
    type: 'Infrastructure',
    progress: 42,
    dueDate: '2026-06-30',
    client: 'State Transportation Dept',
  },
  {
    id: '3',
    name: 'Residential Tower Foundation',
    type: 'Residential',
    progress: 15,
    dueDate: '2026-07-20',
    client: 'Skyline Properties',
  },
] */

const aiAlerts = [
  {
    id: 1,
    severity: 'high',
    message: 'Soil testing deadline approaching for Highway Bridge project',
    project: 'Highway Bridge Restoration',
    action: 'Schedule with GeoCon Labs',
  },
  {
    id: 2,
    severity: 'medium',
    message: 'Milestone 3 completed but not invoiced - Downtown Office Complex',
    project: 'Downtown Office Complex',
    action: 'Generate invoice',
  },
  {
    id: 3,
    severity: 'medium',
    message: 'Timber framing order deadline in 3 days',
    project: 'Residential Tower Foundation',
    action: 'Contact supplier',
  },
]

const recentTasks = [
  { id: 1, title: 'Structural analysis review', project: 'Downtown Office Complex', due: '2026-04-02', assignee: 'Sarah Chen' },
  { id: 2, title: 'Foundation inspection', project: 'Residential Tower Foundation', due: '2026-04-03', assignee: 'Mike Rodriguez' },
  { id: 3, title: 'Submit permit application', project: 'Highway Bridge Restoration', due: '2026-04-05', assignee: 'Harri Rassias' },
]

function Dashboard() {
  const [showCompanyStats, setShowCompanyStats] = useState(false)
  // active projects number
  const { data: activeData } = useQuery({
    queryKey: ['activeCount'],
    queryFn: projectsApi.getCurrentProjectCount,
  });

  // all projects number
  const { data: projectsData, } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAllProjects,
  });
  console.log("Projects Data from API:", projectsData);
  
  // completed projects number
  const { data: completedCountData } = useQuery({
    queryKey: ['completedCount'],
    queryFn: projectsApi.getCompletedProjectCount,
  });
  
  // risk projects number
  const { data: delayedData } = useQuery({
    queryKey: ['delayedProjects'],
    queryFn: projectsApi.getDelayedProjects,
  });

  //revenue


  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your project overview.</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Project
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeData?.current_month ?? 0}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp size={16} /> +2 this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FolderKanban className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{projectsData?.count ?? 0}</p> 
              <p className="text-sm text-gray-500 mt-2">{completedCountData?.count ?? 0} completed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckSquare className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">At Risk Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{delayedData?.length ?? 0}</p>
              <p className="text-sm text-red-600 mt-2">Requires attention</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue (YTD)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$2.4M</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp size={16} /> +18% vs last year
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>
      </div>
      
{/* Company Overall Statistics Dropdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowCompanyStats(!showCompanyStats)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Building className="text-indigo-600" size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Company Overall Statistics</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click to view company-wide metrics</p>
            </div>
          </div>
          {showCompanyStats ? (
            <ChevronUp className="text-gray-400" size={24} />
          ) : (
            <ChevronDown className="text-gray-400" size={24} />
          )}
        </button>

        {showCompanyStats && (
          <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-5 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Company Projects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">47</p>
                  <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                    <TrendingUp size={16} /> +8 this quarter
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <FolderKanban className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-5 border border-red-100 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">At-Risk Projects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">12</p>
                  <p className="text-sm text-red-600 mt-2">Across all teams</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border border-green-100 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Team Utilization</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">87%</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp size={16} /> +5% vs last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* AI Alerts */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Risk Alerts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Proactive monitoring detected {aiAlerts.length} items requiring attention
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {aiAlerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{alert.project}</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">{alert.message}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Suggested: {alert.action}</p>
                </div>
                <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
                  Take Action
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project Progress Overview</h2>
          <Bar
            data={{
              labels: projectData.map((d) => d.month),
              datasets: [
                { label: 'Completed', data: projectData.map((d) => d.completed), backgroundColor: '#10b981' },
                { label: 'In Progress', data: projectData.map((d) => d.inProgress), backgroundColor: '#3b82f6' },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Task Status Distribution</h2>
          <div className="flex justify-center">
            <div style={{ width: '300px', height: '300px' }}>
              <Pie
                data={{
                  labels: taskStatusData.map((d) => d.name),
                  datasets: [{
                    data: taskStatusData.map((d) => d.value),
                    backgroundColor: taskStatusData.map((d) => d.color),
                  }],
                }}
                options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Projects</h2>
            <Link to="/projects/" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {projectsData?.data?.slice(0, 3).map((project: any) => (
              <div key={project.project_id} className="..."> 
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={16} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{project.project_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.client_name}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {project.status.toUpperCase()}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock size={14} /> 
                        Due {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {project.progress ?? 0}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{task.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{task.project}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(task.due).toLocaleDateString()}
                  </span>
                  <span className="text-blue-600 flex items-center gap-1">
                    <Users size={12} /> {task.assignee}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}