import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL;


const api = axios.create({
  baseURL: `${baseUrl}/api/v1`,
});

export type Project = {
  job_number: string
  project_id: string
  project_name: string
  company_name: string
  company_address: string
  client_name: string
  status: string
  start_date: string
  due_date: string
  days_elapsed: number
  progress: number | 100
  fee_estimate: string | ""
}

export type ProjectsResponse = {
  data: Project[];
  count: number;
};



// src/api/projects.ts
export const projectsApi = {
  //  @router.get("/current-project-num")
  getCurrentProjectCount: () => api.get('/projects/current-project-num').then(res => res.data),

  //  @router.get("") 
  getAllProjects: () => api.get<ProjectsResponse>('/projects').then(res => res.data),

  // @router.get("?status={status}")
  getProjectsByStatus: (status: string) => api.get<ProjectsResponse>(`/projects?status=${status}`).then(res => res.data),
  

  // @router.get("/{project_id}")
  getProjectById: (projectId: string) => api.get<Project>(`/projects/${projectId}`).then(res => res.data),
  
  // @router.get("/completed-project")
  getCompletedProjectCount: () => api.get('/projects/completed-project').then(res => res.data),

  //  @router.get("/delay-project")
  getDelayedProjects: () => api.get('/projects/delay-project').then(res => res.data),

  // @router.get("/statuses")
  getProjectStatuses: () => api.get<string[]>('/statuses').then(res => res.data),



};