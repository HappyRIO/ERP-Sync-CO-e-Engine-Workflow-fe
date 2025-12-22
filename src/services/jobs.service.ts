// Jobs Service
import type { Job, JobsFilter, DashboardStats } from '@/types/jobs';
import { mockJobs } from '@/mocks/mock-data';
import type { User } from '@/types/auth';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API, API_BASE_URL } from '@/lib/config';
import { 
  calculateAllVehicleEmissions,
  kmToMiles,
} from '@/lib/calculations';

const SERVICE_NAME = 'jobs';

class JobsService {
  async getJobs(filter?: JobsFilter, user?: User | null): Promise<Job[]> {
    // Use mock API for Milestone 1
    if (USE_MOCK_API) {
      return this.getJobsMock(filter, user);
    }
    
    // Future: Real API implementation
    // return this.getJobsAPI(filter, user);
    throw new Error('Real API not implemented yet');
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
      } else if (user.role === 'client' || user.role === 'reseller') {
        jobs = jobs.filter(job => job.clientName === user.tenantName);
      } else if (user.role === 'driver') {
        // Drivers only see jobs assigned to them (by name match)
        // Only exclude finalised jobs if not explicitly requested in filter
        jobs = jobs.filter(job => {
          if (!job.driver || job.driver.name !== user.name) {
            return false;
          }
          // If filter explicitly requests finalised jobs, don't exclude them
          if (filter?.status === 'finalised') {
            return true;
          }
          // Otherwise exclude finalised jobs (for schedule view)
          return job.status !== 'finalised';
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
    if (USE_MOCK_API) {
      return this.getJobMock(id);
    }
    
    // Future: Real API implementation
    throw new Error('Real API not implemented yet');
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
    if (USE_MOCK_API) {
      return this.getDashboardStatsMock(user);
    }
    
    // Future: Real API implementation
    throw new Error('Real API not implemented yet');
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
    // For dashboard, we estimate total distance based on existing travelEmissions values
    // (which are calculated for a van/truck, averaging around 0.24-0.89 kg/km)
    // We'll estimate based on average emissions per km (using 0.24 for van as baseline)
    // Since travelEmissions is already round trip, we can estimate one-way distance
    const avgEmissionsPerKm = 0.24; // kg CO2e per km for van (conservative estimate)
    let totalDistanceKm = 0;
    
    for (const job of jobs) {
      // Estimate one-way distance from travelEmissions, then multiply by 2 for round trip
      // travelEmissions = distance_round_trip * emissions_per_km
      // So: distance_round_trip = travelEmissions / emissions_per_km
      const roundTripDistance = job.travelEmissions / avgEmissionsPerKm;
      totalDistanceKm += roundTripDistance;
    }
    
    // Calculate emissions for all vehicle types based on total distance
    const vehicleEmissions = calculateAllVehicleEmissions(totalDistanceKm);
    
    // Separate completed and booked (not yet completed) jobs for client dashboard
    // Completed = finalised jobs (actual figures)
    // Booked = all non-finalised jobs (estimated figures)
    const completedJobs = jobs.filter(j => j.status === 'finalised');
    const bookedJobs = jobs.filter(j => j.status !== 'finalised'); // All jobs that are not yet completed
    
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => !['finalised'].includes(j.status)).length,
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
    if (USE_MOCK_API) {
      return this.updateJobStatusMock(jobId, status);
    }
    
    // Future: Real API implementation
    throw new Error('Real API not implemented yet');
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
    const validTransitions: Record<string, string[]> = {
      booked: ['routed'],
      routed: ['en-route'],
      'en-route': ['arrived'],
      arrived: ['collected'],
      collected: ['warehouse'],
      warehouse: ['sanitised'],
      sanitised: ['graded'],
      graded: ['finalised'],
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
    return job;
  }

  async updateJobEvidence(jobId: string, evidence: Partial<Job['evidence']>): Promise<Job> {
    if (USE_MOCK_API) {
      return this.updateJobEvidenceMock(jobId, evidence);
    }
    
    // Future: Real API implementation
    throw new Error('Real API not implemented yet');
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

