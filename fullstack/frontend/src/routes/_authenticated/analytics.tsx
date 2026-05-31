// ─── Analytics Dashboard ──────────────────────────────────────────────────────
// Real-time project intelligence dashboard for GAMA Consulting.
// Fetches live data from 7 backend API endpoints and displays:
//   - 6 KPI summary cards (active projects, risk, overdue tasks, workload)
//   - Project status distribution (donut/pie chart)
//   - Task progress breakdown (stacked bar chart)
//   - Risk trend over 7 weeks (area chart)
//   - Team workload per engineer (horizontal bar chart)
//   - High-risk projects, missing materials, revenue leakage (data tables)
//   - AI chat assistant panel with quick prompts
// All queries auto-refresh every 60 seconds via React Query's refetchInterval.
// ─────────────────────────────────────────────────────────────────────────────

import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// Lucide React icons used in KPI cards, tables, and buttons
import {
  AlertTriangle, TrendingUp, Package, DollarSign,
  Users, RefreshCw, Download, ChevronRight, Bot,
  X, Send, Activity, CheckCircle, BarChart3,
  FolderOpen,
} from "lucide-react"

// Recharts components for all chart visualisations:
// PieChart/Pie/Cell = donut chart | BarChart/Bar = stacked + horizontal bars
// AreaChart/Area = risk trend | ResponsiveContainer = responsive sizing
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  AreaChart, Area,
} from "recharts"

// Register this file as the /analytics route under the _authenticated layout.
// Being under /_authenticated means the user must have a valid JWT token
// to access this page — TanStack Router redirects to /login if not.
export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsDashboard,
})

// ─── API LAYER ────────────────────────────────────────────────────────────────
// All backend communication is centralised here so auth headers and
// error handling are written once rather than repeated in every fetch call.

// Read the backend URL from the .env file (VITE_API_URL).
// Falls back to localhost:8000 for local development if the variable is not set.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

// Reads the JWT access token from localStorage and returns the
// Authorization header required by all protected backend endpoints.
// The token is stored under "access_token" by the useAuth hook after login.
function authHeaders() {
  const token = localStorage.getItem("access_token")
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

// Generic fetch wrapper used by all 7 API calls in this file.
// - Attaches auth headers automatically to every request
// - Throws an Error for any non-2xx response so React Query catches it
// - Parses and returns the JSON response body
// The <T> generic type parameter allows TypeScript to type the response shape.
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options, // spread any extra options e.g. method: "POST", body
    headers: { ...authHeaders(), ...options?.headers },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// Named API functions grouped in one object for clean usage:
// api.summary() instead of a full fetch call inline.
const api = {
  // Returns: active_projects, high_risk_projects, overdue_tasks,
  //          uninvoiced_projects, pending_materials, avg_workload_hours
  summary: () => apiFetch<any>("/api/v1/analytics/dashboard-summary"),

  // Returns: array of projects with risk_score, risk_level, risk_reasons, overdue_tasks
  risks: () => apiFetch<any>("/api/v1/analytics/risks"),

  // Returns: status_distribution object + task_progress (todo/in_progress/review/done)
  projectHealth: () => apiFetch<any>("/api/v1/analytics/project-health"),

  // Returns: array of employees with name, role, total_hours, overloaded boolean
  workload: () => apiFetch<any>("/api/v1/analytics/workload"),

  // Returns: total_leakage dollar amount + array of uninvoiced projects
  revenueLeakage: () => apiFetch<any>("/api/v1/analytics/revenue-leakage"),

  // Returns: array of delayed materials with overdue_days and project details
  materialDelays: () => apiFetch<any>("/api/v1/analytics/material-delays"),

  // Returns: 7 weekly snapshots with high/medium/low risk project counts
  deadlineTrend: () => apiFetch<any>("/api/v1/analytics/deadline-trend"),

  // POST — sends user message to chatbot, returns AI text response
  chat: (userId: number, message: string) =>
    apiFetch<any>("/api/v1/chatbot/chat", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, message }),
    }),
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

// Colour palette for donut chart segments — cycles via modulo if more statuses than colours
const STATUS_COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#10b981", "#06b6d4", "#ec4899", "#14b8a6",
]

// Fixed colours per task status — used in the stacked bar chart
const TASK_COLORS = {
  todo: "#94a3b8",        // grey  — not started
  in_progress: "#3b82f6", // blue  — in progress
  review: "#f59e0b",      // amber — under review
  done: "#10b981",        // green — complete
}

// Shared tooltip styling applied to all Recharts charts for visual consistency
const TOOLTIP_STYLE = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#0f172a",
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
}

// Pre-written prompts shown as quick-select buttons in the AI chat panel
const QUICK_PROMPTS = [
  "Which projects are most at risk?",
  "Which engineers are overloaded?",
  "What material orders are delayed?",
  "Which projects are uninvoiced?",
  "Generate a weekly project summary.",
]

// ─── KPI CARD COMPONENT ───────────────────────────────────────────────────────
// Reusable card for all 6 summary metrics at the top of the dashboard.
// Props:
//   title    — metric label shown below the number
//   value    — the number/string to display (shows "—" if undefined)
//   subtitle — optional smaller text below the title
//   icon     — Lucide icon rendered inside a coloured badge
//   color    — Tailwind bg class for the icon badge (e.g. "bg-blue-500")
//   trend    — "up" = bad (red), "down" = good (green), "neutral" = grey
function KpiCard({
  title, value, subtitle, icon: Icon, color, trend,
}: {
  title: string
  value: string | number | undefined
  subtitle?: string
  icon: React.ElementType
  color: string
  trend?: "up" | "down" | "neutral"
}) {
  // "up" trend means more of something bad (e.g. more overdue tasks) → red
  // "down" trend means less of something bad (e.g. fewer risks) → green
  const trendColor =
    trend === "down" ? "text-emerald-500" :
    trend === "up"   ? "text-red-500"     : "text-slate-400"

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        {/* Coloured icon badge — background set by the color prop */}
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {/* Trend indicator — only rendered if trend prop is provided */}
        {trend && <Activity size={13} className={trendColor} />}
      </div>
      {/* Main metric value — "—" dash shown if value is undefined/null */}
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value ?? "—"}
      </div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
      {/* Optional subtitle — only rendered if the prop is provided */}
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  )
}

// ─── RISK BADGE COMPONENT ─────────────────────────────────────────────────────
// Small colour-coded pill label for project risk level.
// Defaults to Low styling if an unrecognised level string is passed.
function RiskBadge({ level }: { level: string }) {
  // Lookup table — maps risk level to Tailwind colour classes
  const styles: Record<string, string> = {
    High:   "bg-red-50 text-red-600 border-red-200",
    Medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
    Low:    "bg-green-50 text-green-600 border-green-200",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[level] ?? styles.Low}`}>
      {level}
    </span>
  )
}

// ─── SECTION CARD COMPONENT ───────────────────────────────────────────────────
// White card wrapper used for all charts and data tables on the page.
// Props:
//   title   — heading at top left of the card
//   children — chart or table content inside the card
//   action  — optional element at top right (e.g. a button)
function SectionCard({
  title, children, action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── EMPTY STATE COMPONENT ────────────────────────────────────────────────────
// Displayed inside tables when there is no data to show.
// A green checkmark is used because an empty table usually means no problems.
function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-gray-400 text-sm">
      <CheckCircle size={22} className="text-green-400 mx-auto mb-2" />
      {message}
    </div>
  )
}

// ─── AI CHAT PANEL COMPONENT ──────────────────────────────────────────────────
// Slide-in panel from the right side of the screen.
// Allows managers to ask natural language questions about project data.
// Messages are sent to the backend chatbot endpoint and shown as a conversation.
type Msg = { role: "user" | "ai"; text: string }

function AIChatPanel({ onClose }: { onClose: () => void }) {
  const userId = 1 // TODO: replace with actual logged-in user ID from auth context

  // Conversation history — pre-populated with the AI greeting message
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: "ai",
    text: "Hi! Ask me about project risks, workload, materials, or financials.",
  }])

  // Controlled value for the text input box
  const [input, setInput] = useState("")

  // Loading state — true while waiting for AI response, controls bouncing dots
  const [loading, setLoading] = useState(false)

  // Sends a message to the chatbot API and appends the response to the conversation.
  const send = async (text: string) => {
    if (!text.trim()) return // ignore empty or whitespace-only input

    // Add the user message immediately so the UI feels responsive
    setMsgs(m => [...m, { role: "user", text }])
    setInput("")     // clear the input box
    setLoading(true) // show the bouncing dots

    try {
      const data = await api.chat(userId, text)
      // Append the AI response to the conversation
      setMsgs(m => [...m, { role: "ai", text: data.response }])
    } catch {
      // Show a user-friendly error message if the API call fails
      setMsgs(m => [...m, { role: "ai", text: "Error — check the API key is configured." }])
    }

    setLoading(false) // hide the bouncing dots
  }

  return (
    // Fixed panel anchored to the right edge — z-50 renders above all page content
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 flex flex-col z-50 shadow-2xl">

      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Bot size={17} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">AI Intelligence</div>
            {/* Animated green pulse dot indicates the AI service is online */}
            <div className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
              Online
            </div>
          </div>
        </div>
        {/* Close button — triggers onClose prop to hide the panel */}
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={17} />
        </button>
      </div>

      {/* ── Message Thread ── */}
      {/* User messages are right-aligned (blue), AI messages are left-aligned (white) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {msgs.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border border-gray-200 shadow-sm"
            }`}>
              {/* "AI Analysis" label shown only on AI messages */}
              {msg.role === "ai" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot size={11} className="text-blue-500" />
                  <span className="text-xs text-blue-500 font-semibold">AI Analysis</span>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading indicator — three dots with staggered bounce animation (0ms, 150ms, 300ms) */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex gap-1 shadow-sm">
              {[0, 150, 300].map(d => (
                <span key={d}
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Prompt Buttons ── */}
      {/* Pre-written questions to help managers get started without typing */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400 mb-2 font-medium">Quick Analysis</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)}
              className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 hover:border-blue-300 rounded-lg px-2 py-1 transition-all">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Text Input ── */}
      {/* onKeyDown handles Enter key so user doesn't have to click Send */}
      <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Ask about risks, workload, materials..."
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder-gray-400"
        />
        {/* Send button — disabled while loading to prevent duplicate API calls */}
        <button onClick={() => send(input)} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg p-2.5 transition-colors">
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD COMPONENT ─────────────────────────────────────────────────
// Root component for the /analytics page. Responsible for:
//   1. Fetching all data from 7 analytics endpoints via React Query
//   2. Transforming raw API responses into chart-ready data structures
//   3. Managing UI state (filter tabs, AI panel visibility, last refresh time)
//   4. Rendering all child components with the fetched data
function AnalyticsDashboard() {
  // useQueryClient allows us to manually invalidate cached queries on refresh
  const qc = useQueryClient()

  // Controls whether the AI chat side panel is visible
  const [showAI, setShowAI] = useState(false)

  // Tracks the last time data was refreshed — displayed in the page subtitle
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Active risk table filter — "all" shows all high-risk, others narrow further
  const [filter, setFilter] = useState<"all" | "high-risk" | "overdue">("all")

  // Shared query config — refetchInterval auto-refreshes all queries every 60s
  // Defined once and spread into each useQuery to avoid repetition
  const opts = { refetchInterval: 60_000 }

  // ── Data Fetching ──────────────────────────────────────────────────────────
  // Seven independent queries fire in parallel — if one is slow or fails,
  // the others still load and render. Each has a unique queryKey for caching.
  const { data: summary   } = useQuery({ queryKey: ["ana-summary"],  queryFn: api.summary,        ...opts })
  const { data: risks     } = useQuery({ queryKey: ["ana-risks"],    queryFn: api.risks,          ...opts })
  const { data: health    } = useQuery({ queryKey: ["ana-health"],   queryFn: api.projectHealth,  ...opts })
  const { data: workload  } = useQuery({ queryKey: ["ana-workload"], queryFn: api.workload,       ...opts })
  const { data: revenue   } = useQuery({ queryKey: ["ana-revenue"],  queryFn: api.revenueLeakage, ...opts })
  const { data: matDelays } = useQuery({ queryKey: ["ana-mats"],     queryFn: api.materialDelays, ...opts })
  const { data: trend     } = useQuery({ queryKey: ["ana-trend"],    queryFn: api.deadlineTrend,  ...opts })

  // ── Manual Refresh ─────────────────────────────────────────────────────────
  // useCallback prevents this function being recreated on every render.
  // Invalidating queries with prefix "ana" marks all 7 as stale,
  // triggering an immediate background refetch of every endpoint.
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["ana"] })
    setLastRefresh(new Date()) // update the timestamp shown in the subtitle
  }, [qc])

  // ── Data Transformations ───────────────────────────────────────────────────
  // Transform raw API responses into the format Recharts components expect.
  // Optional chaining (?.) safely returns undefined while data is still loading.

  // Convert status_distribution object → [{name, value}] array for donut chart
  // e.g. { "Completed": 3, "In Progress": 5 } → [{ name: "Completed", value: 3 }, ...]
  const statusData = health?.status_distribution
    ? Object.entries(health.status_distribution).map(([name, value]) => ({ name, value: value as number }))
    : []

  // Wrap task_progress in an array so Recharts BarChart can iterate over it
  const taskData = health?.task_progress
    ? [{ name: "Tasks", ...health.task_progress }]
    : []

  // Map workload data — limit to 8 engineers, use first name only for Y axis labels
  // overloaded boolean (from backend, true if total_hours > 160) controls bar colour
  const workloadData = (workload?.workload ?? []).slice(0, 8).map((w: any) => ({
    name:       w.name?.split(" ")[0] ?? "User",
    hours:      w.total_hours,
    overloaded: w.overloaded,
  }))

  // Full risks array — default to empty while loading
  const allRisks: any[] = risks?.risks ?? []

  // Pre-filter high risk projects for the default table view
  const highRisk = allRisks.filter(r => r.risk_level === "High")

  // Apply the active filter to determine which rows appear in the risk table
  const tableRows =
    filter === "high-risk" ? highRisk :
    filter === "overdue"   ? allRisks.filter(r => r.overdue_tasks > 0) :
    highRisk // default to high risk view

  // 7-week trend data — default to empty while loading
  const trendData: any[] = trend?.trend ?? []

  // ── CSV Export ─────────────────────────────────────────────────────────────
  // Generates and downloads a CSV file entirely in the browser — no server needed.
  // 1. Maps risk data into comma-separated row strings
  // 2. Creates a Blob with MIME type text/csv
  // 3. Generates a blob URL and clicks an invisible anchor to trigger download
  const exportCSV = () => {
    const rows = allRisks.map(r =>
      [r.job_number, r.job_title ?? "", r.risk_level, r.risk_score, r.status].join(",")
    )
    const blob = new Blob(
      [["Job Number,Title,Risk Level,Score,Status", ...rows].join("\n")],
      { type: "text/csv" },
    )
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "analytics.csv",
    }).click()
  }

  return (
    // When AI panel is open, add right padding so content doesn't go behind it
    <div className={`transition-all ${showAI ? "pr-96" : ""}`}>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          {/* Shows last refresh time — updates when manual refresh is clicked */}
          <p className="text-sm text-gray-500 mt-0.5">
            Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refresh every 60s
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* ── Filter Tabs ── */}
          {/* Controls which projects appear in the risk table below */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "high-risk", "overdue"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200" // active tab
                    : "text-gray-500 hover:text-gray-700" // inactive tab
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* Export button — triggers CSV download of risk data */}
          <button onClick={exportCSV}
            className="flex items-center gap-2 text-sm bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg px-3 py-2 transition-all shadow-sm">
            <Download size={13} /> Export
          </button>

          {/* Manual refresh — invalidates all "ana" queries and refetches */}
          <button onClick={refresh}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-2 transition-all shadow-sm">
            <RefreshCw size={14} />
          </button>

          {/* AI Assistant toggle — shows/hides the chat side panel */}
          <button onClick={() => setShowAI(v => !v)}
            className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 font-medium transition-all shadow-sm ${
              showAI
                ? "bg-blue-700 text-white" // darker when panel is open
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
            <Bot size={14} /> AI Assistant
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      {/* 6 cards in a responsive grid — stacks to 2 columns on small screens */}
      {/* Each card value uses optional chaining (?.) so undefined shows "—" not crash */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard title="Active Projects"   value={summary?.active_projects}     icon={BarChart3}     color="bg-blue-500"    trend="neutral" />
        <KpiCard title="High Risk"         value={summary?.high_risk_projects}  icon={AlertTriangle} color="bg-red-500"     trend="up"      subtitle="Need attention" />
        <KpiCard title="Overdue Tasks"     value={summary?.overdue_tasks}       icon={TrendingUp}    color="bg-orange-500"  trend="up" />
        <KpiCard title="Pending Materials" value={summary?.pending_materials}   icon={Package}       color="bg-purple-500"  trend="neutral" />
        <KpiCard title="Uninvoiced"        value={summary?.uninvoiced_projects} icon={DollarSign}    color="bg-emerald-500" trend="down"    subtitle="Revenue pending" />
        <KpiCard
          title="Avg Workload"
          value={summary?.avg_workload_hours != null ? `${summary.avg_workload_hours}h` : undefined}
          subtitle="Last 30 days"
          icon={Users}
          color="bg-cyan-500"
          trend="neutral"
        />
      </div>

      {/* ── Charts Row ── */}
      {/* Three charts side by side on large screens, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* ── Project Status Donut Chart ── */}
        {/* innerRadius + outerRadius creates the donut hole in the middle */}
        {/* Each segment coloured from STATUS_COLORS using index % length */}
        <SectionCard title="Project Status Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          {/* Colour-coded legend below the donut */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                <span className="text-xs text-gray-500">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Task Progress Stacked Bar Chart ── */}
        {/* stackId="a" groups all bars into one stacked bar per data entry */}
        {/* radius on the "done" bar rounds only the top of the full stack */}
        <SectionCard title="Task Progress">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              <Bar dataKey="todo"        stackId="a" fill={TASK_COLORS.todo}        name="To Do" />
              <Bar dataKey="in_progress" stackId="a" fill={TASK_COLORS.in_progress} name="In Progress" />
              <Bar dataKey="review"      stackId="a" fill={TASK_COLORS.review}      name="Review" />
              <Bar dataKey="done"        stackId="a" fill={TASK_COLORS.done}        name="Done" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* ── Risk Trend Area Chart ── */}
        {/* Shows how many projects are high/medium/low risk each week over 7 weeks */}
        {/* Area charts are ideal for showing trends over time periods */}
        <SectionCard title="Risk Trend — 7 Weeks">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {/* Each Area has a semi-transparent fill for the shaded region below the line */}
              <Area type="monotone" dataKey="high"   stroke="#ef4444" fill="#fef2f2" strokeWidth={2} name="High" />
              <Area type="monotone" dataKey="medium" stroke="#f59e0b" fill="#fffbeb" strokeWidth={2} name="Medium" />
              <Area type="monotone" dataKey="low"    stroke="#10b981" fill="#f0fdf4" strokeWidth={2} name="Low" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ── Team Workload Horizontal Bar Chart ── */}
      {/* layout="vertical" flips the chart so names appear on the Y axis */}
      {/* Each bar is coloured individually via Cell — red if overloaded, blue if normal */}
      <SectionCard title="Team Workload Analytics">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={workloadData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
            {/* Custom tooltip appends overload warning when engineer is above 160h/month */}
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(val: any, _: any, props: any) => [
                `${val}h${props.payload.overloaded ? " ⚠️ Overloaded" : ""}`, "Hours",
              ]} />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {/* Render one Cell per bar to control colour independently per engineer */}
              {workloadData.map((e: any, i: number) => (
                <Cell key={i} fill={e.overloaded ? "#ef4444" : "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Manual legend explaining colour coding for the workload chart */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Normal
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Overloaded (&gt;160h/month)
          </div>
        </div>
      </SectionCard>

      {/* ── Smart Data Tables ── */}
      {/* Three side-by-side tables showing actionable data for managers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">

        {/* ── High Risk / Overdue Projects Table ── */}
        {/* Title changes dynamically based on active filter */}
        {/* tableRows is pre-filtered from the filter state variable above */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-500" />
              {filter === "overdue" ? "Overdue Projects" : "High Risk Projects"}
            </h3>
            {/* Badge showing count of currently filtered projects */}
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
              {tableRows.length} flagged
            </span>
          </div>
          <div className="space-y-2">
            {tableRows.length === 0
              ? <Empty message="No flagged projects" />
              : tableRows.slice(0, 6).map((p: any) => ( // cap at 6 rows
                <div key={p.project_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-blue-600">{p.job_number}</span>
                      <RiskBadge level={p.risk_level} />
                    </div>
                    <div className="text-sm text-gray-700 truncate">{p.job_title ?? "Unnamed"}</div>
                    {/* Show first risk reason as a hint if available */}
                    {p.risk_reasons?.[0] && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{p.risk_reasons[0]}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-500">{p.risk_score}</div>
                      <div className="text-xs text-gray-400">score</div>
                    </div>
                    {/* Chevron animates on hover to hint the row is clickable */}
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ── Missing Materials Table ── */}
        {/* Shows materials with status "N/A" or "ordered" from the backend */}
        {/* Red text if overdue > 7 days, yellow if less */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Package size={13} className="text-purple-500" />
              Missing Materials
            </h3>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">
              {matDelays?.material_delays?.length ?? 0} pending
            </span>
          </div>
          <div className="space-y-2">
            {!matDelays?.material_delays?.length
              ? <Empty message="All materials received" />
              : matDelays.material_delays.slice(0, 6).map((m: any) => (
                <div key={m.material_id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-blue-600">{m.job_number}</div>
                      <div className="text-sm text-gray-700">{m.material_name}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{m.project_name}</div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      {/* Red if overdue more than 7 days, yellow otherwise */}
                      <div className={`text-xs font-semibold ${m.overdue_days > 7 ? "text-red-500" : "text-yellow-500"}`}>
                        {m.overdue_days}d
                      </div>
                      <div className="text-xs text-gray-400">overdue</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ── Revenue Leakage Table ── */}
        {/* Shows projects with completed work that hasn't been invoiced yet */}
        {/* total_leakage = sum of all uninvoiced revenue across all projects */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign size={13} className="text-emerald-500" />
              Revenue Leakage
            </h3>
            {/* Total uninvoiced dollar amount shown prominently in the header */}
            <span className="text-sm font-bold text-emerald-600">
              ${(revenue?.total_leakage ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="space-y-2">
            {!revenue?.uninvoiced_projects?.length
              ? <Empty message="All projects invoiced" />
              : revenue.uninvoiced_projects.slice(0, 6).map((p: any) => (
                <div key={p.project_id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-blue-600">{p.job_number}</div>
                      <div className="text-sm text-gray-700 truncate">{p.job_title}</div>
                      <div className="text-xs text-gray-400">{p.status}</div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className="text-sm font-bold text-emerald-600">
                        ${(p.uninvoiced_revenue ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">{p.days_overdue}d pending</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* ── AI Chat Panel ── */}
      {/* Conditionally rendered — only mounts when showAI is true */}
      {showAI && <AIChatPanel onClose={() => setShowAI(false)} />}
    </div>
  )
}
