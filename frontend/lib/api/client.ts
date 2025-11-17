// lib/api/client.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { API_CONSTANTS } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || API_CONSTANTS.DEFAULT_API_URL;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add CSRF token (auth token is in httpOnly cookie)
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Auth token is now in httpOnly cookie, browser sends it automatically
        // We only need to add CSRF token for state-changing requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
          const csrfToken = this.getCsrfToken();
          if (csrfToken && config.headers) {
            config.headers['X-CSRF-Token'] = csrfToken;
            // Also try lowercase header name (some servers expect lowercase)
            config.headers['x-csrf-token'] = csrfToken;
          } else {
            // If no CSRF token available, log warning (but don't block - let backend handle it)
            console.warn('CSRF token not available for', config.method, config.url);
            console.warn('SessionStorage contents:', {
              csrf_token: sessionStorage.getItem('csrf_token'),
              allKeys: Object.keys(sessionStorage),
            });
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and CSRF tokens
    this.client.interceptors.response.use(
      (response) => {
        // Store CSRF token from response header
        // Axios normalizes headers to lowercase, so check 'x-csrf-token'
        // But also check the raw headers object which might have original case
        const csrfToken = response.headers['x-csrf-token'] 
          || (response.headers as any)['X-CSRF-Token']
          || (response.headers as any).get?.('X-CSRF-Token');
          
        if (csrfToken && typeof window !== 'undefined') {
          sessionStorage.setItem('csrf_token', csrfToken);
          console.log('CSRF token stored:', csrfToken.substring(0, 20) + '...');
        } else if (typeof window !== 'undefined') {
          // Log available headers for debugging
          const allHeaders = Object.keys(response.headers);
          const csrfHeaders = allHeaders.filter(h => h.toLowerCase().includes('csrf'));
          console.log('No CSRF token found. Response headers:', {
            allHeaders: allHeaders.slice(0, 10),
            csrfHeaders,
            responseHeaders: response.headers,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
            window.location.href = '/admin/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    // Tokens are now in httpOnly cookies, so we don't need to read from localStorage
    // The Authorization header will be set automatically by the browser with cookies
    return null;
  }

  private getCsrfToken(): string | null {
    if (typeof window === 'undefined') return null;
    // CSRF token comes from server response header X-CSRF-Token
    // Store it temporarily for the request
    const token = sessionStorage.getItem('csrf_token');
    if (!token) {
      console.warn('CSRF token not found in sessionStorage');
    }
    return token;
  }

  setAuthToken(token: string): void {
    // Tokens are now in httpOnly cookies, no need to store in localStorage
    // This method is kept for backward compatibility but does nothing
  }

  clearAuth(): void {
    // Tokens are cleared server-side via logout endpoint
    // Clear any client-side storage if needed
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('csrf_token');
    }
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
