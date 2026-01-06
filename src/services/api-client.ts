// API Client for making HTTP requests to backend
import { API_BASE_URL } from '@/lib/config';
import { ApiError, ApiErrorType } from './api-error';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorMessage = data.error || data.message || 'Request failed';
        let errorType = ApiErrorType.SERVER_ERROR;

        switch (response.status) {
          case 400:
            errorType = ApiErrorType.VALIDATION_ERROR;
            break;
          case 401:
            errorType = ApiErrorType.UNAUTHORIZED;
            break;
          case 403:
            errorType = ApiErrorType.FORBIDDEN;
            break;
          case 404:
            errorType = ApiErrorType.NOT_FOUND;
            break;
          case 429:
            errorType = ApiErrorType.RATE_LIMIT;
            break;
          case 408:
            errorType = ApiErrorType.TIMEOUT;
            break;
        }

        throw new ApiError(errorType, errorMessage, response.status);
      }

      if (!data.success) {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          data.error || 'Request failed',
          response.status
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          ApiErrorType.NETWORK_ERROR,
          'Network error. Please check your connection and try again.',
          0
        );
      }

      throw new ApiError(
        ApiErrorType.SERVER_ERROR,
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

