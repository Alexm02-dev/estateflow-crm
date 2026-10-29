import { apiClient } from './client';
import { ApiResponse, Booking, PagedResponse } from '../types';

export interface BookingFormData {
  leadId: number;
  unitId: number;
  agreedPrice: number;
  bookingAmount: number;
  paymentMethod?: string;
  notes?: string;
}

export const bookingsApi = {
  getBookings: async (params: { status?: string; projectId?: number; page?: number; size?: number } = {}): Promise<PagedResponse<Booking>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<Booking>>>('/bookings', { params });
    return res.data.data;
  },

  getBookingById: async (id: number): Promise<Booking> => {
    const res = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return res.data.data;
  },

  createBooking: async (data: BookingFormData): Promise<Booking> => {
    const res = await apiClient.post<ApiResponse<Booking>>('/bookings', data);
    return res.data.data;
  },

  cancelBooking: async (id: number, reason: string): Promise<Booking> => {
    const res = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason });
    return res.data.data;
  },
};
