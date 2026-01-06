// Helper functions for job-related logic
import type { Job } from '@/types/jobs';

/**
 * Check if a driver can access a job (for driver view)
 * Drivers can only access jobs in statuses they can work on:
 * - booked, routed, en_route (or en-route), arrived, collected, warehouse
 * - They cannot edit jobs in sanitised, graded, completed statuses
 * - But they can view their submitted evidence for those statuses
 */
export function canDriverAccessJob(job: Job | null | undefined): boolean {
  if (!job) return false;
  
  // Normalize the job status for comparison
  const normalizedStatus = normalizeStatusForCheck(job.status);
  
  // Drivers can access jobs in these statuses (normalized format)
  const accessibleStatuses = ['booked', 'routed', 'en-route', 'arrived', 'collected', 'warehouse', 'sanitised', 'graded', 'completed'];
  
  return accessibleStatuses.includes(normalizedStatus);
}

/**
 * Normalize status for comparison (handle both en-route and en_route)
 */
function normalizeStatusForCheck(status: string): string {
  if (status === 'en-route' || status === 'en_route') return 'en-route';
  return status;
}

/**
 * Check if a driver can edit a job (submit evidence, update status)
 * Drivers can only edit jobs in statuses they can work on
 * Editable statuses: routed, en_route (or en-route), arrived, collected
 * Note: 'booked' is not editable - job must be routed first
 */
export function canDriverEditJob(job: Job | null | undefined): boolean {
  if (!job) return false;
  
  // Normalize the job status for comparison
  const normalizedStatus = normalizeStatusForCheck(job.status);
  
  // Drivers can edit jobs in these statuses only (normalized format)
  const editableStatuses = ['routed', 'en-route', 'arrived', 'collected'];
  
  return editableStatuses.includes(normalizedStatus);
}

