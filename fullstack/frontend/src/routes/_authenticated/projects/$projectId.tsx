import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Package,
  Wrench,
  Circle,
  Trash2,
  Edit2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
const baseUrl = import.meta.env.VITE_API_URL;
import { projectsApi } from "../../../api/project";
import { useQuery } from '@tanstack/react-query';


export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetails,
})



/* const _PROJECT_STATUSES = [
  'Proposal',
  'Prelim',
  'Design & Doc',
  'Amendment',
  'Hold',
  'To Be Invoiced',
  'Completed & Invoiced',
  'Eng/QA Review',
  'Construction',
] */

/* const projectsData = {
  '1': {
    job_number: 'PRJ-2024-001',
    project_name: 'High-Rise Commercial Tower',
    status: 'Design & Doc',
    progress: 65,
    company_name: 'Metropolis Development Corp',
    company_address: 'Downtown District, Metro City',
    start_date: 'Jan 15, 2024',
    due_date: 'Dec 20, 2024',
    aiInsight: {
      type: 'warning',
      title: 'Potential Delay Risk Detected',
      description: 'Foundation phase running 5% behind schedule. Recommend adding 2 additional structural engineers to critical path tasks.',
      confidence: 87,
    },
    workflow: [
      { phase: 'Planning', status: 'completed', progress: 100, color: 'green' },
      { phase: 'Foundation', status: 'completed', progress: 100, color: 'green' },
      { phase: 'Structural', status: 'in-progress', progress: 65, color: 'blue' },
      { phase: 'MEP', status: 'pending', progress: 0, color: 'gray' },
      { phase: 'Finishing', status: 'pending', progress: 0, color: 'gray' },
    ],
    materials: [
      { name: 'Steel Beams', status: 'delivered', quantity: '450 tons' },
      { name: 'Concrete Mix', status: 'in-transit', quantity: '2,500 m³' },
      { name: 'Reinforcement Bars', status: 'ordered', quantity: '180 tons' },
    ],
    workforce: [
      { name: 'Harri Rassias', role: 'Structural Engineer', avatar: 'HR', status: 'active', color: 'bg-blue-500' },
      { name: 'Sarah Chen', role: 'Project Manager', avatar: 'SC', status: 'active', color: 'bg-purple-500' },
      { name: 'Michael Torres', role: 'Site Supervisor', avatar: 'MT', status: 'active', color: 'bg-green-500' },
      { name: 'Emily Watson', role: 'MEP Engineer', avatar: 'EW', status: 'available', color: 'bg-orange-500' },
      { name: 'David Kim', role: 'Safety Officer', avatar: 'DK', status: 'active', color: 'bg-teal-500' },
    ],
  },
  '2': {
    job_number: 'PRJ-2024-002',
    project_name: 'Residential Complex Phase 2',
    status: 'At Risk',
    progress: 42,
    company_name: 'GreenHaven Properties',
    company_address: 'Westside, Metro City',
    start_date: 'Feb 1, 2024',
    due_date: 'Nov 30, 2024',
    aiInsight: {
      type: 'critical',
      title: 'Critical Deadline Risk',
      description: 'Structural phase significantly delayed. Immediate action required: approve overtime and expedite material delivery.',
      confidence: 94,
    },
    workflow: [
      { phase: 'Planning', status: 'completed', progress: 100, color: 'green' },
      { phase: 'Foundation', status: 'in-progress', progress: 42, color: 'blue' },
      { phase: 'Structural', status: 'pending', progress: 0, color: 'gray' },
      { phase: 'MEP', status: 'pending', progress: 0, color: 'gray' },
      { phase: 'Finishing', status: 'pending', progress: 0, color: 'gray' },
    ],
    materials: [
      { name: 'Steel Beams', status: 'ordered', quantity: '280 tons' },
      { name: 'Concrete Mix', status: 'delivered', quantity: '1,800 m³' },
      { name: 'Reinforcement Bars', status: 'in-transit', quantity: '120 tons' },
    ],
    workforce: [
      { name: 'Harri Rassias', role: 'Structural Engineer', avatar: 'HR', status: 'active', color: 'bg-blue-500' },
      { name: 'James Liu', role: 'Project Manager', avatar: 'JL', status: 'active', color: 'bg-purple-500' },
      { name: 'Anna Rodriguez', role: 'Site Supervisor', avatar: 'AR', status: 'active', color: 'bg-green-500' },
    ],
  },
  '3': {
    id: 'PRJ-2024-003',
    name: 'Bridge Renovation Project',
    status: 'Completed & Invoiced',
    progress: 100,
    company_name: 'City Infrastructure Department',
    company_address: 'River District',
    start_date: 'Nov 1, 2023',
    due_date: 'Mar 15, 2024',
    aiInsight: {
      type: 'success',
      title: 'Project Successfully Completed',
      description: 'All phases completed on time and within budget. Excellent team performance throughout the project lifecycle.',
      confidence: 100,
    },
    workflow: [
      { phase: 'Planning', status: 'completed', progress: 100, color: 'green' },
      { phase: 'Foundation', status: 'completed', progress: 100, color: 'green' },
      { phase: 'Structural', status: 'completed', progress: 100, color: 'green' },
      { phase: 'MEP', status: 'completed', progress: 100, color: 'green' },
      { phase: 'Finishing', status: 'completed', progress: 100, color: 'green' },
    ],
    materials: [
      { name: 'Steel Beams', status: 'delivered', quantity: '180 tons' },
      { name: 'Concrete Mix', status: 'delivered', quantity: '900 m³' },
      { name: 'Reinforcement Bars', status: 'delivered', quantity: '75 tons' },
    ],
    workforce: [
      { name: 'Harri Rassias', role: 'Structural Engineer', avatar: 'HR', status: 'completed', color: 'bg-blue-500' },
      { name: 'Robert Johnson', role: 'Project Manager', avatar: 'RJ', status: 'completed', color: 'bg-purple-500' },
    ],
  },
  '4': {
  id: 'PRJ-2024-004',
  name: 'Shopping Mall Expansion',
  status: 'Proposal',
  progress: 0,
  client: 'Retail Ventures Inc',
  location: 'North Plaza',
  startDate: 'Mar 20, 2024',
  deliveryDate: 'Dec 15, 2024',
  aiInsight: {
    type: 'warning',
    title: 'Project Not Yet Started',
    description: 'This project is awaiting kickoff. Ensure all preliminary documents are in order before starting.',
    confidence: 90,
  },
  workflow: [
    { phase: 'Planning', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Foundation', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Structural', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'MEP', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Finishing', status: 'pending', progress: 0, color: 'gray' },
  ],
  materials: [
    { name: 'Steel Beams', status: 'ordered', quantity: '320 tons' },
    { name: 'Concrete Mix', status: 'ordered', quantity: '2,100 m³' },
    { name: 'Reinforcement Bars', status: 'ordered', quantity: '140 tons' },
  ],
  workforce: [
    { name: 'Emily Watson', role: 'Project Manager', avatar: 'EW', status: 'available', color: 'bg-orange-500' },
    { name: 'David Kim', role: 'Site Supervisor', avatar: 'DK', status: 'available', color: 'bg-teal-500' },
  ],
},
'5': {
  id: 'PRJ-2024-005',
  name: 'University Science Building',
  status: 'Proposal',
  progress: 0,
  client: 'State University',
  location: 'University Campus',
  startDate: 'Mar 15, 2024',
  deliveryDate: 'Jan 20, 2025',
  aiInsight: {
    type: 'warning',
    title: 'Project Not Yet Started',
    description: 'Awaiting final approval from university board. Recommend following up within 48 hours.',
    confidence: 85,
  },
  workflow: [
    { phase: 'Planning', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Foundation', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Structural', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'MEP', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Finishing', status: 'pending', progress: 0, color: 'gray' },
  ],
  materials: [
    { name: 'Steel Beams', status: 'ordered', quantity: '410 tons' },
    { name: 'Concrete Mix', status: 'ordered', quantity: '2,800 m³' },
    { name: 'Reinforcement Bars', status: 'ordered', quantity: '200 tons' },
  ],
  workforce: [
    { name: 'Michael Torres', role: 'Project Manager', avatar: 'MT', status: 'available', color: 'bg-green-500' },
    { name: 'Sarah Chen', role: 'Structural Engineer', avatar: 'SC', status: 'available', color: 'bg-purple-500' },
  ],
},
'6': {
  id: 'PRJ-2023-012',
  name: 'Parking Structure Downtown',
  status: 'Completed & Invoiced',
  progress: 100,
  client: 'City Development Authority',
  location: 'Central Business District',
  startDate: 'Sep 10, 2023',
  deliveryDate: 'Apr 5, 2024',
  aiInsight: {
    type: 'success',
    title: 'Project Successfully Completed',
    description: 'All phases completed on time and within budget.',
    confidence: 100,
  },
  workflow: [
    { phase: 'Planning', status: 'completed', progress: 100, color: 'green' },
    { phase: 'Foundation', status: 'completed', progress: 100, color: 'green' },
    { phase: 'Structural', status: 'completed', progress: 100, color: 'green' },
    { phase: 'MEP', status: 'completed', progress: 100, color: 'green' },
    { phase: 'Finishing', status: 'completed', progress: 100, color: 'green' },
  ],
  materials: [
    { name: 'Steel Beams', status: 'delivered', quantity: '220 tons' },
    { name: 'Concrete Mix', status: 'delivered', quantity: '1,500 m³' },
    { name: 'Reinforcement Bars', status: 'delivered', quantity: '95 tons' },
  ],
  workforce: [
    { name: 'Anna Rodriguez', role: 'Project Manager', avatar: 'AR', status: 'completed', color: 'bg-green-500' },
    { name: 'Harri Rassias', role: 'Structural Engineer', avatar: 'HR', status: 'completed', color: 'bg-blue-500' },
  ],
},
} */

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



const taskProjectFields = {
  progress: 80,
  aiInsight: {
    type: 'warning',
    title: 'Potential Delay Risk Detected',
    description: 'Foundation phase running 5% behind schedule. Recommend adding 2 additional structural engineers to critical path tasks.',
    confidence: 87,
  },
  workflow: [
    { phase: 'Planning', status: 'completed', progress: 100, color: 'green' },
    { phase: 'Foundation', status: 'completed', progress: 100, color: 'green' },
    { phase: 'Structural', status: 'in-progress', progress: 65, color: 'blue' },
    { phase: 'MEP', status: 'pending', progress: 0, color: 'gray' },
    { phase: 'Finishing', status: 'pending', progress: 0, color: 'gray' },
  ],
  materials: [
    { name: 'Steel Beams', status: 'delivered', quantity: '450 tons' },
    { name: 'Concrete Mix', status: 'in-transit', quantity: '2,500 m³' },
    { name: 'Reinforcement Bars', status: 'ordered', quantity: '180 tons' },
  ],
  workforce: [
    { name: 'Harri Rassias', role: 'Structural Engineer', avatar: 'HR', status: 'active', color: 'bg-blue-500' },
    { name: 'Sarah Chen', role: 'Project Manager', avatar: 'SC', status: 'active', color: 'bg-purple-500' },
    { name: 'Michael Torres', role: 'Site Supervisor', avatar: 'MT', status: 'active', color: 'bg-green-500' },
    { name: 'Emily Watson', role: 'MEP Engineer', avatar: 'EW', status: 'available', color: 'bg-orange-500' },
    { name: 'David Kim', role: 'Safety Officer', avatar: 'DK', status: 'active', color: 'bg-teal-500' },
  ],
}


/* const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'on track': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'at risk': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
} */

const getMaterialStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'text-green-600 dark:text-green-400'
    case 'in-transit': return 'text-blue-600 dark:text-blue-400'
    case 'ordered': return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getWorkforceStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'available': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }
}

function ProjectDetails() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'timeline'>('overview')
  const [projectStatus, setProjectStatus] = useState('Proposal')
  // const project = projectsData[projectId as keyof typeof projectsData]
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)


  const { data: statusData } = useQuery({
    queryKey: ['statuses'],
    queryFn: projectsApi.getProjectStatuses,
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        const result = await response.json()

        if (!response.ok) {
          toast.error(result.detail || 'Failed to fetch project')
          return
        }

        console.log('Fetched project data:', result)
        setProjectStatus(result.status);

        setProject(result);
      } catch (error) {
        console.error('Error fetching project data:', error)
        toast.error('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h2>
        <button
          onClick={() => navigate({ to: '/projects/' })}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Projects
        </button>
      </div>
    )
  }



  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      

      setProject(null);
      try {
        fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
          method: 'DELETE',
        });
        toast.success('Project deleted successfully');
        navigate({ to: '/projects/' });
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Network error');

      }

      
    }
  }

  const handleUpdateProjectStatus = async (newStatus: string) => {  
    try {
      const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.detail || 'Failed to update project status');
        return;
      }

      toast.success('Project status updated successfully');
      setProjectStatus(newStatus);
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Network error');
    }
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/projects/' })}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>
      <div className="flex items-center gap-2">
  <button
    onClick={() => toast.info('Edit project coming soon!')}
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

      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{project.job_number}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{project.project_name}</h1>
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

           {/* Status Dropdown */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Status:</span>
              <select
                value={projectStatus}
                onChange={(e) => {
                  handleUpdateProjectStatus(e.target.value);
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {statusData?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Start Project Button
            {(project.status === 'Proposal' || project.status === 'Prelim') && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                  This project hasn't been started yet. Click below when you're ready to begin.
                </p>
                <button
                  onClick={() => {
                    setProjectStatus('Design & Doc')
                    toast.success('Project started! Status updated to Design & Doc')
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🚀 Start Project
                </button>
              </div>
            )} */}
          </div>

          {/* Progress Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                <circle
                  cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - taskProjectFields.progress / 100)}`}
                  className={`${
                    taskProjectFields.progress >= 80 ? 'text-green-600' :
                    taskProjectFields.progress >= 50 ? 'text-blue-600' : 'text-yellow-600'
                  } transition-all duration-500`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{taskProjectFields.progress}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className={`rounded-xl shadow-sm p-6 border-l-4 ${
        taskProjectFields.aiInsight.type === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-500' :
        taskProjectFields.aiInsight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500' :
        'bg-green-50 dark:bg-green-900/10 border-green-500'
      }`}>
        <div className="flex items-start gap-4">
          {taskProjectFields.aiInsight.type === 'success' ? (
            <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
          ) : (
            <AlertTriangle className={`flex-shrink-0 ${
              taskProjectFields.aiInsight.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`} size={24} />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">AI System Insight</h3>
              <span className="text-xs text-gray-500">{taskProjectFields.aiInsight.confidence}% confidence</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{taskProjectFields.aiInsight.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{taskProjectFields.aiInsight.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8 px-6">
            {[
              { job_number: 'overview', label: 'Overview' },
              { job_number: 'resources', label: 'Resources' },
              { job_number: 'timeline', label: 'Timeline' },
            ].map((tab) => (
              <button
                key={tab.job_number}
                onClick={() => setActiveTab(tab.job_number as any)}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.job_number
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Workflow */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} /> Task Workflow Progress
                </h3>
                <div className="space-y-4">
                  {taskProjectFields.workflow.map((phase, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            phase.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                            phase.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {phase.status === 'completed' ? (
                              <CheckCircle2 size={16} className="text-green-600" />
                            ) : phase.status === 'in-progress' ? (
                              <Clock size={16} className="text-blue-600" />
                            ) : (
                              <Circle size={16} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{phase.phase}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{phase.progress}%</span>
                      </div>
                      <div className="ml-11">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              phase.color === 'green' ? 'bg-green-600' :
                              phase.color === 'blue' ? 'bg-blue-600' : 'bg-gray-400'
                            }`}
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package size={20} /> Materials Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {taskProjectFields.materials.map((material, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Package size={20} className="text-gray-400" />
                        <span className={`text-xs font-semibold capitalize ${getMaterialStatusColor(material.status)}`}>
                          {material.status.replace('-', ' ')}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{material.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{material.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workforce */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={20} /> Workforce Allocation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskProjectFields.workforce.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className={`w-12 h-12 ${member.color} rounded-full flex items-center justify-center text-white font-bold`}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">{member.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{member.role}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getWorkforceStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Wrench size={48} className="mx-auto mb-4 opacity-50" />
              <p>Resources management coming soon...</p>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>Timeline view coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}