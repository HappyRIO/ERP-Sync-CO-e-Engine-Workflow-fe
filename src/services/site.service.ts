// Mock Site Service for Client/Reseller Portal
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';

const SERVICE_NAME = 'site';

export interface Site {
  id: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactName?: string;
  contactPhone?: string;
  isDefault?: boolean;
}

// Mock sites data
const mockSites: Site[] = [
  {
    id: 'site-1',
    name: 'London HQ',
    address: '123 Tech Street',
    postcode: 'EC1A 1BB',
    city: 'London',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    contactName: 'John Smith',
    contactPhone: '+44 20 1234 5678',
    isDefault: true,
  },
  {
    id: 'site-2',
    name: 'Manchester Office',
    address: '45 Finance Way',
    postcode: 'M1 2AB',
    city: 'Manchester',
    coordinates: { lat: 53.4808, lng: -2.2426 },
    contactName: 'Sarah Johnson',
    contactPhone: '+44 161 1234 5678',
  },
  {
    id: 'site-3',
    name: 'Birmingham Warehouse',
    address: '789 Industrial Park',
    postcode: 'B1 1AA',
    city: 'Birmingham',
    coordinates: { lat: 52.4862, lng: -1.8904 },
    contactName: 'Mike Thompson',
    contactPhone: '+44 121 1234 5678',
  },
  {
    id: 'site-4',
    name: 'Edinburgh Branch',
    address: '321 Royal Mile',
    postcode: 'EH1 1RE',
    city: 'Edinburgh',
    coordinates: { lat: 55.9533, lng: -3.1883 },
    contactName: 'Emma Davis',
    contactPhone: '+44 131 1234 5678',
  },
];

class SiteService {
  async getSites(): Promise<Site[]> {
    await delay(800);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch sites. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    return [...mockSites];
  }

  async getSite(id: string): Promise<Site | null> {
    await delay(500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Site with ID "${id}" was not found.`,
          404,
          { siteId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch site. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const site = mockSites.find(s => s.id === id);
    
    if (!site && shouldSimulateError(SERVICE_NAME)) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Site with ID "${id}" was not found.`,
        404,
        { siteId: id }
      );
    }

    return site || null;
  }

  async searchSites(query: string): Promise<Site[]> {
    await delay(600);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to search sites. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Validate query
    if (!query || query.trim().length === 0) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Search query cannot be empty.',
        400
      );
    }

    if (query.trim().length < 2) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Search query must be at least 2 characters long.',
        400
      );
    }

    const lowerQuery = query.toLowerCase();
    return mockSites.filter(
      site =>
        site.name.toLowerCase().includes(lowerQuery) ||
        site.address.toLowerCase().includes(lowerQuery) ||
        site.postcode.toLowerCase().includes(lowerQuery) ||
        site.city.toLowerCase().includes(lowerQuery)
    );
  }

  async createSite(site: Omit<Site, 'id'>): Promise<Site> {
    await delay(1000);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to create site. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Validate input
    if (!site.name || !site.address || !site.postcode || !site.city) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Site name, address, postcode, and city are required.',
        400
      );
    }

    // Validate postcode format (basic UK postcode validation)
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(site.postcode)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Please enter a valid UK postcode.',
        400,
        { postcode: site.postcode }
      );
    }

    // Check for duplicate sites (by name and postcode)
    const duplicate = mockSites.find(
      s => s.name.toLowerCase() === site.name.toLowerCase() &&
           s.postcode.toLowerCase() === site.postcode.toLowerCase()
    );
    if (duplicate) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'A site with this name and postcode already exists.',
        409,
        { existingSiteId: duplicate.id }
      );
    }

    const newSite: Site = {
      ...site,
      id: `site-${Date.now()}`,
    };
    mockSites.push(newSite);
    return newSite;
  }

  async updateSite(id: string, updates: Partial<Omit<Site, 'id'>>): Promise<Site> {
    await delay(1000);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update site. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const siteIndex = mockSites.findIndex(s => s.id === id);
    if (siteIndex === -1) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        'Site not found.',
        404
      );
    }

    // If updating default site, unset other defaults
    if (updates.isDefault === true) {
      mockSites.forEach(s => {
        if (s.id !== id) {
          s.isDefault = false;
        }
      });
    }

    const updatedSite = { ...mockSites[siteIndex], ...updates };
    mockSites[siteIndex] = updatedSite;
    return updatedSite;
  }

  async deleteSite(id: string): Promise<void> {
    await delay(800);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to delete site. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const siteIndex = mockSites.findIndex(s => s.id === id);
    if (siteIndex === -1) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        'Site not found.',
        404
      );
    }

    mockSites.splice(siteIndex, 1);
  }

  async setDefaultSite(id: string): Promise<Site> {
    return this.updateSite(id, { isDefault: true });
  }
}

export const siteService = new SiteService();

