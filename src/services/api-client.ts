// API Client for making HTTP requests to backend
import { API_BASE_URL } from '@/lib/config';
import { ApiError, ApiErrorType } from './api-error';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fields?: Record<string, string>; // Field-specific validation errors
}

class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Set CSRF token (called after login/signup)
   */
  setCsrfToken(token: string | null) {
    this.csrfToken = token;
  }

  /**
   * Get CSRF token from server if not available
   * Only attempts to fetch if we're likely authenticated (have cookies)
   */
  private async ensureCsrfToken(): Promise<string | null> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // Don't try to fetch CSRF token if we're not authenticated
    // CSRF protection only applies to authenticated requests
    // If the request fails with 401, it means we're not authenticated anyway
    // and CSRF protection won't be required
    
    // Try to get CSRF token from server (requires authentication)
    try {
      const response = await fetch(`${this.baseUrl}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Backend now returns 200 with null token if not authenticated (to avoid console errors)
        if (data.success && data.data?.csrfToken) {
          this.csrfToken = data.data.csrfToken;
          return this.csrfToken;
        }
        // If csrfToken is null, user is not authenticated - return null silently
        return null;
      }
      // Other errors are silently ignored - CSRF token will be fetched on next attempt
    } catch (error) {
      // Network errors are silently ignored - CSRF token will be fetched on next attempt
      // 401 is expected when not authenticated, so we don't log it
    }

    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Determine if this is a state-changing request that needs CSRF protection
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET');

    // Get CSRF token for state-changing requests
    let csrfToken = this.csrfToken;
    if (isStateChanging && !csrfToken) {
      csrfToken = await this.ensureCsrfToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token to headers for state-changing requests
    if (isStateChanging && csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    // Cookies are automatically sent with credentials: 'include'
    // No need to manually add Authorization header anymore

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies (httpOnly auth_token) in requests
      });

      const data: ApiResponse<T> = await response.json();

      // Handle CSRF token errors - try to refresh token and retry once
      if (response.status === 403 && isStateChanging && data.error && 
          (data.error.includes('CSRF') || data.error.includes('csrf'))) {
        // Clear current token and try to get a new one
        this.csrfToken = null;
        const newToken = await this.ensureCsrfToken();
        
        if (newToken) {
          // Retry the request with new CSRF token
          const retryHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
            'X-CSRF-Token': newToken,
          };
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          });
          
          const retryData: ApiResponse<T> = await retryResponse.json();
          
          if (!retryResponse.ok) {
            // Handle error response
            const errorMessage = retryData.error || retryData.message || 'Request failed';
            let errorType = ApiErrorType.SERVER_ERROR;

            switch (retryResponse.status) {
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

            throw new ApiError(errorType, errorMessage, retryResponse.status, undefined, retryData.fields);
          }

          if (!retryData.success) {
            throw new ApiError(
              ApiErrorType.SERVER_ERROR,
              retryData.error || 'Request failed',
              retryResponse.status,
              undefined,
              retryData.fields
            );
          }

          return retryData.data as T;
        }
      }

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

        throw new ApiError(errorType, errorMessage, response.status, undefined, data.fields);
      }

      if (!data.success) {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          data.error || 'Request failed',
          response.status,
          undefined,
          data.fields
        );
      }

      // Ensure we never return undefined - if data.data is undefined, return appropriate default
      if (data.data === undefined || data.data === null) {
        // For array types, return empty array; for other types, return null
        // We can't determine the type at runtime, so we'll return null
        // Individual services should handle this case
        return null as T;
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

