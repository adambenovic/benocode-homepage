// lib/api/gdpr.ts
import { apiClient } from './client';

export interface GDPRExportData {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    source: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  meetings: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    scheduledAt: string;
    duration: number;
    timezone: string;
    status: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  exportedAt: string;
}

export const gdprApi = {
  exportData: async (): Promise<{ data: GDPRExportData }> => {
    return apiClient.get<{ data: GDPRExportData }>('/gdpr/export');
  },

  deleteData: async (): Promise<{ data: { message: string } }> => {
    return apiClient.delete<{ data: { message: string } }>('/gdpr/delete');
  },
};

