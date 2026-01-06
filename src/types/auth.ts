// Authentication and User Types

export type UserRole = 'admin' | 'client' | 'reseller' | 'driver';
export type UserStatus = 'pending' | 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus; // New signups start as 'pending', approved users are 'active'
  tenantId: string;
  tenantName: string;
  avatar?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  accentColor?: string;
  theme?: 'light' | 'dark' | 'auto';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  role?: 'client' | 'reseller';
}

export interface InviteData {
  inviteToken: string;
  email: string;
  name: string;
  password: string;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token?: string;
  status?: 'pending' | 'accepted' | 'expired';
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

