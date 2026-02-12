// Authentication Context
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AuthState, LoginCredentials, SignupData, InviteData } from '@/types/auth';
import { authService } from '@/services/auth.service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthState | { requiresTwoFactor: true; userId: string; email: string; message: string }>;
  verifyTwoFactor: (userId: string, code: string) => Promise<AuthState>;
  resendTwoFactorCode: (userId: string) => Promise<{ message: string }>;
  signup: (data: SignupData) => Promise<void>;
  acceptInvite: (data: InviteData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tenant: null,
    token: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    authService.getCurrentAuth().then((auth) => {
      if (auth) {
        setAuthState(auth);
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      
      // Check if 2FA is required
      if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        // Return 2FA info instead of setting auth state
        return result;
      }
      
      // Normal login - set auth state
      setAuthState(result);
      // Navigation handled by the Login component
      return result;
    } catch (error) {
      throw error;
    }
  };

  const verifyTwoFactor = async (userId: string, code: string) => {
    try {
      const auth = await authService.verifyTwoFactor(userId, code);
      setAuthState(auth);
      // Navigation handled by the Login component
      return auth;
    } catch (error) {
      throw error;
    }
  };

  const resendTwoFactorCode = async (userId: string) => {
    try {
      const result = await authService.resendTwoFactorCode(userId);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const auth = await authService.signup(data);
      setAuthState(auth);
      // Navigation handled by the Signup component
    } catch (error) {
      throw error;
    }
  };

  const acceptInvite = async (data: InviteData) => {
    try {
      const auth = await authService.acceptInvite(data);
      setAuthState(auth);
      // Navigation handled by the AcceptInvite component
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setAuthState({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
    });
    // Navigation handled by the component calling logout
    window.location.href = '/login';
  };

  const hasRole = (roles: string[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        verifyTwoFactor,
        resendTwoFactorCode,
        signup,
        acceptInvite,
        logout,
        isLoading,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

