// lib/api/client.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { API_CONSTANTS } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || API_CONSTANTS.DEFAULT_API_URL;

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<() => void> = [];

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

  private onRefreshed() {
    this.refreshSubscribers.forEach((callback) => callback());
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: () => void) {
    this.refreshSubscribers.push(callback);
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
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt refresh for the refresh endpoint itself or the login endpoint
          const url = originalRequest.url || '';
          if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
            this.clearAuth();
            this.redirectToLogin();
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Queue this request until the refresh completes
            return new Promise((resolve) => {
              this.addRefreshSubscriber(() => {
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.client.post('/auth/refresh', {});
            this.isRefreshing = false;
            this.onRefreshed();
            return this.client(originalRequest);
          } catch {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            this.clearAuth();
            this.redirectToLogin();
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getCsrfToken(): string | null {
    if (typeof window === 'undefined') return null;
    // CSRF token comes from server response header X-CSRF-Token
    // Store it temporarily for the request
    return sessionStorage.getItem('csrf_token');
  }

  setAuthToken(_token: string): void {
    // Tokens are now in httpOnly cookies, no need to store in localStorage
    // This method is kept for backward compatibility but does nothing
  }

  clearAuth(): void {
    // Tokens are cleared server-side via logout endpoint
    // Clear any client-side storage if needed
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('csrf_token');
      // Clear persisted auth state so stale localStorage doesn't cause redirect loops
      localStorage.removeItem('auth-storage');
    }
  }

  private redirectToLogin(): void {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
      window.location.href = '/admin/login';
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
