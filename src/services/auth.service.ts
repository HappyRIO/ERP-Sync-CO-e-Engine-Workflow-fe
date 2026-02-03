// Authentication Service
import type { 
  User, 
  Tenant, 
  AuthState, 
  LoginCredentials, 
  SignupData, 
  InviteData,
  Invite 
} from '@/types/auth';
import { ApiError, ApiErrorType } from './api-error';
import { apiClient } from './api-client';

class AuthService {
  private currentUser: User | null = null;
  private currentTenant: Tenant | null = null;

  async login(credentials: LoginCredentials): Promise<AuthState> {
    const response = await apiClient.post<{
      user: User;
      tenant: Tenant;
      csrfToken?: string;
      // Token is now in httpOnly cookie, not in response
    }>('/auth/login', credentials);

    this.currentUser = response.user;
    this.currentTenant = response.tenant;

    // Store CSRF token for subsequent requests
    // The response structure is: { user, tenant, csrfToken }
    if (response.csrfToken) {
      apiClient.setCsrfToken(response.csrfToken);
    } else {
      // If CSRF token not in response, try to fetch it
      try {
        const csrfResponse = await apiClient.get<{ csrfToken: string }>('/auth/csrf-token');
        if (csrfResponse.csrfToken) {
          apiClient.setCsrfToken(csrfResponse.csrfToken);
        }
      } catch (error) {
        console.warn('Failed to fetch CSRF token after login:', error);
      }
    }

    // Token is stored in httpOnly cookie automatically by backend
    // No need to store in localStorage (more secure)

    return {
      user: response.user,
      tenant: response.tenant,
      token: null, // Token is in httpOnly cookie, not accessible to JavaScript
      isAuthenticated: true,
    };
  }

  async signup(data: SignupData): Promise<AuthState> {
    const response = await apiClient.post<{
      user: User;
      tenant: Tenant;
      csrfToken?: string;
      // Token is now in httpOnly cookie, not in response
    }>('/auth/signup', data);

    this.currentUser = response.user;
    this.currentTenant = response.tenant;

    // Store CSRF token for subsequent requests
    if (response.csrfToken) {
      apiClient.setCsrfToken(response.csrfToken);
    }

    // Token is stored in httpOnly cookie automatically by backend
    // No need to store in localStorage (more secure)

    return {
      user: response.user,
      tenant: response.tenant,
      token: null, // Token is in httpOnly cookie, not accessible to JavaScript
      isAuthenticated: true,
    };
  }

  async acceptInvite(inviteData: InviteData): Promise<AuthState> {
    const result = await apiClient.post<{
      user: User;
      tenant: Tenant;
      csrfToken?: string;
      // Token is now in httpOnly cookie, not in response
    }>('/invites/accept', {
      inviteToken: inviteData.inviteToken,
      email: inviteData.email,
      name: inviteData.name,
      password: inviteData.password,
    });

    this.currentUser = result.user;
    this.currentTenant = result.tenant;

    // Store CSRF token for subsequent requests
    if (result.csrfToken) {
      apiClient.setCsrfToken(result.csrfToken);
    }

    // Token is stored in httpOnly cookie automatically by backend
    // No need to store in localStorage (more secure)

    return {
      user: result.user,
      tenant: result.tenant,
      token: null, // Token is in httpOnly cookie, not accessible to JavaScript
      isAuthenticated: true,
    };
  }

  async getInvite(token: string): Promise<Invite | null> {
    try {
      const invite = await apiClient.get<Invite>(`/invites/token/${token}`);
      return invite;
    } catch (error) {
      if (error instanceof ApiError && error.type === ApiErrorType.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  async createInvite(email: string, role: 'client' | 'reseller' | 'driver', invitedBy: string, tenantId: string, tenantName: string): Promise<Invite> {
    const invite = await apiClient.post<Invite>('/invites', {
      email,
      role,
    });
    return invite;
  }

  async listInvites(status?: 'pending' | 'accepted' | 'expired', role?: 'client' | 'reseller' | 'driver'): Promise<Invite[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);
    const queryString = params.toString();
    const invites = await apiClient.get<Invite[]>(`/invites${queryString ? `?${queryString}` : ''}`);
    return invites;
  }

  async cancelInvite(inviteId: string): Promise<void> {
    await apiClient.delete(`/invites/${inviteId}`);
  }

  async logout(): Promise<void> {
    // Call backend logout endpoint to clear httpOnly cookie
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
    }
    
    this.currentUser = null;
    this.currentTenant = null;
    apiClient.setCsrfToken(null); // Clear CSRF token on logout
    // No need to clear localStorage - we're not using it anymore
  }

  async getCurrentAuth(): Promise<AuthState | null> {
    // No need to check localStorage - token is in httpOnly cookie
    // Just try to get current user - if cookie is valid, it will work
    
    try {
      const response = await apiClient.get<{ user: User; csrfToken?: string }>('/auth/me');
      const user = response.user;
      
      // Store CSRF token if provided
      if (response.csrfToken) {
        apiClient.setCsrfToken(response.csrfToken);
      } else {
        // If CSRF token not in response, try to fetch it separately
        try {
          const csrfResponse = await apiClient.get<{ csrfToken: string }>('/auth/csrf-token');
          if (csrfResponse.csrfToken) {
            apiClient.setCsrfToken(csrfResponse.csrfToken);
          }
        } catch (csrfError) {
          // If we can't get CSRF token, it's okay - we'll get it on next POST request
          console.warn('Failed to fetch CSRF token:', csrfError);
        }
      }
      
      // Get tenant info (would be included in response in real implementation)
      // For now, we'll need to get it from the user object or make another call
      const tenant: Tenant = {
        id: user.tenantId,
        name: user.tenantName,
        slug: user.tenantId, // Would come from backend
        createdAt: user.createdAt,
      };

      this.currentUser = user;
      this.currentTenant = tenant;

      return {
        user,
        tenant,
        token: null, // Token is in httpOnly cookie, not accessible to JavaScript
        isAuthenticated: true,
      };
    } catch (error) {
      // If unauthorized, clear local state
      // Cookie will be automatically rejected by browser if invalid
      if (error instanceof ApiError && error.statusCode === 401) {
        this.currentUser = null;
        this.currentTenant = null;
        apiClient.setCsrfToken(null); // Clear CSRF token on logout
      }
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
}

export const authService = new AuthService();
