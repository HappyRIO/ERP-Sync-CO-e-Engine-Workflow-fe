/**
 * Subdomain Detection and Tenant Context Utilities
 * 
 * Subdomain model:
 * - Admin: admin.platform.com
 * - Reseller: <reseller-slug>.platform.com
 * - End customers access via their reseller's subdomain
 */

/**
 * Extract subdomain from current hostname
 * @returns The subdomain (e.g., "admin", "reseller-slug") or null if no subdomain
 */
export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Handle localhost for development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for subdomain in localhost (e.g., admin.localhost:5173)
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0];
    }
    // For localhost, allow override via localStorage for testing
    const testSubdomain = localStorage.getItem('test_subdomain');
    if (testSubdomain) {
      return testSubdomain;
    }
    return null; // Default to admin/platform in development
  }
  
  // Extract subdomain from production domains
  // Format: <subdomain>.platform.com
  const parts = hostname.split('.');
  
  // If we have at least 3 parts (subdomain.platform.com) or 2 parts (subdomain.com)
  if (parts.length >= 2) {
    const subdomain = parts[0];
    // Skip 'www'
    if (subdomain !== 'www' && subdomain !== '') {
      return subdomain;
    }
  }
  
  return null; // No subdomain, default to admin/platform
}

/**
 * Determine tenant type from subdomain
 */
export function getTenantTypeFromSubdomain(): 'admin' | 'reseller' | 'platform' {
  const subdomain = getSubdomain();
  
  if (!subdomain) {
    return 'platform'; // Default/main platform
  }
  
  if (subdomain === 'admin') {
    return 'admin';
  }
  
  // Everything else is a reseller subdomain
  return 'reseller';
}

/**
 * Get reseller slug from subdomain
 * @returns The reseller slug or null if not a reseller subdomain
 */
export function getResellerSlug(): string | null {
  const subdomain = getSubdomain();
  const tenantType = getTenantTypeFromSubdomain();
  
  if (tenantType === 'reseller' && subdomain) {
    return subdomain;
  }
  
  return null;
}

/**
 * Check if current context is admin subdomain
 */
export function isAdminSubdomain(): boolean {
  return getSubdomain() === 'admin';
}

/**
 * Check if current context is a reseller subdomain
 */
export function isResellerSubdomain(): boolean {
  return getTenantTypeFromSubdomain() === 'reseller';
}

