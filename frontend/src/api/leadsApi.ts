import { apiClient } from './client';
import { ApiResponse, Lead, LeadActivity, PagedResponse } from '../types';

export interface LeadFilterParams {
  search?: string;
  stage?: string;
  source?: string;
  assignedToId?: number;
  projectId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface LeadFormData {
  fullName: string;
  phone: string;
  email?: string;
  leadSource: string;
  interestedProjectId?: number;
  budget?: number;
  assignedToId?: number;
  stage?: string;
  nextFollowUpDate?: string;
  notes?: string;
}

export const leadsApi = {
  getLeads: async (params: LeadFilterParams = {}): Promise<PagedResponse<Lead>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Lead>>>('/leads', { params });
    return res.data.data;
  },

  getLeadById: async (id: number): Promise<Lead> => {
    const res = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return res.data.data;
  },

  createLead: async (data: LeadFormData): Promise<Lead> => {
    const res = await apiClient.post<ApiResponse<Lead>>('/leads', data);
    return res.data.data;
  },

  updateLead: async (id: number, data: LeadFormData): Promise<Lead> => {
    const res = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, data);
    return res.data.data;
  },

  deleteLead: async (id: number): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  getLeadActivities: async (id: number): Promise<LeadActivity[]> => {
    const res = await apiClient.get<ApiResponse<LeadActivity[]>>(`/leads/${id}/activities`);
    return res.data.data;
  },

  addLeadActivity: async (id: number, data: { type: string; description: string }): Promise<LeadActivity> => {
    const res = await apiClient.post<ApiResponse<LeadActivity>>(`/leads/${id}/activities`, data);
    return res.data.data;
  },

  bulkAssign: async (leadIds: number[], assignedToId: number): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/leads/bulk-assign', { leadIds, assignedToId });
    return res.data.data;
  },

  bulkStage: async (leadIds: number[], stage: string): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/leads/bulk-stage', { leadIds, stage });
    return res.data.data;
  },

  bulkDelete: async (ids: number[]): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/leads/bulk-delete', { ids });
    return res.data.data;
  },
};
