// Custom hook for fetching jobs
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '@/services/jobs.service';
import type { Job, JobsFilter } from '@/types/jobs';
import type { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

export function useJobs(filter?: JobsFilter) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobs', filter, user?.id],
    queryFn: () => jobsService.getJobs(filter, user),
    staleTime: 30000, // 30 seconds
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => id ? jobsService.getJob(id) : null,
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: () => jobsService.getDashboardStats(user),
    staleTime: 60000, // 1 minute
    retry: false, // Don't retry on error to avoid blocking
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: Job['status'] }) =>
      jobsService.updateJobStatus(jobId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] }); // Invalidate specific job
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      // Job status changes can generate notifications for driver, client, and admin
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useUpdateJobEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, evidence }: { jobId: string; evidence: Partial<Job['evidence']> }) =>
      jobsService.updateJobEvidence(jobId, evidence),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Evidence submission often precedes status changes; be safe and refresh notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useUpdateJobJourneyFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      jobId, 
      fields 
    }: { 
      jobId: string; 
      fields: {
        dial2Collection?: string;
        securityRequirements?: string;
        idRequired?: string;
        loadingBayLocation?: string;
        vehicleHeightRestrictions?: string;
        doorLiftSize?: string;
        roadWorksPublicEvents?: string;
        manualHandlingRequirements?: string;
      };
    }) =>
      jobsService.updateJobJourneyFields(jobId, fields),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useReassignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, driverId, vehicleId }: { jobId: string; driverId: string | null; vehicleId?: string }) =>
      jobsService.reassignDriver(jobId, driverId, vehicleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Also refresh bookings so booking queue / details reflect unassignment
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
