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

  update: async (slug: string, data: UpdateLegalPageRequest): Promise<{ data: LegalPage }> => {
    return apiClient.put<{ data: LegalPage }>(`/admin/legal-pages/${slug}`, data);
  },
};

