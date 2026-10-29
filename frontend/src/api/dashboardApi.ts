import { apiClient } from './client';
import { ApiResponse, DashboardAnalytics, DashboardSummary } from '../types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },

  getAnalytics: async (): Promise<DashboardAnalytics> => {
    const res = await apiClient.get<ApiResponse<DashboardAnalytics>>('/dashboard/analytics');
    return res.data.data;
  },
};
