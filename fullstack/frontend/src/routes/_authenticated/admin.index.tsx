import { createFileRoute } from "@tanstack/react-router"
import {
  Building2,
  CalendarDays,
  PenSquare,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminProjects,
  head: () => ({
    meta: [
      {
        title: "Admin Projects - GAMA FLOW",
      },
    ],
  }),
})

const ongoingProjects = Array.from({ length: 6 }, (_, index) => ({
  id: `ongoing-${index + 1}`,
  title: "Projects Title",
  company: "Client Company",
  manager: "Project Manager",
  days: 482,
}))

const delayedProjects = Array.from({ length: 2 }, (_, index) => ({
  id: `delayed-${index + 1}`,
  title: "Projects Title",
  company: "Client Company",
  manager: "Project Manager",
  days: 482,
}))

function ProjectRow({
  title,
  company,
  manager,
  days,
}: {
  title: string
  company: string
  manager: string
  days: number
}) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr_auto_auto] items-center gap-4 rounded-xl bg-secondary/60 px-4 py-3">
      <p className="text-3xl font-medium">{title}</p>
      <p className="flex items-center gap-2 text-xl text-muted-foreground">
        <Building2 className="size-6" />
        {company}
      </p>
      <p className="flex items-center gap-2 text-xl text-muted-foreground">
        <UserRound className="size-6" />
        {manager}
      </p>
      <p className="flex items-center gap-2 text-xl">
        <CalendarDays className="size-6" />
        {days} days
      </p>
      <button className="rounded-md border border-border/70 p-2 transition hover:bg-accent/50">
        <PenSquare className="size-5" />
      </button>
    </div>
  )
}

function AdminProjects() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-4xl font-semibold">On going projects:</h2>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-5xl font-semibold">21</p>
              <p className="mt-3 text-muted-foreground">since March</p>
            </div>
            <div className="text-right text-cyan-400">
              <TrendingUp className="ml-auto size-9" />
              <p className="mt-2 text-3xl font-semibold">20%</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-4xl font-semibold">Completed projects:</h2>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-5xl font-semibold">1</p>
              <p className="mt-3 text-muted-foreground">since March</p>
            </div>
            <div className="text-right text-red-400">
              <TrendingDown className="ml-auto size-9" />
              <p className="mt-2 text-3xl font-semibold">20%</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-4xl font-semibold">Invoices:</h2>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-5xl font-semibold">$1234.2</p>
              <p className="mt-3 text-muted-foreground">since March</p>
            </div>
            <div className="text-right text-cyan-400">
              <TrendingUp className="ml-auto size-9" />
              <p className="mt-2 text-3xl font-semibold">20%</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <h3 className="text-4xl font-semibold">On going projects:</h3>
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-2">
          {ongoingProjects.map((project) => (
            <ProjectRow
              key={project.id}
              title={project.title}
              company={project.company}
              manager={project.manager}
              days={project.days}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <h3 className="text-4xl font-semibold">Delay projects:</h3>
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-2">
          {delayedProjects.map((project) => (
            <ProjectRow
              key={project.id}
              title={project.title}
              company={project.company}
              manager={project.manager}
              days={project.days}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
