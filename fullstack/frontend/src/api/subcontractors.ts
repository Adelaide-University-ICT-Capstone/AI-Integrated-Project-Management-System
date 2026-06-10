/* 
File Author: Leslie
Functions: perform API call and integration for subcontractors module
*/
import { api } from './client'


api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export type Subcontractor = {
    id: string
    company_name: string
    contact_email: string | null
    phone: string | null
    specialty?: string | null
}

export type SubcontractorUpdate = Partial<Omit<Subcontractor, 'id'>>
export const subcontractorsApi = {
  getSubcontractors: () => api.get<Subcontractor[]>('/subcontractors').then(res => res.data),
  createSubcontractor: (subcontractor: Omit<Subcontractor, 'id'>) => api.post<Subcontractor>('/subcontractors', subcontractor).then(res => res.data),
  updateSubcontractor: (id: string, subcontractor: SubcontractorUpdate) => api.patch<Subcontractor>(`/subcontractors/${id}`, subcontractor).then(res => res.data),
  deleteSubcontractor: (id: string) => api.delete<{ message: string }>(`/subcontractors/${id}`).then(res => res.data),
}
