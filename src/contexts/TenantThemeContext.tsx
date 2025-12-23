// Tenant Theme Context for White-Label Branding
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { tenantService } from '@/services/tenant.service';
import type { Tenant } from '@/types/auth';

interface TenantThemeContextType {
  primaryColor: string;
  accentColor: string;
  logo?: string;
  favicon?: string;
  tenantName: string;
  applyTheme: () => void;
  isLoading: boolean;
}

const TenantThemeContext = createContext<TenantThemeContextType | undefined>(undefined);

export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const { tenant: authTenant } = useAuth();
  const [subdomainTenant, setSubdomainTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use subdomain tenant if available, otherwise fall back to auth tenant
  const tenant = subdomainTenant || authTenant;
  
  const [theme, setTheme] = useState({
    primaryColor: 'hsl(168, 70%, 35%)',
    accentColor: 'hsl(168, 60%, 45%)',
    logo: '/logo.avif' as string | undefined, // Default platform logo
    favicon: '/favicon.ico' as string | undefined, // Default favicon
    tenantName: 'Reuse ITAD Platform',
  });

  // Parse color function - defined outside useEffect to avoid dependency issues
  const parseColor = (color: string): string => {
    if (!color || typeof color !== 'string') {
      return color;
    }

    const trimmed = color.trim();

    // If it's in hsl() format, extract just the values
    // Handles: hsl(168, 70%, 35%), hsl(168 70% 35%), hsl(168,70%,35%)
    if (trimmed.toLowerCase().startsWith('hsl(')) {
      const match = trimmed.match(/hsl\(([^)]+)\)/i);
      if (match) {
        // Remove all commas and extra spaces, return just the values: "168 70% 35%"
        return match[1].replace(/,/g, '').replace(/\s+/g, ' ').trim();
      }
    }

    // If it's in rgb() format, we'd need to convert to HSL (not implemented, but structure is here)
    if (trimmed.toLowerCase().startsWith('rgb(')) {
      // TODO: Convert RGB to HSL if needed
      console.warn('RGB color format not yet supported, please use HSL format');
      return trimmed;
    }

    // If it's a hex color, we'd need to convert to HSL (not implemented, but structure is here)
    if (trimmed.startsWith('#')) {
      // TODO: Convert hex to HSL if needed
      console.warn('Hex color format not yet supported, please use HSL format');
      return trimmed;
    }

    // If it's already in the correct format (just HSL values like "168 70% 35%"), return as is
    // Check if it matches the pattern: number, space, number%, space, number%
    const hslValuePattern = /^\d+\s+\d+%\s+\d+%$/;
    if (hslValuePattern.test(trimmed)) {
      return trimmed;
    }

    // If we can't parse it, return as is (might cause issues, but better than crashing)
    console.warn(`Unable to parse color format: ${color}. Expected HSL format like "hsl(168, 70%, 35%)" or "168 70% 35%"`);
    return trimmed;
  };

  const applyTheme = (tenantData?: Tenant) => {
    const root = document.documentElement;
    
    if (tenantData) {
      // Apply primary color if provided
      if (tenantData.primaryColor) {
        const primary = parseColor(tenantData.primaryColor);
        root.style.setProperty('--primary', primary);
      } else {
        // Reset to default from CSS
        root.style.removeProperty('--primary');
      }

      // Apply accent color if provided
      if (tenantData.accentColor) {
        const accent = parseColor(tenantData.accentColor);
        root.style.setProperty('--accent', accent);
      } else {
        // Reset to default from CSS
        root.style.removeProperty('--accent');
      }
    } else {
      // No tenant - reset to CSS defaults
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
    }
  };

  const updateFavicon = (faviconUrl?: string) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingLinks.forEach(link => link.remove());

    // Add new favicon
    if (faviconUrl) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = faviconUrl;
      document.head.appendChild(link);
    } else {
      // Default favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);
    }
  };

  // Load tenant from subdomain on mount (before auth)
  useEffect(() => {
    const loadSubdomainTenant = async () => {
      try {
        const subdomainTenantData = await tenantService.getTenantBySubdomain();
        if (subdomainTenantData) {
          setSubdomainTenant(subdomainTenantData);
        }
      } catch (error) {
        console.error('Failed to load tenant from subdomain:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubdomainTenant();
  }, []);

  // Apply theme when tenant changes
  useEffect(() => {
    // Always apply theme, even if no tenant (to ensure defaults are set)
    if (tenant) {
      setTheme({
        primaryColor: tenant.primaryColor || 'hsl(168, 70%, 35%)',
        accentColor: tenant.accentColor || 'hsl(168, 60%, 45%)',
        logo: tenant.logo || '/logo.avif', // Use tenant logo or fallback to default
        favicon: tenant.favicon || '/favicon.ico', // Use tenant favicon or fallback to default
        tenantName: tenant.name,
      });
      applyTheme(tenant);
      updateFavicon(tenant.favicon);
    } else {
      // Reset to defaults when no tenant
      applyTheme(undefined);
      updateFavicon(undefined);
    }
  }, [tenant]);

  return (
    <TenantThemeContext.Provider
      value={{
        primaryColor: theme.primaryColor,
        accentColor: theme.accentColor,
        logo: theme.logo,
        favicon: theme.favicon,
        tenantName: theme.tenantName,
        applyTheme: () => applyTheme(tenant || undefined),
        isLoading,
      }}
    >
      {children}
    </TenantThemeContext.Provider>
  );
}

export function useTenantTheme() {
  const context = useContext(TenantThemeContext);
  if (context === undefined) {
    throw new Error('useTenantTheme must be used within a TenantThemeProvider');
  }
  return context;
}

