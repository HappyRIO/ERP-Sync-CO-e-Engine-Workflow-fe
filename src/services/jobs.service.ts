// Jobs Service
import type { Job, JobsFilter, DashboardStats } from '@/types/jobs';
import { mockJobs } from '@/mocks/mock-data';
import type { User } from '@/types/auth';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API, API_BASE_URL } from '@/lib/config';
import { apiClient } from './api-client';
import { transformJobs, transformJob } from './data-transform';
import { 
  calculateAllVehicleEmissions,
  kmToMiles,
} from '@/lib/calculations';

const SERVICE_NAME = 'jobs';

class JobsService {
  async getJobs(filter?: JobsFilter, user?: User | null): Promise<Job[]> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getJobsAPI(filter, user);
    }
    
    return this.getJobsMock(filter, user);
  }

  private async getJobsAPI(filter?: JobsFilter, user?: User | null): Promise<Job[]> {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== 'all') {
      // Convert frontend status format to backend format
      const statusMap: Record<string, string> = {
        'en-route': 'en_route',
      };
      const backendStatus = statusMap[filter.status] || filter.status;
      params.append('status', backendStatus);
    }
    if (filter?.clientName) {
      params.append('clientName', filter.clientName);
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

  private async getJobsMock(filter?: JobsFilter, user?: User | null): Promise<Job[]> {
    await delay(600);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.UNAUTHORIZED && !user) {
        throw new ApiError(
          ApiErrorType.UNAUTHORIZED,
          'You must be logged in to view jobs.',
          401
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch jobs. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let jobs = [...mockJobs];

    // Filter by user role and tenant
    if (user) {
      if (user.role === 'admin') {
        // Admin sees all jobs
      } else if (user.role === 'client') {
        // Client sees only their own jobs
        jobs = jobs.filter(job => job.clientName === user.tenantName);
      } else if (user.role === 'reseller') {
        // Reseller sees jobs for all their clients
        const { mockClients } = await import('@/mocks/mock-entities');
        const resellerClients = mockClients.filter(c => c.resellerId === user.tenantId);
        const clientNames = resellerClients.map(c => c.name);
        jobs = jobs.filter(job => clientNames.includes(job.clientName));
      } else if (user.role === 'driver') {
        // Drivers see all jobs assigned to them (by name match) for history
        // Access restriction to jobs at "warehouse" or beyond is handled at the UI level (DriverJobView)
        jobs = jobs.filter(job => {
          if (!job.driver || job.driver.name !== user.name) {
            return false;
          }
          // Apply status filter if provided
          if (filter?.status) {
            return job.status === filter.status;
          }
          // Otherwise show all jobs (for history)
          return true;
        });
      }
    }

    // Apply filters
    if (filter) {
      if (filter.status && filter.status !== 'all') {
        jobs = jobs.filter(job => job.status === filter.status);
      }

      if (filter.clientName) {
        jobs = jobs.filter(job => 
          job.clientName.toLowerCase().includes(filter.clientName!.toLowerCase())
        );
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        jobs = jobs.filter(job =>
          job.clientName.toLowerCase().includes(query) ||
          job.erpJobNumber.toLowerCase().includes(query) ||
          job.siteName.toLowerCase().includes(query) ||
          job.siteAddress.toLowerCase().includes(query)
        );
      }

      // Apply pagination
      if (filter.offset !== undefined) {
        jobs = jobs.slice(filter.offset);
      }
      if (filter.limit !== undefined) {
        jobs = jobs.slice(0, filter.limit);
      }
    }

    return jobs;
  }

  async getJob(id: string): Promise<Job | null> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getJobAPI(id);
    }
    
    return this.getJobMock(id);
  }

  private async getJobAPI(id: string): Promise<Job | null> {
    try {
      const backendJob = await apiClient.get<any>(`/jobs/${id}`);
      
      // Debug: Log raw backend response
      if (process.env.NODE_ENV === 'development') {
        console.log('[Jobs Service] Raw backend job response:', {
          id: backendJob?.id,
          hasEvidence: !!backendJob?.evidence,
          evidenceType: typeof backendJob?.evidence,
          evidenceIsArray: Array.isArray(backendJob?.evidence),
          evidenceLength: Array.isArray(backendJob?.evidence) ? backendJob.evidence.length : 'N/A',
          evidenceValue: backendJob?.evidence,
        });
      }
      
      return transformJob(backendJob);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  private async getJobMock(id: string): Promise<Job | null> {
    await delay(500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Job with ID "${id}" was not found.`,
          404,
          { jobId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch job details. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const job = mockJobs.find(job => job.id === id);
    
    // Simulate not found error if job doesn't exist and error simulation is enabled
    if (!job && shouldSimulateError(SERVICE_NAME)) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Job with ID "${id}" was not found.`,
        404,
        { jobId: id }
      );
    }

    return job || null;
  }

  async getDashboardStats(user?: User | null): Promise<DashboardStats> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getDashboardStatsAPI();
    }
    
    return this.getDashboardStatsMock(user);
  }

  private async getDashboardStatsAPI(): Promise<DashboardStats> {
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

  private async getDashboardStatsMock(user?: User | null): Promise<DashboardStats> {
    await delay(400);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to load dashboard statistics. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }
    
    const jobs = await this.getJobs(undefined, user);
    
    // Calculate travel emissions based on job locations
    // Sum up all travelEmissions from jobs (these are already calculated for the actual vehicle used)
    // Sum up actual round trip distances from bookings (more accurate than deriving from emissions)
    let totalDistanceKm = 0;
    let totalTravelEmissionsActual = 0;
    
    // Use actual roundTripDistanceKm from bookings if available, otherwise estimate from emissions
    const avgEmissionsPerKm = 0.24; // kg CO2e per km for van (fallback for jobs without booking distance)
    
    for (const job of jobs) {
      const emissions = job.travelEmissions || 0;
      if (emissions > 0) {
        totalTravelEmissionsActual += emissions;
      }
      
      // Use actual distance from booking if available (more accurate)
      if (job.booking?.roundTripDistanceKm) {
        totalDistanceKm += job.booking.roundTripDistanceKm;
      } else if (emissions > 0) {
        // Fallback: estimate from emissions if booking distance not available
        totalDistanceKm += emissions / avgEmissionsPerKm;
      }
    }
    
    // Calculate emissions for all vehicle types based on total distance
    // This shows what the emissions would be if all jobs used petrol, diesel, or electric vehicles
    const vehicleEmissions = calculateAllVehicleEmissions(totalDistanceKm);
    
    // Separate completed and booked (not yet completed) jobs for client dashboard
    // Completed = completed jobs (actual figures)
    // Booked = all non-completed jobs (estimated figures)
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const bookedJobs = jobs.filter(j => j.status !== 'completed'); // All jobs that are not yet completed
    
    // Calculate active jobs - for drivers, exclude jobs at "warehouse" or later
    // (those should only appear in Job History)
    let activeJobs: number;
    if (user?.role === 'driver') {
      activeJobs = jobs.filter(j => 
        !['warehouse', 'sanitised', 'graded', 'completed'].includes(j.status)
      ).length;
    } else {
      activeJobs = jobs.filter(j => !['completed'].includes(j.status)).length;
    }
    
    return {
      totalJobs: jobs.length,
      activeJobs,
      totalCO2eSaved: jobs.reduce((sum, j) => sum + j.co2eSaved, 0),
      totalBuyback: jobs.reduce((sum, j) => sum + j.buybackValue, 0),
      totalAssets: jobs.reduce((sum, j) => sum + j.assets.reduce((a, asset) => a + asset.quantity, 0), 0),
      avgCharityPercent: jobs.length > 0 
        ? Math.round(jobs.reduce((sum, j) => sum + j.charityPercent, 0) / jobs.length)
        : 0,
      travelEmissions: {
        petrol: vehicleEmissions.petrol,
        diesel: vehicleEmissions.diesel,
        electric: vehicleEmissions.electric,
        totalDistanceKm,
        totalDistanceMiles: kmToMiles(totalDistanceKm),
      },
      completedJobsCount: completedJobs.length,
      bookedJobsCount: bookedJobs.length,
      completedCO2eSaved: completedJobs.reduce((sum, j) => sum + j.co2eSaved, 0),
      estimatedCO2eSaved: bookedJobs.reduce((sum, j) => sum + j.co2eSaved, 0),
    };
  }

  async updateJobStatus(jobId: string, status: Job['status']): Promise<Job> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.updateJobStatusAPI(jobId, status);
    }
    
    return this.updateJobStatusMock(jobId, status);
  }

  private async updateJobStatusAPI(jobId: string, status: Job['status']): Promise<Job> {
    // Convert frontend status format to backend format
    const statusMap: Record<string, string> = {
      'en-route': 'en_route',
    };
    const backendStatus = statusMap[status] || status;
    
    const backendJob = await apiClient.patch<any>(`/jobs/${jobId}/status`, { 
      status: backendStatus 
    });
    return transformJob(backendJob);
  }

  private async updateJobStatusMock(jobId: string, status: Job['status']): Promise<Job> {
    await delay(800);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Job with ID "${jobId}" was not found.`,
          404,
          { jobId }
        );
      }
      if (config.errorType === ApiErrorType.VALIDATION_ERROR) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          `Invalid status transition. Cannot change job status to "${status}".`,
          400,
          { jobId, status }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update job status. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const job = mockJobs.find(j => j.id === jobId);
    if (!job) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Job with ID "${jobId}" was not found.`,
        404,
        { jobId }
      );
    }
    
    // Validate status transition (basic validation)
    // Note: 'routed' is set automatically when driver is assigned, driver can go from 'booked' or 'routed' to 'en-route'
    const validTransitions: Record<string, string[]> = {
      booked: ['routed', 'en-route'], // Driver can accept job directly (en-route) or it can be routed first
      routed: ['en-route'], // After routing, driver moves to en-route
      'en-route': ['arrived'],
      arrived: ['collected'],
      collected: ['warehouse'],
      warehouse: ['sanitised'], // Auto-updated when all assets sanitised
      sanitised: ['graded'], // Auto-updated when all assets graded
      graded: ['completed'], // Auto-updated when booking completed
    };
    
    const currentStatus = job.status;
    const allowedNextStatuses = validTransitions[currentStatus] || [];
    if (allowedNextStatuses.length > 0 && !allowedNextStatuses.includes(status) && status !== currentStatus) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Invalid status transition from "${currentStatus}" to "${status}".`,
        400,
        { jobId, currentStatus, newStatus: status }
      );
    }

    job.status = status;
    
    // Sync booking status when job status changes
    if (job.bookingId) {
      try {
        // Import booking service dynamically to avoid circular dependency
        const { bookingService } = await import('./booking.service');
        const { mockBookings } = await import('@/mocks/mock-entities');
        const booking = mockBookings.find(b => b.id === job.bookingId);
        
        if (booking) {
          // Map job status to booking status
          if (status === 'collected' && booking.status === 'scheduled') {
            booking.status = 'collected';
            booking.collectedAt = new Date().toISOString();
          } else if (status === 'warehouse' && booking.status === 'collected') {
            // Warehouse status doesn't change booking status (stays collected)
          } else if (status === 'sanitised' && booking.status === 'collected') {
            booking.status = 'sanitised';
            booking.sanitisedAt = new Date().toISOString();
          } else if (status === 'graded' && booking.status === 'sanitised') {
            booking.status = 'graded';
            booking.gradedAt = new Date().toISOString();
          } else if (status === 'completed' && booking.status === 'graded') {
            booking.status = 'completed';
            booking.completedAt = new Date().toISOString();
          }
        }
      } catch (error) {
        // If sync fails, log but don't fail the job update
        console.error('Failed to sync booking status:', error);
      }
    }
    
    return job;
  }

  async updateJobEvidence(jobId: string, evidence: Partial<Job['evidence']> & { status?: string }): Promise<Job> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.updateJobEvidenceAPI(jobId, evidence);
    }
    
    return this.updateJobEvidenceMock(jobId, evidence);
  }

  private async updateJobEvidenceAPI(jobId: string, evidence: Partial<Job['evidence']> & { status?: string }): Promise<Job> {
    const backendJob = await apiClient.patch<any>(`/jobs/${jobId}/evidence`, evidence);
    return transformJob(backendJob);
  }

  private async updateJobEvidenceMock(jobId: string, evidence: Partial<Job['evidence']>): Promise<Job> {
    await delay(800);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Job with ID "${jobId}" was not found.`,
          404,
          { jobId }
        );
      }
      if (config.errorType === ApiErrorType.VALIDATION_ERROR) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          'Invalid evidence data. Please check your input and try again.',
          400,
          { jobId, evidence }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update job evidence. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const job = mockJobs.find(j => j.id === jobId);
    if (!job) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Job with ID "${jobId}" was not found.`,
        404,
        { jobId }
      );
    }

    // Validate evidence
    if (evidence.photos && evidence.photos.length > 10) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Maximum 10 photos allowed per job.',
        400,
        { jobId, photoCount: evidence.photos.length }
      );
    }

    job.evidence = {
      ...job.evidence,
      ...evidence,
    } as Job['evidence'];
    
    return job;
  }
}

export const jobsService = new JobsService();

