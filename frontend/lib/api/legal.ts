// lib/api/legal.ts
import { apiClient } from './client';

export interface LegalPage {
  slug: string;
  translations: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    title: string;
    content: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLegalPageRequest {
  slug: string;
  translations: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    title: string;
    content: string;
  }>;
}

export interface UpdateLegalPageRequest {
  translations: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    title: string;
    content: string;
  }>;
}

export const legalApi = {
  getBySlug: async (slug: string, locale?: string): Promise<{ data: LegalPage } | null> => {
    try {
      const params = locale ? `?locale=${locale}` : '';
      return await apiClient.get<{ data: LegalPage }>(`/legal/${slug}${params}`);
    } catch {
      return null;
    }
  },

  getAll: async (): Promise<{ data: LegalPage[] }> => {
    return apiClient.get<{ data: LegalPage[] }>('/admin/legal-pages');
  },

  create: async (data: CreateLegalPageRequest): Promise<{ data: LegalPage }> => {
    return apiClient.post<{ data: LegalPage }>('/admin/legal-pages', data);
  },

  update: async (slug: string, data: UpdateLegalPageRequest): Promise<{ data: LegalPage }> => {
    return apiClient.put<{ data: LegalPage }>(`/admin/legal-pages/${slug}`, data);
  },

  delete: async (slug: string): Promise<void> => {
    return apiClient.delete(`/admin/legal-pages/${slug}`);
  },
};

