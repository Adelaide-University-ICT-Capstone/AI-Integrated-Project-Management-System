import { assignWorker } from "@/api/workforce"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { getWorkforce } from "@/client/workforce"
import { toast } from "sonner"

export const Route = createFileRoute("/workforce")({
  component: WorkforcePage,
})

const projects = ["Project Alpha", "Project Beta", "Project Gamma"]

function WorkforcePage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [assignedWorkers, setAssignedWorkers] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    fetchWorkers()
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
      toast.error("Select a project first")
      return
    }

    try {
      setLoadingId(worker.id)
      await assignWorker(worker.id)

      setAssignedWorkers((prev) => [
        ...prev,
        { ...worker, project: selectedProject },
      ])

      toast.success(`${worker.name} → ${selectedProject}`)
    } catch {
      setAssignedWorkers((prev) => [
        ...prev,
        { ...worker, project: selectedProject },
      ])
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c6f8f] to-[#4fa3c6] px-10 py-8">

      {/* LOGO */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/90 px-8 py-4 rounded-2xl shadow-xl backdrop-blur-md">
          <img
            src="/assets/images/gama-logo.png"
            className="w-48 object-contain"
          />
        </div>
      </div>

      {/* TITLE */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">
          Workforce Allocation
        </h1>
        <p className="text-white/70 mt-1">
          Assign team members to projects efficiently
        </p>
      </div>

      {/* PROJECT SELECTOR */}
      <div className="flex justify-center mb-10">
        <div className="flex gap-4 flex-wrap justify-center">
          {projects.map((project) => (
            <button
              key={project}
              onClick={() => setSelectedProject(project)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all
              ${
                selectedProject === project
                  ? "bg-white text-blue-700 shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {project}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* AVAILABLE WORKERS */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-4">
            Available Workers
          </h2>

          {loading ? (
            <p className="text-white/70">Loading...</p>
          ) : (
            workers.map((worker) => (
              <div
                key={worker.id}
                className="flex justify-between items-center p-4 rounded-xl bg-white/10 mb-3 hover:bg-white/20 transition"
              >
                <div>
                  <p className="text-white font-medium">{worker.name}</p>
                  <p className="text-white/60 text-sm">{worker.role}</p>
                </div>

                <button
                  onClick={() => handleAssign(worker)}
                  disabled={loadingId === worker.id}
                  className="px-4 py-2 rounded-lg bg-white text-blue-700 font-medium hover:shadow-lg transition"
                >
                  {loadingId === worker.id ? "..." : "Assign"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* ASSIGNED WORKERS */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-4">
            Assigned to {selectedProject || "—"}
          </h2>

          {assignedWorkers.length === 0 ? (
            <p className="text-white/70">No assignments yet</p>
          ) : (
            assignedWorkers.map((w, i) => (
              <div
                key={i}
                className="flex justify-between p-4 rounded-xl bg-white/10 mb-3"
              >
                <span className="text-white">{w.name}</span>
                <span className="text-white/60">{w.project}</span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}