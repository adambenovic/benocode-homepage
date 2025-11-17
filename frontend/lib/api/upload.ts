// lib/api/upload.ts
import { apiClient } from './client';
import { API_CONSTANTS } from '@/lib/constants';

export interface UploadResponse {
  data: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
  };
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || API_CONSTANTS.DEFAULT_API_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
      headers: {
        // Don't set Content-Type, browser will set it with boundary
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return response.json();
  },
};

