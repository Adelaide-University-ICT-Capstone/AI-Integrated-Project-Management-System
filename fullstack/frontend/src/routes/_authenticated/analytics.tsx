import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle, TrendingUp, Package, DollarSign,
  Users, RefreshCw, Download, ChevronRight, Bot,
  X, Send, Activity, CheckCircle, BarChart3,
  FolderOpen,
} from "lucide-react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  AreaChart, Area,
} from "recharts"

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsDashboard,
})

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

function authHeaders() {
  const token = localStorage.getItem("access_token")
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

const api = {
  summary:        () => apiFetch<any>("/api/v1/analytics/dashboard-summary"),
  risks:          () => apiFetch<any>("/api/v1/analytics/risks"),
  projectHealth:  () => apiFetch<any>("/api/v1/analytics/project-health"),
  workload:       () => apiFetch<any>("/api/v1/analytics/workload"),
  revenueLeakage: () => apiFetch<any>("/api/v1/analytics/revenue-leakage"),
  materialDelays: () => apiFetch<any>("/api/v1/analytics/material-delays"),
  deadlineTrend:  () => apiFetch<any>("/api/v1/analytics/deadline-trend"),
  chat: (userId: number, message: string) =>
    apiFetch<any>("/api/v1/chatbot/chat", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, message }),
    }),
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#10b981", "#06b6d4", "#ec4899", "#14b8a6",
]
const TASK_COLORS = {
  todo: "#94a3b8", in_progress: "#3b82f6", review: "#f59e0b", done: "#10b981",
}
const TOOLTIP_STYLE = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#0f172a",
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
}
const QUICK_PROMPTS = [
  "Which projects are most at risk?",
  "Which engineers are overloaded?",
  "What material orders are delayed?",
  "Which projects are uninvoiced?",
  "Generate a weekly project summary.",
]

// ─── KPI Card ─────────────────────────────────────────────────────────────────
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
  const trendColor =
    trend === "down" ? "text-emerald-500" :
    trend === "up"   ? "text-red-500"     : "text-slate-400"

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend && <Activity size={13} className={trendColor} />}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value ?? "—"}
      </div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  )
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
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

// ─── Section Card ─────────────────────────────────────────────────────────────
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

// ─── Empty ────────────────────────────────────────────────────────────────────
function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-gray-400 text-sm">
      <CheckCircle size={22} className="text-green-400 mx-auto mb-2" />
      {message}
    </div>
  )
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────
type Msg = { role: "user" | "ai"; text: string }

function AIChatPanel({ onClose }: { onClose: () => void }) {
  const userId = 1
  const [msgs, setMsgs]       = useState<Msg[]>([{
    role: "ai",
    text: "Hi! Ask me about project risks, workload, materials, or financials.",
  }])
  const [input, setInput]     = useState("")
  const [loading, setLoading] = useState(false)

  const send = async (text: string) => {
    if (!text.trim()) return
    setMsgs(m => [...m, { role: "user", text }])
    setInput("")
    setLoading(true)
    try {
      const data = await api.chat(userId, text)
      setMsgs(m => [...m, { role: "ai", text: data.response }])
    } catch {
      setMsgs(m => [...m, { role: "ai", text: "Error — check the API key is configured." }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Bot size={17} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">AI Intelligence</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
              Online
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={17} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {msgs.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 border border-gray-200 shadow-sm"
            }`}>
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

      {/* Quick prompts */}
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

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Ask about risks, workload, materials..."
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder-gray-400"
        />
        <button onClick={() => send(input)} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg p-2.5 transition-colors">
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function AnalyticsDashboard() {
  const qc = useQueryClient()
  const [showAI, setShowAI]           = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [filter, setFilter]           = useState<"all" | "high-risk" | "overdue">("all")

  const opts = { refetchInterval: 60_000 }

  const { data: summary   } = useQuery({ queryKey: ["ana-summary"],  queryFn: api.summary,        ...opts })
  const { data: risks     } = useQuery({ queryKey: ["ana-risks"],    queryFn: api.risks,          ...opts })
  const { data: health    } = useQuery({ queryKey: ["ana-health"],   queryFn: api.projectHealth,  ...opts })
  const { data: workload  } = useQuery({ queryKey: ["ana-workload"], queryFn: api.workload,       ...opts })
  const { data: revenue   } = useQuery({ queryKey: ["ana-revenue"],  queryFn: api.revenueLeakage, ...opts })
  const { data: matDelays } = useQuery({ queryKey: ["ana-mats"],     queryFn: api.materialDelays, ...opts })
  const { data: trend     } = useQuery({ queryKey: ["ana-trend"],    queryFn: api.deadlineTrend,  ...opts })

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["ana"] })
    setLastRefresh(new Date())
  }, [qc])

  const statusData = health?.status_distribution
    ? Object.entries(health.status_distribution).map(([name, value]) => ({ name, value: value as number }))
    : []

  const taskData = health?.task_progress
    ? [{ name: "Tasks", ...health.task_progress }]
    : []

  const workloadData = (workload?.workload ?? []).slice(0, 8).map((w: any) => ({
    name:       w.name?.split(" ")[0] ?? "User",
    hours:      w.total_hours,
    overloaded: w.overloaded,
  }))

  const allRisks: any[] = risks?.risks ?? []
  const highRisk        = allRisks.filter(r => r.risk_level === "High")
  const tableRows =
    filter === "high-risk" ? highRisk :
    filter === "overdue"   ? allRisks.filter(r => r.overdue_tasks > 0) :
    highRisk

  const trendData: any[] = trend?.trend ?? []

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
    <div className={`transition-all ${showAI ? "pr-96" : ""}`}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refresh every 60s
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "high-risk", "overdue"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {f}
              </button>
            ))}
          </div>

          <button onClick={exportCSV}
            className="flex items-center gap-2 text-sm bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg px-3 py-2 transition-all shadow-sm">
            <Download size={13} /> Export
          </button>

          <button onClick={refresh}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-2 transition-all shadow-sm">
            <RefreshCw size={14} />
          </button>

          <button onClick={() => setShowAI(v => !v)}
            className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 font-medium transition-all shadow-sm ${
              showAI
                ? "bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
            <Bot size={14} /> AI Assistant
          </button>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Status Donut */}
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

        {/* Task Progress */}
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

        {/* Risk Trend */}
        <SectionCard title="Risk Trend — 7 Weeks">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="high"   stroke="#ef4444" fill="#fef2f2" strokeWidth={2} name="High" />
              <Area type="monotone" dataKey="medium" stroke="#f59e0b" fill="#fffbeb" strokeWidth={2} name="Medium" />
              <Area type="monotone" dataKey="low"    stroke="#10b981" fill="#f0fdf4" strokeWidth={2} name="Low" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Workload */}
      <SectionCard title="Team Workload Analytics">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={workloadData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(val: any, _: any, props: any) => [
                `${val}h${props.payload.overloaded ? " ⚠️ Overloaded" : ""}`, "Hours",
              ]} />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {workloadData.map((e: any, i: number) => (
                <Cell key={i} fill={e.overloaded ? "#ef4444" : "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Normal
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Overloaded (&gt;160h/month)
          </div>
        </div>
      </SectionCard>

      {/* Smart Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">

        {/* High Risk Projects */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-500" />
              {filter === "overdue" ? "Overdue Projects" : "High Risk Projects"}
            </h3>
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
              {tableRows.length} flagged
            </span>
          </div>
          <div className="space-y-2">
            {tableRows.length === 0
              ? <Empty message="No flagged projects" />
              : tableRows.slice(0, 6).map((p: any) => (
                <div key={p.project_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-blue-600">{p.job_number}</span>
                      <RiskBadge level={p.risk_level} />
                    </div>
                    <div className="text-sm text-gray-700 truncate">{p.job_title ?? "Unnamed"}</div>
                    {p.risk_reasons?.[0] && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{p.risk_reasons[0]}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-500">{p.risk_score}</div>
                      <div className="text-xs text-gray-400">score</div>
                    </div>
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Missing Materials */}
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

        {/* Revenue Leakage */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign size={13} className="text-emerald-500" />
              Revenue Leakage
            </h3>
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

      {/* AI Panel */}
      {showAI && <AIChatPanel onClose={() => setShowAI(false)} />}
    </div>
  )
}