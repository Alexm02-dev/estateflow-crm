import { apiClient } from './client';
import { ApiResponse, FollowUp, PagedResponse } from '../types';

export const followUpsApi = {
  getFollowUps: async (params: { status?: string; assignedToId?: number; overdueOnly?: boolean; page?: number; size?: number } = {}): Promise<PagedResponse<FollowUp>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<FollowUp>>>('/follow-ups', { params });
    return res.data.data;
  },

  getFollowUpsForLead: async (leadId: number): Promise<FollowUp[]> => {
    const res = await apiClient.get<ApiResponse<FollowUp[]>>(`/follow-ups/lead/${leadId}`);
    return res.data.data;
  },

  createFollowUp: async (data: { leadId: number; assignedToId?: number; scheduledAt: string; notes?: string }): Promise<FollowUp> => {
    const res = await apiClient.post<ApiResponse<FollowUp>>('/follow-ups', data);
    return res.data.data;
  },

  completeFollowUp: async (id: number, data: { completionNotes: string }): Promise<FollowUp> => {
    const res = await apiClient.post<ApiResponse<FollowUp>>(`/follow-ups/${id}/complete`, data);
    return res.data.data;
  },
};
