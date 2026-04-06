// lib/api/users.ts
import { apiClient } from './client';

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  invitePending: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface UserStatsResponse {
  total: number;
  admins: number;
  editors: number;
  active: number;
  inactive: number;
}

export interface UsersListResponse {
  data: UserResponse[];
  stats: UserStatsResponse;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  email: string;
  role: 'ADMIN' | 'EDITOR';
  method: 'password' | 'invite';
  password?: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'ADMIN' | 'EDITOR';
  isActive?: boolean;
  forcePasswordChange?: boolean;
  password?: string;
}

export const usersApi = {
  getAll: async (page?: number, limit?: number): Promise<UsersListResponse> => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return apiClient.get<UsersListResponse>(`/admin/users?${params.toString()}`);
  },

  getById: async (id: string): Promise<{ data: UserResponse }> => {
    return apiClient.get<{ data: UserResponse }>(`/admin/users/${id}`);
  },

  create: async (data: CreateUserRequest): Promise<{ data: UserResponse }> => {
    return apiClient.post<{ data: UserResponse }>('/admin/users', data);
  },

  update: async (id: string, data: UpdateUserRequest): Promise<{ data: UserResponse }> => {
    return apiClient.put<{ data: UserResponse }>(`/admin/users/${id}`, data);
  },

  deactivate: async (id: string): Promise<{ data: UserResponse }> => {
    return apiClient.patch<{ data: UserResponse }>(`/admin/users/${id}/deactivate`);
  },

  resendInvite: async (id: string): Promise<{ data: { message: string } }> => {
    return apiClient.post<{ data: { message: string } }>(`/admin/users/${id}/resend-invite`);
  },
};
