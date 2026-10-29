import { apiClient } from './client';
import { ApiResponse, PropertyUnit } from '../types';

export interface UnitFilterParams {
  projectId?: number;
  buildingId?: number;
  unitType?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const unitsApi = {
  getUnits: async (params: UnitFilterParams = {}): Promise<PropertyUnit[]> => {
    const res = await apiClient.get<ApiResponse<PropertyUnit[]>>('/units', { params });
    return res.data.data;
  },

  getUnitById: async (id: number): Promise<PropertyUnit> => {
    const res = await apiClient.get<ApiResponse<PropertyUnit>>(`/units/${id}`);
    return res.data.data;
  },

  createUnit: async (data: Partial<PropertyUnit>): Promise<PropertyUnit> => {
    const res = await apiClient.post<ApiResponse<PropertyUnit>>('/units', data);
    return res.data.data;
  },

  updateUnit: async (id: number, data: Partial<PropertyUnit>): Promise<PropertyUnit> => {
    const res = await apiClient.put<ApiResponse<PropertyUnit>>(`/units/${id}`, data);
    return res.data.data;
  },

  deleteUnit: async (id: number): Promise<void> => {
    await apiClient.delete(`/units/${id}`);
  },

  bulkUpdateStatus: async (unitIds: number[], status: string): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/units/bulk-status', { unitIds, status });
    return res.data.data;
  },
};
