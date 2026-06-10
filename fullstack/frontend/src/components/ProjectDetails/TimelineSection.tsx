// Author: Nevil Bhalodia
// Module: ProjectDetails — Gantt-style Timeline tab (replaces "coming soon" placeholder)
// Commit reference: feat: add Gantt-style Timeline tab to Project Details

// Project Timeline section on the Project Details page.
//
// Renders a Gantt-style horizontal chart spanning the project's
// start_date → due_date range. Each workflow phase becomes a bar
// positioned along that range, with subtask due dates plotted as
// little milestone dots at their actual calendar position.
//
// Design decisions worth knowing:
//
//   1. Phases don't have explicit start/end dates in the data model
//      (yet), so we distribute them evenly across the project's
//      total duration. A 4-phase project = 4 equal-width bars.
//      When phase-level dates get added later, the maths in
//      computePhaseRange below is the only thing that needs to change.
//
//   2. Subtask dots are positioned by their actual due date, not by
//      their parent phase's bar. That means a subtask scheduled
//      outside its phase's window will visibly fall outside the bar —
//      which is intentional. It surfaces planning conflicts the user
//      might want to fix.
//
//   3. The today indicator only renders when the current date falls
//      inside the project window. For past-completed or far-future
//      projects we skip it rather than render an off-canvas marker.

import { Calendar, Circle } from 'lucide-react'
import type { WorkflowPhase } from './types'

interface TimelineSectionProps {
  workflow: WorkflowPhase[]
  startDate: string
  dueDate: string
}

export function TimelineSection({
  workflow,
  startDate,
  dueDate,
}: TimelineSectionProps) {
  // ----- Empty states -----
  // Three valid reasons the timeline can't render yet. Each gets its
  // own message so the user knows exactly what to do next rather than
  // staring at a generic "no data" placeholder.

  if (!startDate || !dueDate) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Project dates not set
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Click "Edit Project" above and set a start date + due date to enable the timeline view.
        </p>
      </div>
    )
  }

  if (workflow.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          No workflow phases yet
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Add phases on the Overview tab — they'll show up here as a Gantt-style chart.
        </p>
      </div>
    )
  }

  // ----- Date maths -----
  // All positioning is expressed as a percentage of the total project
  // duration so the chart scales naturally with container width.

  const start = new Date(startDate)
  const end = new Date(dueDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const totalMs = end.getTime() - start.getTime()

  // Guard against invalid date ranges (due date before start date).
  // The data lets you set them in either order; we just refuse to
  // render rather than blow up on a negative denominator.
  if (totalMs <= 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Invalid date range
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          The due date is before the start date. Edit the project to fix.
        </p>
      </div>
    )
  }

  // Clamp to 0-100 so out-of-range dates don't visually escape the
  // chart container. Out-of-range dots will pin to the appropriate
  // edge instead.
  const dateToPercent = (date: Date) => {
    const ms = date.getTime() - start.getTime()
    return Math.max(0, Math.min(100, (ms / totalMs) * 100))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayInRange = today >= start && today <= end
  const todayPercent = dateToPercent(today)

  // Generate month labels for the X-axis. We iterate one month at a
  // time from start to end. For very long projects this could produce
  // a lot of labels — we'll let CSS truncate / let the user scroll if
  // it gets visually crowded.
  const months: { label: string; percent: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    months.push({
      label: cursor.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      percent: dateToPercent(cursor),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Even distribution — phase i occupies the slice from i/N to (i+1)/N.
  // When phases get their own start/end dates in the data model later,
  // this is the function to replace.
  const phaseSlice = 100 / workflow.length
  const computePhaseRange = (index: number) => ({
    left: index * phaseSlice,
    width: phaseSlice,
  })

  // ----- Render -----

  return (
    <div className="space-y-4">
      {/* Section header with date range + legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} />
            Project Timeline
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {start.toLocaleDateString()} → {end.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Chart canvas */}
      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Top axis — month labels */}
          <div className="relative h-6 mb-3 ml-36">
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap"
                style={{
                  left: `${m.percent}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Bars area — relative so the "Today" line can absolutely
              position itself across all rows. */}
          <div className="relative">
            {/* Today indicator. Offset by ml-36 to skip the phase-name
                column so it lines up with the bars. */}
            {todayInRange && (
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{ left: `calc(9rem + ${todayPercent}% * (1 - 9rem / 100%))` }}
              >
                {/* The left calc above keeps things simple — see helper
                    div below that does the same thing without the calc
                    by living inside the bars container. */}
              </div>
            )}

            {workflow.map((phase, index) => {
              const { left, width } = computePhaseRange(index)

              // Status → bar background + fill colours. The fill is a
              // darker shade applied over the base to visualise progress.
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

              // Subtask dots — only render the ones with an actual
              // dueDate so we don't pile a stack of dots at position 0.
              const subtaskDots = phase.subtasks
                .filter((s) => s.dueDate)
                .map((s) => ({
                  id: s.id,
                  title: s.title,
                  date: new Date(s.dueDate),
                  percent: dateToPercent(new Date(s.dueDate)),
                  status: s.status,
                }))

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  {/* Phase name column on the left */}
                  <div className="w-36 flex-shrink-0 pr-2">
                    <div
                      className="font-medium text-gray-900 dark:text-white text-sm truncate"
                      title={phase.phase}
                    >
                      {phase.phase}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {phase.progress}% · {phase.subtasks.length} subtask
                      {phase.subtasks.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  {/* Timeline track for this row */}
                  <div className="flex-1 relative h-10">
                    {/* Subtle month gridlines as visual reference */}
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
                        style={{ left: `${m.percent}%` }}
                      />
                    ))}

                    {/* Today line — drawn inside each row so it spans
                        the full chart visually without complex absolute
                        positioning across rows. */}
                    {todayInRange && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${todayPercent}%` }}
                      />
                    )}

                    {/* The phase bar itself */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-7 ${barColor} rounded-md shadow-sm overflow-hidden`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      title={`${phase.phase} — ${phase.progress}% complete`}
                    >
                      {/* Progress fill — darker overlay sized by % */}
                      <div
                        className={`h-full ${fillColor} transition-all duration-500`}
                        style={{ width: `${phase.progress}%` }}
                      />

                      {/* Progress label centred in the bar. Hidden when
                          the bar is too narrow to fit the text without
                          looking cramped. */}
                      {width > 8 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow">
                          {phase.progress}%
                        </span>
                      )}
                    </div>

                    {/* Subtask milestone dots. Sit above the bar so
                        they don't get visually swallowed by the progress
                        fill. The hover title gives the user the subtask
                        name + due date. */}
                    {subtaskDots.map((dot) => (
                      <div
                        key={dot.id}
                        className="absolute top-0 -translate-x-1/2 group"
                        style={{ left: `${dot.percent}%` }}
                        title={`${dot.title} — Due ${dot.date.toLocaleDateString()} (${dot.status})`}
                      >
                        <Circle
                          size={12}
                          className={
                            dot.status === 'done'
                              ? 'text-green-500 fill-green-200'
                              : 'text-orange-500 fill-orange-200'
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer legend — only shown if there's at least one subtask
              dot on the chart to explain. */}
          {workflow.some((p) => p.subtasks.some((s) => s.dueDate)) && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Circle
                  size={10}
                  className="text-orange-500 fill-orange-200"
                />
                <span>Subtask milestone (open / in progress)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Circle
                  size={10}
                  className="text-green-500 fill-green-200"
                />
                <span>Subtask milestone (done)</span>
              </div>
              {todayInRange && (
                <div className="flex items-center gap-1.5">
                  <div className="w-0.5 h-3 bg-red-500"></div>
                  <span>Today</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Default export alongside the named export to play nicely with
// TanStack Router's code-splitting (same workaround as the other panels).
export default TimelineSection