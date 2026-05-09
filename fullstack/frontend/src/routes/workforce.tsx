import { assignWorker } from "@/api/workforce"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { getWorkforce } from "@/client/workforce"
import { toast } from "sonner"

export const Route = createFileRoute("/workforce")({
  component: WorkforcePage,
})

const projects = ["Project Alpha", "Project Beta", "Project Gamma"]

// Gama brand palette extracted from logo
const CYAN = "#00AEEF"
const CYAN_DIM = "rgba(0,174,239,0.13)"
const CYAN_BORDER = "rgba(0,174,239,0.32)"
const GAMA_GREY = "#8a8f9a"

const roleColors: Record<string, { dot: string; tag: string; text: string }> = {
  "Frontend Developer": { dot: "#00AEEF", tag: "rgba(0,174,239,0.11)", text: "#00AEEF" },
  "Backend Developer": { dot: "#5b8dee", tag: "rgba(91,141,238,0.11)", text: "#5b8dee" },
  "Security Engineer": { dot: "#00d4b4", tag: "rgba(0,212,180,0.11)", text: "#00d4b4" },
  default:             { dot: "#8a8f9a", tag: "rgba(138,143,154,0.11)", text: "#8a8f9a" },
}

function getRoleColor(role: string) {
  return roleColors[role] ?? roleColors["default"]
}

function WorkforcePage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [assignedWorkers, setAssignedWorkers] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    fetchWorkers()
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchWorkers = async () => {
    try {
      const data = await getWorkforce()
      setWorkers(data)
    } catch {
      setWorkers([
        { id: 1, name: "Alice", role: "Frontend Developer" },
        { id: 2, name: "Bob", role: "Backend Developer" },
        { id: 3, name: "Charlie", role: "Security Engineer" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (worker: any) => {
    if (!selectedProject) {
      toast.error("No project selected — choose a target first")
      return
    }
    try {
      setLoadingId(worker.id)
      await assignWorker(worker.id)
      setAssignedWorkers((prev) => [...prev, { ...worker, project: selectedProject }])
      toast.success(`${worker.name} routed → ${selectedProject}`)
    } catch {
      setAssignedWorkers((prev) => [...prev, { ...worker, project: selectedProject }])
    } finally {
      setLoadingId(null)
    }
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-AU", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  })
  const dateStr = now.toLocaleDateString("en-AU", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  })

  const utilPct =
    workers.length > 0 ? Math.round((assignedWorkers.length / workers.length) * 100) : 0

  const assignedInProject = assignedWorkers.filter((w) => w.project === selectedProject)

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080a10",
      fontFamily: "'Courier New', 'Courier', monospace",
      color: "#e2e8f0",
    }}>

      {/* ── TOPBAR ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 36px",
        height: "80px",
        background: "#0c0f1a",
        borderBottom: `1px solid ${CYAN_BORDER}`,
        boxShadow: `0 2px 24px rgba(0,174,239,0.07)`,
      }}>
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img
            src="/assets/images/gama-logo.png"
            style={{ height: "50px", objectFit: "contain" }}
            alt="Gama Consulting"
          />
          <div style={{ width: "1px", height: "32px", background: CYAN_BORDER }} />
          <div>
            <div style={{
              fontSize: "14px", letterSpacing: "0.2em",
              color: CYAN, fontWeight: 700,
            }}>
              WORKFORCE
            </div>
            <div style={{
              fontSize: "10px", letterSpacing: "0.14em",
              color: GAMA_GREY, marginTop: "2px",
            }}>
              ALLOCATION SYSTEM
            </div>
          </div>
        </div>

        {/* Clock + live */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: GAMA_GREY }}>{dateStr}</div>
            <div style={{
              fontSize: "16px", color: "#e2e8f0",
              fontWeight: 700, letterSpacing: "0.06em",
            }}>
              {timeStr}
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "11px", color: CYAN, letterSpacing: "0.1em",
          }}>
            <span style={{
              width: "9px", height: "9px", borderRadius: "50%",
              background: CYAN, display: "inline-block",
              boxShadow: `0 0 10px ${CYAN}`,
              animation: "gcPulse 2s infinite",
            }} />
            LIVE
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderBottom: "1px solid #141726",
        background: "#0c0f1a",
      }}>
        {[
          { label: "TOTAL WORKFORCE", value: workers.length,  sub: "members loaded",                          color: "#e2e8f0" },
          { label: "ASSIGNED",         value: assignedWorkers.length, sub: "this session",                   color: CYAN },
          { label: "UTILIZATION",      value: `${utilPct}%`,  sub: "of workforce",
            color: utilPct > 80 ? "#f87171" : utilPct > 50 ? "#facc15" : CYAN },
          { label: "ACTIVE PROJECT",
            value: selectedProject ? selectedProject.replace("Project ", "").toUpperCase() : "—",
            sub: selectedProject ? `${assignedInProject.length} assigned` : "none selected",
            color: "#5b8dee" },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: "20px 30px",
            borderRight: i < 3 ? "1px solid #141726" : "none",
            position: "relative",
          }}>
            {i === 0 && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                background: `linear-gradient(90deg, ${CYAN}, transparent)`,
              }} />
            )}
            <div style={{
              fontSize: "10px", color: GAMA_GREY,
              letterSpacing: "0.14em", marginBottom: "8px",
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: "28px", fontWeight: 700,
              color: stat.color, lineHeight: 1,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "11px", color: "#374151", marginTop: "5px" }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── BODY ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "290px 1fr",
        minHeight: "calc(100vh - 150px)",
      }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          borderRight: "1px solid #141726",
          padding: "30px 24px",
          background: "#0a0d16",
        }}>
          <div style={{
            fontSize: "10px", color: GAMA_GREY,
            letterSpacing: "0.14em", marginBottom: "16px",
          }}>
            SELECT TARGET PROJECT
          </div>

          {projects.map((project) => {
            const active = selectedProject === project
            const count = assignedWorkers.filter((w) => w.project === project).length
            return (
              <button
                key={project}
                onClick={() => setSelectedProject(project)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  padding: "13px 18px",
                  marginBottom: "8px",
                  borderRadius: "7px",
                  border: active ? `1px solid ${CYAN_BORDER}` : "1px solid #1a1f2e",
                  background: active ? CYAN_DIM : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  position: "relative",
                  overflow: "hidden",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "#111526"
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"
                }}
              >
                {/* left cyan stripe when active */}
                {active && (
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: "3px", background: CYAN,
                  }} />
                )}
                <div style={{
                  fontSize: "13px",
                  color: active ? CYAN : "#c9d1d9",
                  fontWeight: active ? 700 : 400,
                  letterSpacing: "0.07em",
                }}>
                  {active ? "▶ " : "  "}{project.toUpperCase()}
                </div>
                {count > 0 && (
                  <span style={{
                    fontSize: "11px",
                    background: CYAN_DIM,
                    color: CYAN,
                    padding: "2px 10px",
                    borderRadius: "4px",
                    border: `1px solid ${CYAN_BORDER}`,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Role legend */}
          <div style={{
            marginTop: "36px", paddingTop: "24px",
            borderTop: "1px solid #141726",
          }}>
            <div style={{
              fontSize: "10px", color: GAMA_GREY,
              letterSpacing: "0.14em", marginBottom: "14px",
            }}>
              ROLE INDEX
            </div>
            {Object.entries(roleColors)
              .filter(([k]) => k !== "default")
              .map(([role, colors]) => (
                <div key={role} style={{
                  display: "flex", alignItems: "center",
                  gap: "10px", marginBottom: "11px",
                }}>
                  <span style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: colors.dot, flexShrink: 0,
                    boxShadow: `0 0 6px ${colors.dot}`,
                  }} />
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>{role}</span>
                </div>
              ))}
          </div>

          {/* Faded logo watermark */}
          <div style={{ marginTop: "40px", textAlign: "center", opacity: 0.18 }}>
            <img
              src="/assets/images/gama-logo.png"
              style={{ width: "100px", objectFit: "contain", filter: "grayscale(1)" }}
              alt=""
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ padding: "30px 40px", display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* Available Workers */}
          <div>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              marginBottom: "18px",
            }}>
              <div style={{
                fontSize: "10px", color: GAMA_GREY, letterSpacing: "0.14em",
              }}>
                AVAILABLE WORKERS
              </div>
              <div style={{
                flex: 1, height: "1px",
                background: "linear-gradient(90deg, #1a1f2e, transparent)",
              }} />
              <div style={{
                fontSize: "11px", color: CYAN,
                background: CYAN_DIM,
                border: `1px solid ${CYAN_BORDER}`,
                padding: "3px 12px", borderRadius: "4px",
              }}>
                {workers.length} MEMBERS
              </div>
            </div>

            {loading ? (
              <div style={{ fontSize: "13px", color: GAMA_GREY, letterSpacing: "0.1em" }}>
                FETCHING ROSTER...
              </div>
            ) : workers.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#374151", letterSpacing: "0.1em" }}>
                NO WORKERS FOUND
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {workers.map((worker) => {
                  const colors = getRoleColor(worker.role)
                  return (
                    <div
                      key={worker.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 22px",
                        borderRadius: "8px",
                        border: "1px solid #1a1f2e",
                        background: "#0c0f1a",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = CYAN_BORDER
                        el.style.boxShadow = `0 0 18px rgba(0,174,239,0.07)`
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = "#1a1f2e"
                        el.style.boxShadow = "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {/* Avatar circle */}
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          border: `1px solid ${colors.dot}`,
                          background: colors.tag,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "15px", fontWeight: 700, color: colors.dot,
                          flexShrink: 0,
                        }}>
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{
                            fontSize: "16px", color: "#f1f5f9",
                            fontWeight: 600, marginBottom: "5px",
                          }}>
                            {worker.name}
                          </div>
                          <div style={{
                            fontSize: "11px", color: colors.text,
                            background: colors.tag,
                            display: "inline-block",
                            padding: "2px 10px", borderRadius: "3px",
                            letterSpacing: "0.05em",
                          }}>
                            {worker.role.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssign(worker)}
                        disabled={loadingId === worker.id}
                        style={{
                          fontSize: "12px",
                          padding: "10px 24px",
                          borderRadius: "6px",
                          border: `1px solid ${CYAN_BORDER}`,
                          background: CYAN_DIM,
                          color: CYAN,
                          cursor: loadingId === worker.id ? "wait" : "pointer",
                          letterSpacing: "0.1em",
                          fontFamily: "inherit",
                          fontWeight: 700,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = "rgba(0,174,239,0.26)"
                          el.style.boxShadow = `0 0 14px rgba(0,174,239,0.2)`
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement
                          el.style.background = CYAN_DIM
                          el.style.boxShadow = "none"
                        }}
                      >
                        {loadingId === worker.id ? "ROUTING..." : "ASSIGN →"}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assigned Roster */}
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              marginBottom: "18px",
            }}>
              <div style={{
                fontSize: "10px", color: GAMA_GREY, letterSpacing: "0.14em",
              }}>
                ASSIGNED ROSTER
                {selectedProject ? ` // ${selectedProject.toUpperCase()}` : " // ALL PROJECTS"}
              </div>
              <div style={{
                flex: 1, height: "1px",
                background: "linear-gradient(90deg, #1a1f2e, transparent)",
              }} />
            </div>

            {assignedWorkers.length === 0 ? (
              <div style={{
                fontSize: "13px", color: "#2d3748",
                letterSpacing: "0.08em", padding: "28px 0",
                borderTop: "1px dashed #141726",
              }}>
                NO ASSIGNMENTS YET — SELECT A PROJECT AND ASSIGN A WORKER
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {assignedWorkers.map((w, i) => {
                  const colors = getRoleColor(w.role)
                  return (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "13px 22px",
                      borderRadius: "7px",
                      border: "1px solid #141726",
                      background: "#090c15",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{
                          width: "34px", height: "34px", borderRadius: "50%",
                          border: `1px solid ${colors.dot}`,
                          background: colors.tag,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 700, color: colors.dot,
                          flexShrink: 0,
                        }}>
                          {w.name?.charAt(0)}
                        </div>
                        <span style={{ fontSize: "15px", color: "#d1d5db", fontWeight: 600 }}>
                          {w.name}
                        </span>
                        <span style={{
                          fontSize: "11px", color: colors.text,
                          background: colors.tag,
                          padding: "2px 9px", borderRadius: "3px",
                        }}>
                          {w.role?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{
                        fontSize: "11px", color: "#5b8dee",
                        background: "rgba(91,141,238,0.1)",
                        border: "1px solid rgba(91,141,238,0.25)",
                        padding: "4px 14px", borderRadius: "4px",
                        letterSpacing: "0.06em",
                      }}>
                        {w.project.toUpperCase()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes gcPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #00AEEF; }
          50%       { opacity: 0.25; box-shadow: none; }
        }
      `}</style>
    </div>
  )
}
