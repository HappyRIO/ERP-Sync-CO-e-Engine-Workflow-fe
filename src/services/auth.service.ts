// Mock Authentication Service
import type { 
  User, 
  Tenant, 
  AuthState, 
  LoginCredentials, 
  SignupData, 
  InviteData,
  Invite 
} from '@/types/auth';

// Mock storage for demo
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@reuse.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    tenantId: 'tenant-1',
    tenantName: 'Reuse ITAD Platform',
    createdAt: '2024-01-01',
  },
  {
    id: 'user-2',
    email: 'client@techcorp.com',
    name: 'Client User',
    role: 'client',
    status: 'active',
    tenantId: 'tenant-2',
    tenantName: 'TechCorp Industries',
    createdAt: '2024-01-15',
  },
  {
    id: 'user-3',
    email: 'reseller@partner.com',
    name: 'Reseller User',
    role: 'reseller',
    status: 'active',
    tenantId: 'tenant-3',
    tenantName: 'Partner Solutions',
    createdAt: '2024-02-01',
  },
  {
    id: 'user-4',
    email: 'driver@reuse.com',
    name: 'James Wilson',
    role: 'driver',
    status: 'active',
    tenantId: 'tenant-1',
    tenantName: 'Reuse ITAD Platform',
    createdAt: '2024-03-01',
  },
];

const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Reuse ITAD Platform',
    slug: 'reuse',
    primaryColor: '168, 70%, 35%',
    accentColor: '168, 60%, 45%',
    theme: 'auto',
    createdAt: '2024-01-01',
  },
  {
    id: 'tenant-2',
    name: 'TechCorp Industries',
    slug: 'techcorp',
    primaryColor: '221, 83%, 53%',
    accentColor: '221, 73%, 63%',
    theme: 'light',
    createdAt: '2024-01-15',
  },
  {
    id: 'tenant-3',
    name: 'Partner Solutions',
    slug: 'partner',
    primaryColor: '280, 70%, 50%',
    accentColor: '280, 60%, 60%',
    theme: 'light',
    createdAt: '2024-02-01',
  },
];

const mockInvites: Invite[] = [
  {
    id: 'invite-1',
    email: 'newuser@techcorp.com',
    role: 'client',
    tenantId: 'tenant-2',
    tenantName: 'TechCorp Industries',
    invitedBy: 'user-2',
    invitedAt: '2024-12-01',
    expiresAt: '2024-12-15',
  },
];

// Simulate API delay
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import { apiClient } from './api-client';

const SERVICE_NAME = 'auth';

class AuthService {
  private currentUser: User | null = null;
  private currentTenant: Tenant | null = null;
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<AuthState> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.loginAPI(credentials);
    }

    await delay(1000);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NETWORK_ERROR) {
        throw new ApiError(
          ApiErrorType.NETWORK_ERROR,
          'Network error. Please check your connection and try again.',
          0
        );
      }
      if (config.errorType === ApiErrorType.RATE_LIMIT) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT,
          'Too many login attempts. Please wait a moment and try again.',
          429,
          { retryAfter: 60 }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Login failed. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }
    
    // Validate input
    if (!credentials.email || !credentials.password) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Email and password are required.',
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Please enter a valid email address.',
        400
      );
    }
    
    const user = mockUsers.find(u => u.email === credentials.email);
    if (!user || credentials.password !== 'password') {
      throw new ApiError(
        ApiErrorType.UNAUTHORIZED,
        'Invalid email or password. Please check your credentials and try again.',
        401
      );
    }

    const tenant = mockTenants.find(t => t.id === user.tenantId);
    this.currentUser = user;
    this.currentTenant = tenant || null;
    this.token = `mock-token-${user.id}`;

    // Store in localStorage for persistence
    localStorage.setItem('auth_token', this.token);
    localStorage.setItem('user_id', user.id);

    return {
      user,
      tenant: tenant || null,
      token: this.token,
      isAuthenticated: true,
    };
  }

  async signup(data: SignupData): Promise<AuthState> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.signupAPI(data);
    }

    await delay(1500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to create account. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Validate input
    if (!data.email || !data.password || !data.name || !data.companyName) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'All fields are required.',
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Please enter a valid email address.',
        400
      );
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Password must be at least 8 characters long.',
        400
      );
    }

    // New signups (both client and reseller) start with 'pending' status
    // They will have limited access until admin approves them

    // Check if user already exists
    if (mockUsers.some(u => u.email === data.email)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'An account with this email already exists. Please use a different email or try logging in.',
        409
      );
    }

    // Create new tenant
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: data.companyName,
      slug: data.companyName.toLowerCase().replace(/\s+/g, '-'),
      primaryColor: '168, 70%, 35%',
      accentColor: '168, 60%, 45%',
      theme: 'auto',
      createdAt: new Date().toISOString(),
    };

    // Create new user with 'pending' status (requires admin approval)
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role || 'client',
      status: 'pending', // New signups are pending until admin approves
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    mockTenants.push(newTenant);

    // Also add to ExtendedUsers for admin management
    const { mockExtendedUsers } = await import('@/mocks/mock-entities');
    mockExtendedUsers.push({
      ...newUser,
      isActive: false, // Pending users are inactive until approved
      status: 'pending',
    });

    this.currentUser = newUser;
    this.currentTenant = newTenant;
    this.token = `mock-token-${newUser.id}`;

    localStorage.setItem('auth_token', this.token);
    localStorage.setItem('user_id', newUser.id);

    return {
      user: newUser,
      tenant: newTenant,
      token: this.token,
      isAuthenticated: true,
    };
  }

  async acceptInvite(inviteData: InviteData): Promise<AuthState> {
    if (!USE_MOCK_API) {
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

    await delay(1500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to accept invite. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Validate input
    if (!inviteData.inviteToken || !inviteData.email || !inviteData.name || !inviteData.password) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'All fields are required.',
        400
      );
    }

    const invite = mockInvites.find(i => i.id === inviteData.inviteToken);
    if (!invite || invite.email !== inviteData.email) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        'Invalid or expired invite. Please check your invite link and try again.',
        404
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'This invite has expired. Please request a new invite.',
        400,
        { expiresAt: invite.expiresAt }
      );
    }

    // Check if invite was already accepted
    if (invite.acceptedAt) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'This invite has already been accepted.',
        400
      );
    }

    const tenant = mockTenants.find(t => t.id === invite.tenantId);
    if (!tenant) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        'Tenant not found. Please contact support.',
        404
      );
    }

    // Validate password strength
    if (inviteData.password.length < 8) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Password must be at least 8 characters long.',
        400
      );
    }

    // Users who accept invitations are automatically approved (active status)
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: inviteData.email,
      name: inviteData.name,
      role: invite.role,
      status: 'active', // Invited users are auto-approved
      tenantId: invite.tenantId,
      tenantName: invite.tenantName,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    invite.acceptedAt = new Date().toISOString();

    // Also add to ExtendedUsers (invited users are auto-approved)
    const { mockExtendedUsers } = await import('@/mocks/mock-entities');
    mockExtendedUsers.push({
      ...newUser,
      isActive: true,
      status: 'active',
      invitedBy: invite.invitedBy,
    });

    this.currentUser = newUser;
    this.currentTenant = tenant;
    this.token = `mock-token-${newUser.id}`;

    localStorage.setItem('auth_token', this.token);
    localStorage.setItem('user_id', newUser.id);

    return {
      user: newUser,
      tenant,
      token: this.token,
      isAuthenticated: true,
    };
  }

  async getInvite(token: string): Promise<Invite | null> {
    if (!USE_MOCK_API) {
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

    await delay(500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          'Invite not found or has expired.',
          404,
          { token }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to load invite. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const invite = mockInvites.find(i => i.id === token);
    
    if (!invite) {
      return null;
    }

    // Check if expired
    if (new Date(invite.expiresAt) < new Date()) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'This invite has expired.',
        400,
        { expiresAt: invite.expiresAt }
      );
    }

    return invite;
  }

  async createInvite(email: string, role: 'client' | 'reseller' | 'driver', invitedBy: string, tenantId: string, tenantName: string): Promise<Invite> {
    if (!USE_MOCK_API) {
      const invite = await apiClient.post<Invite>('/invites', {
        email,
        role,
      });
      return invite;
    }

    await delay(800);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to create invite. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Invalid email format.',
        400
      );
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'A user with this email already exists.',
        400
      );
    }

    // Check if invite already exists and is not expired
    const existingInvite = mockInvites.find(
      i => i.email === email && 
      i.tenantId === tenantId && 
      !i.acceptedAt && 
      new Date(i.expiresAt) > new Date()
    );
    if (existingInvite) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'An active invite already exists for this email.',
        400
      );
    }

    // Create new invite
    const newInvite: Invite = {
      id: `invite-${Date.now()}`,
      email,
      role,
      tenantId,
      tenantName,
      invitedBy,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    };

    mockInvites.push(newInvite);

    return newInvite;
  }

  async listInvites(status?: 'pending' | 'accepted' | 'expired', role?: 'client' | 'reseller' | 'driver'): Promise<Invite[]> {
    if (!USE_MOCK_API) {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (role) params.append('role', role);
      const queryString = params.toString();
      const invites = await apiClient.get<Invite[]>(`/invites${queryString ? `?${queryString}` : ''}`);
      return invites;
    }

    // Mock implementation
    await delay(500);
    let filtered = [...mockInvites];
    
    // Filter by role if provided
    if (role) {
      filtered = filtered.filter(i => i.role === role);
    }
    
    if (status === 'pending') {
      filtered = filtered.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date());
    } else if (status === 'accepted') {
      filtered = filtered.filter(i => !!i.acceptedAt);
    } else if (status === 'expired') {
      filtered = filtered.filter(i => !i.acceptedAt && new Date(i.expiresAt) < new Date());
    }

    return filtered;
  }

  async cancelInvite(inviteId: string): Promise<void> {
    if (!USE_MOCK_API) {
      await apiClient.delete(`/invites/${inviteId}`);
      return;
    }

    // Mock implementation
    await delay(300);
    const index = mockInvites.findIndex(i => i.id === inviteId);
    if (index !== -1) {
      mockInvites.splice(index, 1);
    }
  }

  async logout(): Promise<void> {
    await delay(300);
    this.currentUser = null;
    this.currentTenant = null;
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  async getCurrentAuth(): Promise<AuthState | null> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getCurrentAuthAPI();
    }

    await delay(300);

    // Simulate errors (less common for auth check)
    if (shouldSimulateError(SERVICE_NAME) && Math.random() < 0.1) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to verify authentication. Please log in again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }
    
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
      return null;
    }

    let user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return null;
    }

    // Sync status from ExtendedUsers if available (for pending users)
    try {
      const { mockExtendedUsers } = await import('@/mocks/mock-entities');
      const extendedUser = mockExtendedUsers.find(u => u.id === userId);
      if (extendedUser && extendedUser.status) {
        // Update status in user object
        user = { ...user, status: extendedUser.status };
        // Also update in mockUsers array for consistency
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          mockUsers[userIndex] = user;
        }
      }
    } catch (error) {
      // If ExtendedUsers not available, continue with existing user
    }

    const tenant = mockTenants.find(t => t.id === user.tenantId);
    this.currentUser = user;
    this.currentTenant = tenant || null;
    this.token = token;

    return {
      user,
      tenant: tenant || null,
      token,
      isAuthenticated: true,
    };
  }

  private async getCurrentAuthAPI(): Promise<AuthState | null> {
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

  // Real API implementations
  private async loginAPI(credentials: LoginCredentials): Promise<AuthState> {
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

  private async signupAPI(data: SignupData): Promise<AuthState> {
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

  private async getCurrentAuthAPI(): Promise<AuthState | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      
      // Get tenant from user data or fetch separately
      const user = response.user;
      const tenant = this.currentTenant || {
        id: user.tenantId,
        name: user.tenantName,
        slug: user.tenantName.toLowerCase().replace(/\s+/g, '-'),
        createdAt: user.createdAt,
      } as Tenant;

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
      // If token is invalid, clear it
      if (error instanceof ApiError && error.statusCode === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
      }
      return null;
    }
  }
}

export const authService = new AuthService();

