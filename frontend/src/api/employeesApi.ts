import { apiClient } from './client';
import { ApiResponse, User } from '../types';

export const employeesApi = {
  getAllEmployees: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/employees');
    return res.data.data;
  },

  getSalesEmployees: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/employees/sales');
    return res.data.data;
  },

  createEmployee: async (data: Partial<User> & { password?: string }): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/employees', data);
    return res.data.data;
  },

  updateEmployee: async (id: number, data: Partial<User> & { password?: string }): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/employees/${id}`, data);
    return res.data.data;
  },

  bulkUpdateStatus: async (employeeIds: number[], active: boolean): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/employees/bulk-status', { employeeIds, active });
    return res.data.data;
  },
};
