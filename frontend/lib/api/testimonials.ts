// lib/api/testimonials.ts
import { apiClient } from './client';

export interface TestimonialTranslation {
  locale: 'EN' | 'SK' | 'DE' | 'CZ';
  author: string;
  content: string;
  company?: string;
  position?: string;
}

export interface Testimonial {
  id: string;
  translations: TestimonialTranslation[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialRequest {
  translations: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    author: string;
    content: string;
    company?: string;
    position?: string;
  }>;
  isActive?: boolean;
}

export interface UpdateTestimonialRequest {
  translations?: Array<{
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    author: string;
    content: string;
    company?: string;
    position?: string;
  }>;
  isActive?: boolean;
}

export interface UpdateOrderRequest {
  order: number;
}

export interface TestimonialsListResponse {
  data: Testimonial[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const testimonialsApi = {
  getAll: async (locale?: string): Promise<{ data: Testimonial[] }> => {
    const params = locale ? `?locale=${locale}` : '';
    return apiClient.get<{ data: Testimonial[] }>(`/testimonials${params}`);
  },

  getAllAdmin: async (page?: number, limit?: number): Promise<TestimonialsListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return apiClient.get<TestimonialsListResponse>(`/admin/testimonials${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ data: Testimonial }> => {
    return apiClient.get<{ data: Testimonial }>(`/admin/testimonials/${id}`);
  },

  create: async (data: CreateTestimonialRequest): Promise<{ data: Testimonial }> => {
    return apiClient.post<{ data: Testimonial }>('/admin/testimonials', data);
  },

  update: async (id: string, data: UpdateTestimonialRequest): Promise<{ data: Testimonial }> => {
    return apiClient.put<{ data: Testimonial }>(`/admin/testimonials/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/testimonials/${id}`);
  },

  updateOrder: async (id: string, order: number): Promise<{ data: Testimonial }> => {
    return apiClient.patch<{ data: Testimonial }>(`/admin/testimonials/${id}/order`, { order });
  },
};

