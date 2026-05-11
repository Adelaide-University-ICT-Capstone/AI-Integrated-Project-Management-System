import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Link as RouterLink } from "@tanstack/react-router"
import { Bell, Lock, Mail, UserRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { UsersService } from "@/client"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const SECONDARY_EMAIL_KEY = "admin_settings_secondary_email"
const ROLE_KEY = "admin_settings_role"
const roleOptions = [
  "Superuser",
  "Project Manager",
  "Structural Engineer",
  "Civil Engineer",
  "Drafter",
]

const emailPreferenceItems = [
  {
    key: "project_updates",
    title: "Project Updates",
    description: "Get notified about project status changes",
    enabled: true,
  },
  {
    key: "task_assignments",
    title: "Task Assignments",
    description: "When you are assigned to a new task",
    enabled: true,
  },
  {
    key: "deadline_reminders",
    title: "Deadline Reminders",
    description: "Reminders for upcoming deadlines",
    enabled: true,
  },
  {
    key: "weekly_reports",
    title: "Weekly Reports",
    description: "Summary of your weekly activity",
    enabled: false,
  },
  {
    key: "invoice_alerts",
    title: "Invoice Alerts",
    description: "Updates on invoicing and payments",
    enabled: true,
  },
]

const notificationSettingItems = [
  {
    key: "browser_notifications",
    title: "Browser Notifications",
    description: "Show desktop notifications",
    enabled: true,
  },
  {
    key: "sound_alerts",
    title: "Sound Alerts",
    description: "Play sound for new notifications",
    enabled: false,
  },
  {
    key: "task_comments",
    title: "Task Comments",
    description: "When someone comments on your tasks",
    enabled: true,
  },
  {
    key: "project_mentions",
    title: "Project Mentions",
    description: "When you are mentioned in a project",
    enabled: true,
  },
  {
    key: "risk_alerts",
    title: "Risk Alerts",
    description: "Critical project risk notifications",
    enabled: true,
  },
]

function Toggle({
  checked,
  onToggle,
}: {
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  )
}

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
  beforeLoad: async () => {
    const user = await UsersService.readUserMe()
    if (!user.is_superuser) {
      throw redirect({
        to: "/settings",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Admin Settings - GAMA FLOW",
      },
    ],
  }),
})

function AdminSettings() {
  const { user: currentUser } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const [fullName, setFullName] = useState("")
  const [primaryEmail, setPrimaryEmail] = useState("")
  const [secondaryEmail, setSecondaryEmail] = useState("")
  const [role, setRole] = useState("Superuser")
  const [emailPrefs, setEmailPrefs] = useState(emailPreferenceItems)
  const [notificationPrefs, setNotificationPrefs] = useState(
    notificationSettingItems,
  )

  const defaultRole = useMemo(
    () => (currentUser?.is_superuser ? "Superuser" : "Project Manager"),
    [currentUser?.is_superuser],
  )

  useEffect(() => {
    if (!currentUser) return
    setFullName(currentUser.full_name ?? "")
    setPrimaryEmail(currentUser.email ?? "")
    setSecondaryEmail(localStorage.getItem(SECONDARY_EMAIL_KEY) ?? "")
    setRole(localStorage.getItem(ROLE_KEY) ?? defaultRole)
  }, [currentUser, defaultRole])

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      UsersService.updateUserMe({
        requestBody: {
          full_name: fullName,
          email: primaryEmail,
        },
      }),
    onSuccess: () => {
      localStorage.setItem(SECONDARY_EMAIL_KEY, secondaryEmail)
      localStorage.setItem(ROLE_KEY, role)
      showSuccessToast(
        "Profile updated. Secondary email and role are currently saved locally.",
      )
      setIsEditing(false)
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleSaveProfile = () => {
    updateProfileMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
        <Button asChild className="mt-4">
          <RouterLink to="/">Back to normal</RouterLink>
        </Button>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/15 p-2 text-blue-400">
            <UserRound className="size-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold">Profile</h2>
            <p className="text-muted-foreground">
              Update your personal information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Full Name</p>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Primary Email</p>
            <Input
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Secondary Email (Optional)</p>
            <Input
              value={secondaryEmail}
              onChange={(e) => setSecondaryEmail(e.target.value)}
              disabled={!isEditing}
              placeholder="Add a secondary email address"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Role</p>
            <Select value={role} onValueChange={setRole} disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (!currentUser) return
                  setFullName(currentUser.full_name ?? "")
                  setPrimaryEmail(currentUser.email ?? "")
                  setSecondaryEmail(
                    localStorage.getItem(SECONDARY_EMAIL_KEY) ?? "",
                  )
                  setRole(localStorage.getItem(ROLE_KEY) ?? defaultRole)
                  setIsEditing(false)
                }}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
              <LoadingButton
                loading={updateProfileMutation.isPending}
                onClick={handleSaveProfile}
              >
                Save Profile
              </LoadingButton>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-500/15 p-2 text-red-400">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold">Security</h2>
              <p className="text-muted-foreground">Change your password</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowSecurity((prev) => !prev)}
          >
            {showSecurity ? "Hide Password Form" : "Change Password"}
          </Button>
        </div>
        {showSecurity ? <ChangePassword /> : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-green-500/15 p-2 text-green-500">
            <Mail className="size-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold">Email Preferences</h2>
            <p className="text-muted-foreground">
              Choose what emails you want to receive
            </p>
          </div>
        </div>
        <div className="divide-y divide-border/70">
          {emailPrefs.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="text-xl font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
              <Toggle
                checked={item.enabled}
                onToggle={() =>
                  setEmailPrefs((prev) =>
                    prev.map((row) =>
                      row.key === item.key
                        ? { ...row, enabled: !row.enabled }
                        : row,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/15 p-2 text-amber-500">
            <Bell className="size-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold">Notification Settings</h2>
            <p className="text-muted-foreground">
              Manage your in-app notifications
            </p>
          </div>
        </div>
        <div className="divide-y divide-border/70">
          {notificationPrefs.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="text-xl font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
              <Toggle
                checked={item.enabled}
                onToggle={() =>
                  setNotificationPrefs((prev) =>
                    prev.map((row) =>
                      row.key === item.key
                        ? { ...row, enabled: !row.enabled }
                        : row,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
