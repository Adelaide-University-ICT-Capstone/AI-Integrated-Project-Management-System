// Author: Nevil Bhalodia
// Module: ProjectDetails — Gantt-style Timeline tab (replaces "coming soon" placeholder)
// Commit reference: feat: add Gantt-style Timeline tab to Project Details

// Authors: Yongli Jiang[TimelineSection,workflow dueDate,progress,task-management mapping]
import { Calendar } from 'lucide-react'
import type { WorkflowPhase } from './types'

interface TimelineSectionProps {
  workflow: WorkflowPhase[]
  startDate: string
  dueDate: string
}

export function TimelineSection({ workflow, startDate, dueDate }: TimelineSectionProps) {
  if (workflow.length === 0) {
    return <TimelineEmpty title="No workflow phases yet" message="Add phases on the Overview tab to build the timeline." />
  }

  const parseDate = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    date.setHours(0, 0, 0, 0)
    return date
  }

  const addDays = (date: Date, days: number) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
  }

  const workflowDueDates = workflow.map((phase) => parseDate(phase.dueDate)).filter((date): date is Date => Boolean(date))
  const projectStart = parseDate(startDate)
  const projectDue = parseDate(dueDate)
  const earliestWorkflowDue = workflowDueDates.length
    ? new Date(Math.min(...workflowDueDates.map((date) => date.getTime())))
    : null
  const latestWorkflowDue = workflowDueDates.length
    ? new Date(Math.max(...workflowDueDates.map((date) => date.getTime())))
    : null

  const start = projectStart || (earliestWorkflowDue ? addDays(earliestWorkflowDue, -Math.max(workflow.length, 1)) : null)
  const end = latestWorkflowDue && projectDue
    ? new Date(Math.max(latestWorkflowDue.getTime(), projectDue.getTime()))
    : latestWorkflowDue || projectDue

  if (!start || !end) {
    return (
      <TimelineEmpty
        title="Timeline dates not set"
        message="Set project dates or workflow due dates to enable the timeline view."
      />
    )
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const totalMs = end.getTime() - start.getTime()
  if (totalMs <= 0) {
    return <TimelineEmpty title="Invalid date range" message="The due date is before the start date." />
  }

  const dateToPercent = (date: Date) => {
    const ms = date.getTime() - start.getTime()
    return Math.max(0, Math.min(100, (ms / totalMs) * 100))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayInRange = today >= start && today <= end
  const todayPercent = dateToPercent(today)

  const months: { label: string; percent: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    months.push({
      label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      percent: dateToPercent(cursor),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  // const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)))
  // let previousPhaseEnd = start
  const timelineRows = workflow.map((phase) => {
    const phaseDueDate = parseDate(phase.dueDate)
    const phaseStart = start
    const fallbackEnd = end
    const candidateEnd = phaseDueDate || fallbackEnd
    const phaseEnd = candidateEnd > phaseStart ? candidateEnd : addDays(phaseStart, 1)

    const boundedEnd = phaseEnd > end ? end : phaseEnd
    const left = dateToPercent(phaseStart)
    const right = dateToPercent(boundedEnd)

    return {
      phase,
      phaseDueDate,
      left,
      width: Math.max(2, right - left),
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} />
            Project Timeline
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {start.toLocaleDateString()} - {end.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <LegendSwatch className="bg-gray-300 dark:bg-gray-600" label="Pending" />
          <LegendSwatch className="bg-blue-500" label="In Progress" />
          <LegendSwatch className="bg-green-500" label="Completed" />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="relative h-6 mb-3 ml-36">
            {months.map((month) => (
              <div
                key={`${month.label}-${month.percent}`}
                className="absolute text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap"
                style={{ left: `${month.percent}%`, transform: 'translateX(-50%)' }}
              >
                {month.label}
              </div>
            ))}
          </div>

          <div className="relative">
            {timelineRows.map(({ phase, phaseDueDate, left, width }) => {
              const barColor =
                phase.status === 'completed'
                  ? 'bg-green-300 dark:bg-green-900/40'
                  : phase.status === 'in-progress'
                    ? 'bg-blue-300 dark:bg-blue-900/40'
                    : 'bg-gray-300 dark:bg-gray-600'
              const fillColor =
                phase.status === 'completed'
                  ? 'bg-green-600'
                  : phase.status === 'in-progress'
                    ? 'bg-blue-600'
                    : 'bg-gray-500'

              return (
                <div
                  key={phase.id}
                  className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="w-36 flex-shrink-0 pr-2">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate" title={phase.phase}>
                      {phase.phase}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {phase.progress}% - {phase.doneTasks}/{phase.totalTasks} tasks
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Due {phaseDueDate ? phaseDueDate.toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
                  <div className="flex-1 relative h-10">
                    {months.map((month) => (
                      <div
                        key={`${phase.id}-${month.label}`}
                        className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
                        style={{ left: `${month.percent}%` }}
                      />
                    ))}
                    {todayInRange && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${todayPercent}%` }}
                        title="Today"
                      />
                    )}
                    <div className={`absolute top-2 h-6 rounded ${barColor}`} style={{ left: `${left}%`, width: `${width}%` }}>
                      <div className={`h-full rounded ${fillColor}`} style={{ width: `${phase.progress}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineEmpty({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
      <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
      <p className="text-gray-600 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
    </div>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded ${className}`} />
      <span>{label}</span>
    </div>
  )
}

export default TimelineSection
