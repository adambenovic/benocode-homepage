// lib/api/leads.ts
import { apiClient } from './client';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED';
  source?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface UpdateLeadRequest {
  status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED';
}

export interface LeadsListResponse {
  data: Lead[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const leadsApi = {
  create: async (data: CreateLeadRequest): Promise<{ data: Lead }> => {
    return apiClient.post<{ data: Lead }>('/leads', data);
  },

  getAll: async (page?: number, limit?: number): Promise<LeadsListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return apiClient.get<LeadsListResponse>(`/admin/leads${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ data: Lead }> => {
    return apiClient.get<{ data: Lead }>(`/admin/leads/${id}`);
  },

  update: async (id: string, data: UpdateLeadRequest): Promise<{ data: Lead }> => {
    return apiClient.patch<{ data: Lead }>(`/admin/leads/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/leads/${id}`);
  },

  export: async (): Promise<Blob> => {
    const response = await apiClient.get('/admin/leads/export', {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};

