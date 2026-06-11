/* 
Author: Anh Ho
Functions: Performs API call for the AI risks section of the dashboard.
*/

import { api } from "./client"

export type AIAlert = {
  id: string
  severity: "high" | "medium" | "low"
  message: string
  project: string
  action: string
}

export type AIAlertsResponse = {
  alerts: AIAlert[]
}

export const dashboardApi = {
  getAIAlerts: () =>
    api.get<AIAlertsResponse>("/dashboard/ai-alerts").then((res) => res.data),
}