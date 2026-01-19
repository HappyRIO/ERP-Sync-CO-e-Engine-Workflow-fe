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
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<AuthState> {
    const response = await apiClient.post<{
      user: User;
      tenant: Tenant;
      token: string;
    }>('/auth/login', credentials);

    this.currentUser = response.user;
    this.currentTenant = response.tenant;
    this.token = response.token;

    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_id', response.user.id);

    return {
      user: response.user,
      tenant: response.tenant,
      token: response.token,
      isAuthenticated: true,
    };
  }

  async signup(data: SignupData): Promise<AuthState> {
    const response = await apiClient.post<{
      user: User;
      tenant: Tenant;
      token: string;
    }>('/auth/signup', data);

    this.currentUser = response.user;
    this.currentTenant = response.tenant;
    this.token = response.token;

    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_id', response.user.id);

    return {
      user: response.user,
      tenant: response.tenant,
      token: response.token,
      isAuthenticated: true,
    };
  }

  async acceptInvite(inviteData: InviteData): Promise<AuthState> {
    const result = await apiClient.post<{
      user: User;
      token: string;
      tenant: Tenant;
    }>('/invites/accept', {
      inviteToken: inviteData.inviteToken,
      email: inviteData.email,
      name: inviteData.name,
      password: inviteData.password,
    });

    this.currentUser = result.user;
    this.currentTenant = result.tenant;
    this.token = result.token;

    localStorage.setItem('auth_token', this.token);
    localStorage.setItem('user_id', result.user.id);

    return {
      user: result.user,
      tenant: result.tenant,
      token: this.token,
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
    this.currentUser = null;
    this.currentTenant = null;
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  async getCurrentAuth(): Promise<AuthState | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      const user = response.user;
      
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
      this.token = token;

      return {
        user,
        tenant,
        token,
        isAuthenticated: true,
      };
    } catch (error) {
      // If unauthorized, clear stored auth
      if (error instanceof ApiError && error.statusCode === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        this.currentUser = null;
        this.currentTenant = null;
        this.token = null;
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
