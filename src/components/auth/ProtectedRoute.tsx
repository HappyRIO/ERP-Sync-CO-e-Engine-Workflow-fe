// Protected Route Component
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow pending users to VIEW pages but show banner and disable controls
  const isPending = user && user.status === 'pending' && user.role !== 'admin';
  const isSettingsPage = location.pathname === '/settings';
  // Don't disable sidebar and settings page
  const shouldDisableContent = isPending && !isSettingsPage;

  if (allowedRoles && user && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={shouldDisableContent ? '[&_aside]:pointer-events-auto [&_aside]:opacity-100 [&_[data-sidebar]]:pointer-events-auto [&_[data-sidebar]]:opacity-100 [&_[data-main-content]]:pointer-events-none [&_[data-main-content]]:opacity-60' : ''}>
      {children}
    </div>
  );
}

