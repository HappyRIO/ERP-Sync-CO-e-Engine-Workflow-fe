// Protected Route Component
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDriver } from '@/hooks/useDrivers';
import { useClientProfile } from '@/hooks/useClients';
import { useOrganisationProfileComplete } from '@/hooks/useOrganisationProfile';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}


export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();
  const isDriver = user?.role === 'driver';
  const isClient = user?.role === 'client';
  const isReseller = user?.role === 'reseller';
  const isSettingsPage = location.pathname === '/settings';
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isAcceptInvitePage = location.pathname.startsWith('/accept-invite');

  // Check driver profile completeness (only for drivers)
  const { data: driverProfile, isLoading: isLoadingDriverProfile } = useDriver(
    isDriver ? user?.id || null : null
  );
  // For non-drivers, isLoadingDriverProfile will be false (query is disabled)

  // Check client profile completeness (only for clients)
  const { data: clientProfile, isLoading: isLoadingClientProfile } = useClientProfile();
  // For non-clients, isLoadingClientProfile will be false (query is disabled)
  
  // Check organisation profile completeness for resellers only (admins don't need this check)
  const { data: isResellerProfileComplete, isLoading: isLoadingResellerProfile } = useOrganisationProfileComplete(isReseller);
  // For non-resellers, isLoadingResellerProfile will be false (query is disabled)
  const hasIncompleteResellerProfile = isReseller && !isResellerProfileComplete;

  // Only show loading spinner if:
  // 1. Auth is loading
  // 2. Driver profile is loading (and user is driver, not on settings page)
  // 3. Client profile is loading (and user is client, not on settings page)
  // 4. Reseller profile is loading (and user is reseller, not on settings page)
  // Note: For admins, none of these conditions should be true, so page loads immediately
  // IMPORTANT: Only consider isLoadingResellerProfile if user is actually a reseller
  const isProfileLoading = 
    (isDriver && isLoadingDriverProfile && !isSettingsPage) || 
    (isClient && isLoadingClientProfile && !isSettingsPage) ||
    (isReseller && isLoadingResellerProfile && !isSettingsPage);

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if driver has complete profile (exclude settings page from this check)
  if (isDriver && !isSettingsPage && (!driverProfile || !driverProfile.hasProfile)) {
    return <Navigate to="/settings" replace />;
  }

  // Check if client has complete profile (exclude settings page from this check)
  if (isClient && !isSettingsPage && (!clientProfile || !clientProfile.hasProfile)) {
    return <Navigate to="/settings" replace />;
  }

  // Check if reseller has complete organisation profile (exclude settings page from this check)
  if (isReseller && !isSettingsPage && hasIncompleteResellerProfile) {
    return <Navigate to="/settings" replace />;
  }

  // Allow pending users to VIEW pages but show banner and disable controls
  const isPending = user && user.status === 'pending' && user.role !== 'admin';
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

