// lib/api/meetings.ts
import { apiClient } from './client';

export interface Meeting {
  id: string;
  email: string;
  name: string;
  phone?: string;
  scheduledAt: string;
  duration: number;
  timezone: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  confirmationToken: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  email: string;
  name: string;
  phone?: string;
  scheduledAt: string;
  duration?: number;
  timezone?: string;
  notes?: string;
}

export interface UpdateMeetingRequest {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
}

export interface AvailableSlot {
  time: string; // ISO datetime string
  duration?: number;
  // Backend also returns this format:
  date?: string; // YYYY-MM-DD
  available?: boolean;
}

export interface MeetingAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAvailabilityRequest {
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }>;
}

export interface MeetingsListResponse {
  data: Meeting[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const meetingsApi = {
  create: async (data: CreateMeetingRequest): Promise<{ data: Meeting }> => {
    return apiClient.post<{ data: Meeting }>('/meetings', data);
  },

  getAvailability: async (startDate: string, endDate: string): Promise<{ data: AvailableSlot[] }> => {
    return apiClient.get<{ data: AvailableSlot[] }>(
      `/meetings/availability?startDate=${startDate}&endDate=${endDate}`
    );
  },

  getAll: async (page?: number, limit?: number): Promise<MeetingsListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return apiClient.get<MeetingsListResponse>(`/admin/meetings${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ data: Meeting }> => {
    return apiClient.get<{ data: Meeting }>(`/admin/meetings/${id}`);
  },

  update: async (id: string, data: UpdateMeetingRequest): Promise<{ data: Meeting }> => {
    return apiClient.patch<{ data: Meeting }>(`/admin/meetings/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/meetings/${id}`);
  },

  getAvailabilityConfig: async (): Promise<{ data: MeetingAvailability[] }> => {
    return apiClient.get<{ data: MeetingAvailability[] }>('/admin/meetings/availability');
  },

  updateAvailability: async (data: UpdateAvailabilityRequest): Promise<{ data: { message: string } }> => {
    return apiClient.put<{ data: { message: string } }>('/admin/meetings/availability', data);
  },
};

