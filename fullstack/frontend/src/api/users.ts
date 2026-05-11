import axios from 'axios'

const baseUrl = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: `${baseUrl}/api/v1`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type EmployeeHoursDetail = {
  employee_id: string
  name: string | null
  working_hours: string
  role: string | null
}

export type EmployeeHoursResponse = {
  data: EmployeeHoursDetail[]
  count: number
}

export const usersApi = {
  // GET /users/time_log/{date_str} — hours worked by all employees since date
  getEmployeeHours: (since: string) =>
    api.get<EmployeeHoursResponse>(`/users/time_log/${since}`).then(res => res.data),
}
