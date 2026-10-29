import { apiClient } from './client';
import { ApiResponse, Building, Project } from '../types';

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const res = await apiClient.get<ApiResponse<Project[]>>('/projects');
    return res.data.data;
  },

  getProjectById: async (id: number): Promise<Project> => {
    const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data.data;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return res.data.data;
  },

  updateProject: async (id: number, data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return res.data.data;
  },

  getBuildings: async (projectId: number): Promise<Building[]> => {
    const res = await apiClient.get<ApiResponse<Building[]>>(`/projects/${projectId}/buildings`);
    return res.data.data;
  },

  addBuilding: async (projectId: number, data: { name: string; floors: number }): Promise<Building> => {
    const res = await apiClient.post<ApiResponse<Building>>(`/projects/${projectId}/buildings`, { ...data, projectId });
    return res.data.data;
  },
};
