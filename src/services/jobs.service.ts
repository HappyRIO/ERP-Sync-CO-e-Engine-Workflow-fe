// Jobs Service
import type { Job, JobsFilter, DashboardStats } from '@/types/jobs';
import type { User } from '@/types/auth';
import { ApiError, ApiErrorType } from './api-error';
import { apiClient } from './api-client';
import { transformJobs, transformJob } from './data-transform';

/**
 * Convert frontend status format (hyphens) to backend format (underscores)
 * Frontend uses: en-route, in-transit, delivery-routed, delivery-en-route, delivery-arrived
 * Backend uses: en_route, in_transit, delivery_routed, delivery_en_route, delivery_arrived
 */
function convertStatusToBackendFormat(status: string): string {
  const statusMap: Record<string, string> = {
    'en-route': 'en_route',
    'in-transit': 'in_transit',
    'delivery-routed': 'delivery_routed',
    'delivery-en-route': 'delivery_en_route',
    'delivery-arrived': 'delivery_arrived',
  };
  return statusMap[status] || status;
}

class JobsService {
  async getJobs(filter?: JobsFilter, user?: User | null): Promise<Job[]> {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== 'all') {
      // Convert frontend status format to backend format
      const backendStatus = convertStatusToBackendFormat(filter.status);
      params.append('status', backendStatus);
    }
    if (filter?.clientName) {
      params.append('clientName', filter.clientName);
    }
    if (filter?.clientId) {
      params.append('clientId', filter.clientId);
    }
    if (filter?.searchQuery) {
      params.append('searchQuery', filter.searchQuery);
    }
    if (filter?.limit) {
      params.append('limit', filter.limit.toString());
    }
    if (filter?.offset) {
      params.append('offset', filter.offset.toString());
    }

    const queryString = params.toString();
    const endpoint = `/jobs${queryString ? `?${queryString}` : ''}`;
    
    const backendJobs = await apiClient.get<any[]>(endpoint);
    return transformJobs(backendJobs);
  }

  async getJob(id: string): Promise<Job | null> {
    try {
      const backendJob = await apiClient.get<any>(`/jobs/${id}`);
      return transformJob(backendJob);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getDashboardStats(user?: User | null): Promise<DashboardStats> {
    try {
      const stats = await apiClient.get<DashboardStats>('/dashboard/stats');
      return stats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return empty stats instead of throwing to prevent blocking page load
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalCO2eSaved: 0,
        totalBuyback: 0,
        totalAssets: 0,
        avgCharityPercent: 0,
        travelEmissions: {
          petrol: 0,
          diesel: 0,
          electric: 0,
          totalDistanceKm: 0,
          totalDistanceMiles: 0,
        },
        completedJobsCount: 0,
        bookedJobsCount: 0,
        completedCO2eSaved: 0,
        estimatedCO2eSaved: 0,
      };
    }
  }

  async updateJobStatus(jobId: string, status: Job['status']): Promise<Job> {
    // Convert frontend status format to backend format
    const backendStatus = convertStatusToBackendFormat(status);
    
    const backendJob = await apiClient.patch<any>(`/jobs/${jobId}/status`, { 
      status: backendStatus 
    });
    return transformJob(backendJob);
  }

  async updateJobEvidence(jobId: string, evidence: Partial<Job['evidence']> & { status?: string }): Promise<Job> {
    // Convert frontend status format to backend format if status is provided
    const backendEvidence = {
      ...evidence,
      ...(evidence.status && { status: convertStatusToBackendFormat(evidence.status) }),
    };
    
    const backendJob = await apiClient.patch<any>(`/jobs/${jobId}/evidence`, backendEvidence);
    return transformJob(backendJob);
  }

  async updateJobJourneyFields(
    jobId: string,
    fields: {
      dial2Collection?: string;
      securityRequirements?: string;
      idRequired?: string;
      loadingBayLocation?: string;
      vehicleHeightRestrictions?: string;
      doorLiftSize?: string;
      roadWorksPublicEvents?: string;
      manualHandlingRequirements?: string;
    }
  ): Promise<Job> {
    const backendJob = await apiClient.patch<any>(`/jobs/${jobId}/journey-fields`, fields);
    return transformJob(backendJob);
  }

  async reassignDriver(jobId: string, driverId: string | null, vehicleId?: string): Promise<Job> {
    const backendJob = await apiClient.post<any>(`/jobs/${jobId}/reassign-driver`, { driverId, vehicleId });
    return transformJob(backendJob);
  }
}

export const jobsService = new JobsService();

