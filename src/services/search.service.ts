// Global Search Service
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import { apiClient } from './api-client';
import { mockJobs } from '@/mocks/mock-data';
import { mockBookings, mockClients } from '@/mocks/mock-entities';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'search';

export interface SearchResult {
  type: 'job' | 'client' | 'booking';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

class SearchService {
  async search(query: string, user?: User | null): Promise<SearchResponse> {
    // Use real API if not using mocks
    // For now, search is done client-side, so we'll keep using mocks
    // TODO: Implement backend search endpoint if needed
    if (!USE_MOCK_API) {
      // Backend doesn't have a unified search endpoint yet
      // For now, use mock implementation
      return this.searchMock(query, user);
    }
    
    return this.searchMock(query, user);
  }

  private async searchMock(query: string, user?: User | null): Promise<SearchResponse> {
    await delay(300);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to search. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search Jobs
    let jobs = [...mockJobs];
    if (user) {
      if (user.role === 'client' || user.role === 'reseller') {
        jobs = jobs.filter(j => j.clientId === user.tenantId);
      } else if (user.role === 'driver') {
        jobs = jobs.filter(j => j.driver?.id === user.id && j.status !== 'completed');
      }
    }

    jobs
      .filter(job =>
        job.clientName.toLowerCase().includes(lowerQuery) ||
        job.erpJobNumber.toLowerCase().includes(lowerQuery) ||
        job.siteName.toLowerCase().includes(lowerQuery) ||
        job.siteAddress.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(job => {
        results.push({
          type: 'job',
          id: job.id,
          title: job.clientName,
          subtitle: `${job.erpJobNumber} • ${job.siteName}`,
          url: `/jobs/${job.id}`,
        });
      });

    // Search Clients
    let clients = [...mockClients];
    if (user) {
      if (user.role === 'reseller') {
        clients = clients.filter(c => c.resellerId === user.tenantId);
      } else if (user.role === 'client') {
        clients = clients.filter(c => c.tenantId === user.tenantId);
      }
    }

    clients
      .filter(client =>
        client.name.toLowerCase().includes(lowerQuery) ||
        client.email?.toLowerCase().includes(lowerQuery) ||
        client.contactName?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(client => {
        results.push({
          type: 'client',
          id: client.id,
          title: client.name,
          subtitle: client.email || client.contactName || 'Client',
          url: `/clients`,
        });
      });

    // Search Bookings
    let bookings = [...mockBookings];
    if (user) {
      if (user.role === 'client' || user.role === 'reseller') {
        bookings = bookings.filter(b => b.clientId === user.tenantId);
      }
    }

    bookings
      .filter(booking =>
        booking.clientName.toLowerCase().includes(lowerQuery) ||
        booking.bookingNumber.toLowerCase().includes(lowerQuery) ||
        booking.siteName.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(booking => {
        results.push({
          type: 'booking',
          id: booking.id,
          title: booking.clientName,
          subtitle: `${booking.bookingNumber} • ${booking.siteName}`,
          url: `/bookings/${booking.id}`,
        });
      });

    return {
      results: results.slice(0, 10), // Limit total results
      total: results.length,
    };
  }
}

export const searchService = new SearchService();

