import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  FolderKanban,
  CheckSquare,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Minus,
} from 'lucide-react'
import { projectsApi } from '@/api/project'
import { useTheme } from '@/components/theme-provider'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
})

function formatCurrency(value: string | number | null | undefined): string {
  const num = parseFloat(String(value ?? '0'))
  if (isNaN(num)) return '$0'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(num)
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous)
  if (pct === null) return <span className="text-xs text-gray-400">—</span>
  const up = pct >= 0
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${up ? 'text-emerald-500' : 'text-red-400'}`}>
      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {up ? '+' : ''}{pct}% vs last month
    </span>
  )
}

function AnalyticsPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const labelColor = isDark ? '#9ca3af' : '#6b7280'

  const { data: activeData } = useQuery({
    queryKey: ['activeCount'],
    queryFn: projectsApi.getCurrentProjectCount,
  })

  const { data: completedData } = useQuery({
    queryKey: ['completedCount'],
    queryFn: projectsApi.getCompletedProjectCount,
  })

  const { data: invoiceData } = useQuery({
    queryKey: ['invoiceBill'],
    queryFn: projectsApi.getInvoiceBill,
  })

  const { data: overdueData } = useQuery({
    queryKey: ['overdueProjects'],
    queryFn: projectsApi.getOverdueProjects,
  })

  const { data: allProjectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAllProjects,
  })

  const tabCounts = useMemo(() => {
    const projects = allProjectsData?.data ?? []
    const counts = { in_progress: 0, to_be_invoiced: 0, completed: 0, other: 0 }
    for (const p of projects) {
      const tab = (p as any).project_tab as string | undefined
      if (tab === 'in_progress') counts.in_progress++
      else if (tab === 'to_be_invoiced') counts.to_be_invoiced++
      else if (tab === 'completed') counts.completed++
      else counts.other++
    }
    return counts
  }, [allProjectsData])

  const completionBuckets = useMemo(() => {
    const projects = allProjectsData?.data ?? []
    const buckets = { '0–25%': 0, '26–50%': 0, '51–75%': 0, '76–99%': 0, '100%': 0 }
    for (const p of projects) {
      const pct = Number((p as any).completion_percent ?? 0)
      if (pct <= 25) buckets['0–25%']++
      else if (pct <= 50) buckets['26–50%']++
      else if (pct <= 75) buckets['51–75%']++
      else if (pct < 100) buckets['76–99%']++
      else buckets['100%']++
    }
    return buckets
  }, [allProjectsData])

  const currentActive = activeData?.current_month ?? 0
  const previousActive = activeData?.previous_month ?? 0
  const currentCompleted = completedData?.current_month ?? 0
  const previousCompleted = completedData?.previous_month ?? 0
  const currentInvoice = parseFloat(invoiceData?.current_month_total ?? '0')
  const previousInvoice = parseFloat(invoiceData?.previous_month_total ?? '0')
  const overdueCount = overdueData?.count ?? 0

  const barChartData = {
    labels: ['This Month', 'Last Month'],
    datasets: [
      {
        label: 'Active Projects',
        data: [currentActive, previousActive],
        backgroundColor: isDark ? 'rgba(59,130,246,0.8)' : 'rgba(59,130,246,0.9)',
        borderRadius: 6,
      },
      {
        label: 'Completed Projects',
        data: [currentCompleted, previousCompleted],
        backgroundColor: isDark ? 'rgba(16,185,129,0.8)' : 'rgba(16,185,129,0.9)',
        borderRadius: 6,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: labelColor, boxRadius: 4, padding: 16 },
      },
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: labelColor } },
      y: { grid: { color: gridColor }, ticks: { color: labelColor }, beginAtZero: true },
    },
  }

  const doughnutData = {
    labels: ['In Progress', 'To Be Invoiced', 'Completed'],
    datasets: [{
      data: [tabCounts.in_progress, tabCounts.to_be_invoiced, tabCounts.completed],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
      borderColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 3,
    }],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: labelColor, boxRadius: 4, padding: 16 },
      },
    },
  }

  const completionBarData = {
    labels: Object.keys(completionBuckets),
    datasets: [{
      label: 'Projects',
      data: Object.values(completionBuckets),
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
      borderRadius: 6,
    }],
  }

  const completionBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: labelColor } },
      y: {
        grid: { color: gridColor },
        ticks: { color: labelColor, stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Project performance and business metrics overview</p>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{currentActive}</p>
              <div className="mt-2">
                <TrendBadge current={currentActive} previous={previousActive} />
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderKanban className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">prev. month: {previousActive}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed This Month</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{currentCompleted}</p>
              <div className="mt-2">
                <TrendBadge current={currentCompleted} previous={previousCompleted} />
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">prev. month: {previousCompleted}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invoiced This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(currentInvoice)}</p>
              <div className="mt-2">
                <TrendBadge current={currentInvoice} previous={previousInvoice} />
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">prev. month: {formatCurrency(previousInvoice)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Projects</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{overdueCount}</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
                <Minus size={14} /> no comparison
              </div>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">total active overdue</p>
        </div>
      </div>

      {/* ── Charts Row 1 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Monthly Activity Bar */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Monthly Activity</h2>
          <div className="h-56">
            <Bar key={`bar-${resolvedTheme}`} data={barChartData} options={barOptions} />
          </div>
        </div>

        {/* Project Tab Doughnut */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Project Pipeline</h2>
          <div className="h-56">
            <Doughnut key={`donut-${resolvedTheme}`} data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Completion Distribution Bar */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Completion Distribution</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Projects grouped by completion percentage</p>
          <div className="h-48">
            <Bar key={`comp-${resolvedTheme}`} data={completionBarData} options={completionBarOptions} />
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Pipeline Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'In Progress', count: tabCounts.in_progress, color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
              { label: 'To Be Invoiced', count: tabCounts.to_be_invoiced, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
              { label: 'Completed', count: tabCounts.completed, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
            ].map(({ label, count, color, text }) => {
              const total = tabCounts.in_progress + tabCounts.to_be_invoiced + tabCounts.completed || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    <span className={`text-sm font-semibold ${text}`}>{count} <span className="text-xs text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Projects</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{allProjectsData?.count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Overdue Projects List ─────────────────────────────────────────────── */}
      {overdueData?.data && overdueData.data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 px-5 pt-5 pb-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Clock className="text-red-600 dark:text-red-400" size={16} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Overdue Projects</h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
              {overdueData.data.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {overdueData.data.map((project: any) => {
              const daysLate = project.due_date
                ? Math.max(0, Math.floor((Date.now() - new Date(project.due_date).getTime()) / 86400000))
                : 0
              return (
                <div key={project.project_id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                    {project.job_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.project_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.client_name}</p>
                  </div>
                  {project.status && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded flex-shrink-0">
                      {project.status}
                    </span>
                  )}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString('en-AU') : '—'}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400">{daysLate}d overdue</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
