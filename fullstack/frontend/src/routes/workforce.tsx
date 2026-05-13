import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/workforce")({
  component: WorkforcePage,
})

// ── Types ────────────────────────────────────────────────────────────────────
interface Worker {
  id: number
  name: string
  role: string
  status?: "active" | "completed" | "available"
}

interface ProjectWorker extends Worker {
  assignedRole: string
}

interface Project {
  id: string
  code: string
  name: string
  department: string
  location: string
  startDate: string
  deliveryDate: string
  progress: number
  status: "Completed" | "In Progress" | "Planning"
  aiInsight: { message: string; detail: string; confidence: number }
  tasks: { name: string; progress: number }[]
  materials: { name: string; qty: string; status: "Delivered" | "Pending" | "In Transit" }[]
  workforce: ProjectWorker[]
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PROJECTS: Project[] = [
  {
    id: "PRJ-2024-003",
    code: "PRJ-2024-003",
    name: "Bridge Renovation Project",
    department: "City Infrastructure Department",
    location: "River District",
    startDate: "Nov 1, 2023",
    deliveryDate: "Mar 15, 2024",
    progress: 100,
    status: "Completed",
    aiInsight: {
      message: "Project Successfully Completed",
      detail: "All phases completed on time and within budget. Excellent team performance throughout the project lifecycle.",
      confidence: 100,
    },
    tasks: [
      { name: "Planning", progress: 100 },
      { name: "Foundation", progress: 100 },
      { name: "Structural", progress: 100 },
      { name: "MEP", progress: 100 },
      { name: "Finishing", progress: 100 },
    ],
    materials: [
      { name: "Steel Beams", qty: "180 tons", status: "Delivered" },
      { name: "Concrete Mix", qty: "900 m³", status: "Delivered" },
      { name: "Reinforcement Bars", qty: "75 tons", status: "Delivered" },
    ],
    workforce: [
      { id: 1, name: "Harri Rassias", role: "Structural Engineer", assignedRole: "Structural Engineer", status: "completed" },
      { id: 2, name: "Robert Johnson", role: "Project Manager", assignedRole: "Project Manager", status: "completed" },
    ],
  },
  {
    id: "PRJ-2024-004",
    code: "PRJ-2024-004",
    name: "City Park Redevelopment",
    department: "Parks & Recreation",
    location: "Northside",
    startDate: "Jan 15, 2024",
    deliveryDate: "Jun 30, 2024",
    progress: 62,
    status: "In Progress",
    aiInsight: {
      message: "On Track — Minor Risk",
      detail: "Material deliveries running 3 days behind schedule. Recommend pre-ordering Phase 3 supplies now.",
      confidence: 87,
    },
    tasks: [
      { name: "Site Clearing", progress: 100 },
      { name: "Landscaping", progress: 80 },
      { name: "Pathways", progress: 55 },
      { name: "Amenities", progress: 30 },
      { name: "Lighting", progress: 0 },
    ],
    materials: [
      { name: "Paving Stones", qty: "2,400 m²", status: "Delivered" },
      { name: "Topsoil", qty: "340 m³", status: "In Transit" },
      { name: "Playground Equipment", qty: "1 set", status: "Pending" },
    ],
    workforce: [
      { id: 3, name: "Sarah Chen", role: "Landscape Architect", assignedRole: "Lead Designer", status: "active" },
    ],
  },
]

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard" },
  { label: "Projects", active: true },
  { label: "Task Board" },
  { label: "Subcontractors" },
  { label: "AI Assistant" },
  { label: "Settings" },
]

// ── Colour helpers ────────────────────────────────────────────────────────────
const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  Completed:   { bg: "#dcfce7", text: "#16a34a" },
  "In Progress": { bg: "#dbeafe", text: "#2563eb" },
  Planning:    { bg: "#fef9c3", text: "#ca8a04" },
}

function progressColor(pct: number) {
  if (pct === 100) return "#22c55e"
  if (pct >= 60)  return "#3b82f6"
  if (pct >= 30)  return "#f59e0b"
  return "#ef4444"
}

const AVATAR_PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316",
  "#14b8a6", "#6366f1", "#22c55e", "#f43f5e",
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

// ── Circular progress ─────────────────────────────────────────────────────────
function CircleProgress({ pct }: { pct: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = progressColor(pct)
  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>{pct}%</span>
        <span style={{ fontSize: 9, color: "#9ca3af", letterSpacing: "0.04em" }}>Overall Progress</span>
      </div>
    </div>
  )
}

// ── Workforce Allocation Modal ────────────────────────────────────────────────
function AllocationModal({
  workers,
  onClose,
  onSave,
}: {
  workers: ProjectWorker[]
  onClose: () => void
  onSave: (updated: ProjectWorker[]) => void
}) {
  const [rows, setRows] = useState<ProjectWorker[]>(workers)
  const [employee, setEmployee] = useState("")
  const [role, setRole] = useState("")

  const ROLE_OPTIONS = [
    "Project Manager", "Structural Engineer", "Frontend Developer",
    "Backend Developer", "Security Engineer", "Site Supervisor",
    "Landscape Architect", "MEP Engineer",
  ]

  const EMPLOYEE_OPTIONS = [
    "Alice Martin", "Bob Chen", "Charlie Davis", "Diana Ross",
    "Harri Rassias", "Robert Johnson", "Sarah Chen", "Marcus Lee",
  ]

  const handleAdd = () => {
    if (!employee || !role) return
    const newRow: ProjectWorker = {
      id: Date.now(),
      name: employee,
      role,
      assignedRole: role,
      status: "active",
    }
    setRows((prev) => [...prev, newRow])
    setEmployee("")
    setRole("")
  }

  const handleRemove = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id))

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        width: 480,
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 16px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            Workforce Allocation
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            Increase your team power
          </div>
        </div>

        {/* Add row */}
        <div style={{
          display: "flex", gap: 10, padding: "0 28px 16px", alignItems: "center",
        }}>
          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            style={{
              flex: 1, padding: "9px 12px",
              border: "1px solid #d1d5db", borderRadius: 8,
              fontSize: 13, color: "#374151", background: "#fff",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="">Employee</option>
            {EMPLOYEE_OPTIONS.map((e) => <option key={e}>{e}</option>)}
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              flex: 1, padding: "9px 12px",
              border: "1px solid #d1d5db", borderRadius: 8,
              fontSize: 13, color: "#374151", background: "#fff",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="">Role</option>
            {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>

          <button
            onClick={handleAdd}
            style={{
              padding: "9px 20px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        {/* Table */}
        <div style={{
          borderTop: "1px solid #f3f4f6",
          overflowY: "auto",
          flex: 1,
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{
                  padding: "10px 28px", textAlign: "left",
                  fontSize: 12, fontWeight: 600, color: "#6b7280",
                  letterSpacing: "0.03em",
                }}>
                  Employee Name
                </th>
                <th style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 12, fontWeight: 600, color: "#6b7280",
                  letterSpacing: "0.03em",
                }}>
                  Role
                </th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{
                    padding: "24px 28px", color: "#9ca3af",
                    fontSize: 13, textAlign: "center",
                  }}>
                    No team members assigned yet
                  </td>
                </tr>
              ) : rows.map((w) => (
                <tr key={w.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "11px 28px", fontSize: 13, color: "#374151" }}>
                    {w.name}
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>
                    {w.assignedRole}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "center" }}>
                    <button
                      onClick={() => handleRemove(w.id)}
                      style={{
                        background: "none", border: "none",
                        color: "#9ca3af", cursor: "pointer",
                        fontSize: 16, lineHeight: 1,
                        padding: "2px 6px",
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "16px 28px",
          borderTop: "1px solid #f3f4f6",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(rows); onClose() }}
            style={{
              padding: "9px 20px",
              background: "#2563eb",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetail({
  project,
  onBack,
}: {
  project: Project
  onBack: () => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [workforce, setWorkforce] = useState<ProjectWorker[]>(project.workforce)
  const [activeTab, setActiveTab] = useState<"Overview" | "Resources" | "Timeline">("Overview")

  const statusStyle = STATUS_COLOURS[project.status] ?? STATUS_COLOURS["Planning"]

  return (
    <div style={{ flex: 1, overflow: "auto", background: "#f9fafb" }}>
      {/* Back + breadcrumb */}
      <div style={{ padding: "16px 32px 0" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none",
            color: "#6b7280", fontSize: 13, cursor: "pointer",
            padding: 0,
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={{
        margin: "16px 32px 24px",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Project header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div style={{ flex: 1 }}>
            {/* Code + status badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{project.code}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: statusStyle.bg, color: statusStyle.text,
                padding: "2px 10px", borderRadius: 99,
              }}>
                {project.status}
              </span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>
              {project.name}
            </h1>

            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                { text: project.department },
                { text: project.location },
                { text: `Start: ${project.startDate}` },
                { text: `Delivery: ${project.deliveryDate}` },
              ].map((m) => (
                <span key={m.text} style={{ fontSize: 13, color: "#6b7280" }}>
                  {m.text}
                </span>
              ))}
            </div>
          </div>

          <CircleProgress pct={project.progress} />
        </div>

        {/* AI Insight banner */}
        <div style={{
          margin: "20px 28px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                background: "#16a34a",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 10, flexShrink: 0,
              }}>✓</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#15803d" }}>
                AI System Insight
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>
              {project.aiInsight.message}
            </div>
            <div style={{ fontSize: 12, color: "#4ade80", marginTop: 3 }}>
              {project.aiInsight.detail}
            </div>
          </div>
          <span style={{
            fontSize: 12, color: "#16a34a", fontWeight: 600,
            background: "#dcfce7", padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap",
          }}>
            {project.aiInsight.confidence}% confidence
          </span>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 28px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", gap: 0 }}>
            {(["Overview", "Resources", "Timeline"] as const).map((tab) => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: "none",
                    borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                    color: active ? "#2563eb" : "#6b7280",
                    fontWeight: active ? 600 : 400,
                    fontSize: 13,
                    cursor: "pointer",
                    marginBottom: -1,
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab body */}
        <div style={{ padding: "24px 28px" }}>

          {/* ── Task Workflow Progress ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#374151",
            }}>
              Task Workflow Progress
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {project.tasks.map((task) => {
                const color = progressColor(task.progress)
                return (
                  <div key={task.name}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginBottom: 5, fontSize: 13,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: task.progress === 100 ? "#22c55e" : "#e5e7eb",
                          border: task.progress === 100 ? "none" : "2px solid #d1d5db",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: "#fff", flexShrink: 0,
                        }}>
                          {task.progress === 100 ? "✓" : ""}
                        </span>
                        <span style={{ color: "#374151" }}>{task.name}</span>
                      </div>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>{task.progress}%</span>
                    </div>
                    <div style={{
                      height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", width: `${task.progress}%`,
                        background: color, borderRadius: 99,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Materials Status ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16,
            }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: "#374151",
              }}>
                Materials Status
              </div>
              <button style={{
                padding: "5px 14px", border: "1px solid #d1d5db",
                borderRadius: 7, background: "#fff", fontSize: 12,
                color: "#374151", cursor: "pointer",
              }}>
                + Add
              </button>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {project.materials.map((mat) => {
                const statColor = mat.status === "Delivered"
                  ? { text: "#16a34a", bg: "#dcfce7" }
                  : mat.status === "In Transit"
                  ? { text: "#d97706", bg: "#fef3c7" }
                  : { text: "#6b7280", bg: "#f3f4f6" }
                return (
                  <div key={mat.name} style={{
                    flex: "1 1 180px",
                    border: "1px solid #f3f4f6",
                    borderRadius: 10, padding: "14px 16px",
                    background: "#fafafa",
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600,
                      color: statColor.text, background: statColor.bg,
                      display: "inline-block", padding: "2px 9px",
                      borderRadius: 99, marginBottom: 8,
                    }}>
                      {mat.status}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {mat.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      {mat.qty}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Workforce Allocation ── */}
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16,
            }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: "#374151",
              }}>
                Workforce Allocation
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "5px 14px", border: "1px solid #d1d5db",
                  borderRadius: 7, background: "#fff", fontSize: 12,
                  color: "#374151", cursor: "pointer",
                }}
              >
                + Add
              </button>
            </div>

            {workforce.length === 0 ? (
              <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>
                No team members assigned. Click add to assign workers.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {workforce.map((w) => {
                  const color = avatarColor(w.name)
                  return (
                    <div key={w.id} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: color, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 700,
                      }}>
                        {w.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          {w.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {w.assignedRole}
                        </div>
                        {w.status && (
                          <div style={{
                            fontSize: 10,
                            color: w.status === "completed" ? "#16a34a" : "#2563eb",
                            marginTop: 2,
                          }}>
                            {w.status}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <AllocationModal
          workers={workforce}
          onClose={() => setShowModal(false)}
          onSave={(updated) => {
            setWorkforce(updated)
            toast.success("Workforce updated successfully")
          }}
        />
      )}
    </div>
  )
}

// ── Projects List View ────────────────────────────────────────────────────────
function ProjectsList({ onSelect }: { onSelect: (p: Project) => void }) {
  return (
    <div style={{ flex: 1, padding: "28px 32px", overflow: "auto", background: "#f9fafb" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Projects</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          {MOCK_PROJECTS.length} projects total
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_PROJECTS.map((project) => {
          const statusStyle = STATUS_COLOURS[project.status] ?? STATUS_COLOURS["Planning"]
          return (
            <div
              key={project.id}
              onClick={() => onSelect(project)}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "20px 24px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{project.code}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: statusStyle.bg, color: statusStyle.text,
                    padding: "2px 10px", borderRadius: 99,
                  }}>
                    {project.status}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                  {project.name}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                  {project.department} · {project.location}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: progressColor(project.progress) }}>
                    {project.progress}%
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Progress</div>
                </div>
                <span style={{ color: "#d1d5db", fontSize: 18 }}>›</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function WorkforcePage() {
  const [activeNav, setActiveNav] = useState("Projects")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: "#f9fafb",
      color: "#111827",
    }}>

      {/* ── TOPBAR ── */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/assets/images/gama-logo.png"
            alt="GAMA Consulting"
            style={{ height: 38, objectFit: "contain" }}
          />
          <div style={{ width: 1, height: 28, background: "#e5e7eb" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
              GAMA Consulting
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Project Management System</div>
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 14, fontWeight: 600, color: "#374151",
          letterSpacing: "0.01em",
        }}>
          AI Project Management Platform
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Harri Rassias</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Structural Engineer</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "#2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
          }}>
            HR
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", border: "1px solid #e5e7eb",
            borderRadius: 7, background: "#fff",
            fontSize: 12, color: "#6b7280", cursor: "pointer",
          }}>
            Logout
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <nav style={{
          width: 220,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexShrink: 0,
        }}>
          {NAV_ITEMS.map((item) => {
            const active = activeNav === item.label
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label)
                  if (item.label !== "Projects") setSelectedProject(null)
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: active ? "#eff6ff" : "transparent",
                  color: active ? "#2563eb" : "#6b7280",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "#f9fafb"
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* ── CONTENT ── */}
        {activeNav === "Projects" ? (
          selectedProject ? (
            <ProjectDetail
              project={selectedProject}
              onBack={() => setSelectedProject(null)}
            />
          ) : (
            <ProjectsList onSelect={setSelectedProject} />
          )
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", fontSize: 14,
          }}>
            {activeNav} — coming soon
          </div>
        )}
      </div>
    </div>
  )
}
