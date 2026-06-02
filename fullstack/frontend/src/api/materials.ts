import { api } from './client'


api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});




export type Material = {
    id: string,
    name: string,
    ordered_date: string | null,
    status: string,
    subcontractor_id: string | null,
    project_id: string
}

export type CreateMaterialRequest = {
  project_id: string
  name: string
  status: string
  subcontractor_id: string | null
  ordered_date: string | null
}

// UI-friendly order type (thin view of Material)
export type Order = {
  id: string
  projectId: string
  subcontractorId: string
  service: string | null
  orderedDate: string | null
  status: string
  project_id?: string
  projectJobNumber?: string
  isPlaceholder?: boolean
}

// map API Material -> UI Order
export const mapMaterialToOrder = (m: Material): Order => ({
  id: m.id,
  projectId: m.project_id,
  subcontractorId: m.subcontractor_id ?? '',
  service: m.name ?? null,
  orderedDate: m.ordered_date,
  status: m.status,
  project_id: m.project_id,
})

export const materialsApi = {
  getOrders: () => api.get<Material[]>('/materials').then(res => res.data),
  getUnreceivedOrders: () => api.get<Material[]>('/materials?status=ordered').then(res => res.data),
  getProjectOrders: (projectId: string) =>
    api.get<Material[]>(`/projects/${projectId}/materials`).then(res => res.data),

  createOrder: (
    projectId: string,
    data: CreateMaterialRequest
  ) =>
    api
      .post<Material>(`/projects/${projectId}/materials`, data)
      .then(res => res.data),

  deleteOrder: (projectId: string, materialId: string) =>
  api
    .delete<{ message: string }>(`/projects/${projectId}/materials/${materialId}`)
    .then((res) => res.data),
}
