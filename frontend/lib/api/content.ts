// lib/api/content.ts
import { apiClient } from './client';

export interface ContentTranslation {
  locale: 'EN' | 'SK' | 'DE' | 'CZ';
  value: string;
}

export interface Content {
  key: string;
  type: 'TEXT' | 'RICH_TEXT' | 'HTML' | 'JSON';
  translations: ContentTranslation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentRequest {
  key: string;
  type: 'TEXT' | 'RICH_TEXT' | 'HTML' | 'JSON';
  translations: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    value: string;
  }>;
}

export interface UpdateContentRequest {
  type?: 'TEXT' | 'RICH_TEXT' | 'HTML' | 'JSON';
  translations?: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    value: string;
  }>;
}

export interface ContentListResponse {
  data: Content[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const contentApi = {
  getAll: async (locale?: string): Promise<{ data: Content[] }> => {
    const params = locale ? `?locale=${locale}` : '';
    return apiClient.get<{ data: Content[] }>(`/content${params}`);
  },

  getByKey: async (key: string, locale?: string): Promise<{ data: Content } | null> => {
    try {
      const params = locale ? `?locale=${locale}` : '';
      return await apiClient.get<{ data: Content }>(`/content/${key}${params}`);
    } catch {
      return null;
    }
  },

  getAllAdmin: async (page?: number, limit?: number): Promise<ContentListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return apiClient.get<ContentListResponse>(`/admin/content${query ? `?${query}` : ''}`);
  },

  create: async (data: CreateContentRequest): Promise<{ data: Content }> => {
    return apiClient.post<{ data: Content }>('/admin/content', data);
  },

  update: async (key: string, data: UpdateContentRequest): Promise<{ data: Content }> => {
    return apiClient.put<{ data: Content }>(`/admin/content/${key}`, data);
  },
};

