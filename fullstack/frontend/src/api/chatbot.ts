import { api } from "./client"

export type ChatbotRequest = {
  message: string
  project_id?: string | number
}

export type CommandUsed = {
  command: string
  arguments: Record<string, unknown>
}

export type ChatbotResponse = {
  response: string
  command_used?: string
  command_data?: unknown
  commands_used?: CommandUsed[]
  command_results?: unknown[]
}

export const chatbotApi = {
  sendMessage: (payload: ChatbotRequest) =>
    api.post<ChatbotResponse>("/chatbot/chat", payload).then((res) => res.data),
}