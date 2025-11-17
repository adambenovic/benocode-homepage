// lib/api/auth.ts
import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface CurrentUserResponse {
  data: User;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    // Tokens are now stored in httpOnly cookies by the server
    // No need to store in localStorage
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.clearAuth();
    }
  },

  refreshToken: async (refreshToken?: string): Promise<RefreshTokenResponse> => {
    // Refresh token is now in httpOnly cookie, but we can still pass it in body for compatibility
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken: refreshToken || '', // Empty string if not provided, server will use cookie
    });
    // Tokens are updated in httpOnly cookies by the server
    return response;
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return apiClient.get<CurrentUserResponse>('/auth/me');
  },
};

