// Helper functions for job-related logic
import type { Job } from '@/types/jobs';

/**
 * Check if a driver can access a job (for driver view)
 * Drivers can only access jobs in statuses they can work on:
 * - booked, routed, en_route (or en-route), arrived, collected, warehouse
 * - in-transit, delivery-routed, delivery-en-route (for JML workflows)
 * - They cannot edit jobs in sanitised, graded, completed statuses
 * - But they can view their submitted evidence for those statuses
 */
export function canDriverAccessJob(job: Job | null | undefined): boolean {
  if (!job) return false;
  
  // Normalize the job status for comparison
  const normalizedStatus = normalizeStatusForCheck(job.status);
  
  // Normalize delivery statuses for consistency
  const normalized = normalizedStatus === 'delivery_routed' ? 'delivery-routed' 
    : normalizedStatus === 'delivery_en_route' ? 'delivery-en-route'
    : normalizedStatus === 'delivery_arrived' ? 'delivery-arrived'
    : normalizedStatus === 'in_transit' ? 'in-transit'
    : normalizedStatus;
  
  // Drivers can access jobs in these statuses (normalized format)
  const accessibleStatuses = ['booked', 'routed', 'en-route', 'arrived', 'collected', 'warehouse', 'in-transit', 'delivery-routed', 'delivery-en-route', 'delivery-arrived', 'sanitised', 'graded', 'inventory', 'completed'];
  
  return accessibleStatuses.includes(normalized);
}

/**
 * Normalize status for comparison (handle both en-route and en_route, in-transit and in_transit, etc.)
 */
function normalizeStatusForCheck(status: string): string {
  if (status === 'en-route' || status === 'en_route') return 'en-route';
  if (status === 'in-transit' || status === 'in_transit') return 'in-transit';
  if (status === 'delivery-routed' || status === 'delivery_routed') return 'delivery-routed';
  if (status === 'delivery-en-route' || status === 'delivery_en_route') return 'delivery-en-route';
  if (status === 'delivery-arrived' || status === 'delivery_arrived') return 'delivery-arrived';
  return status;
}

/**
 * Check if a driver can edit a job (submit evidence, update status)
 * Drivers can only edit jobs in statuses they can work on
 * Final driver statuses (non-editable):
 * - ITAD/Leaver: warehouse (admin handles sanitised → graded → inventory → completed)
 * - New Starter: arrived (admin handles arrived → completed)
 * - Mover: warehouse (first phase - old device), then delivery-arrived (second phase - new device)
 * - Breakfix: arrived (first phase - replacement delivery), then warehouse (second phase - broken device collection)
 * Note: 'booked' is not editable - job must be routed first
 * Note: 'delivery-routed' is not editable - it's an admin status (driver can access but not edit)
 */
export function canDriverEditJob(job: Job | null | undefined): boolean {
  if (!job) return false;
  
  // Normalize the job status for comparison
  const normalizedStatus = normalizeStatusForCheck(job.status);
  
  // Normalize status variants for consistency
  const normalized = normalizedStatus === 'delivery_arrived' ? 'delivery-arrived'
    : normalizedStatus === 'delivery_en_route' ? 'delivery-en-route'
    : normalizedStatus === 'delivery_routed' ? 'delivery-routed'
    : normalizedStatus === 'in_transit' ? 'in-transit'
    : normalizedStatus;
  
  // Base editable statuses (before checking final statuses)
  const baseEditableStatuses = ['routed', 'en-route', 'arrived', 'collected', 'in-transit', 'delivery-en-route', 'delivery-arrived'];
  
  if (!baseEditableStatuses.includes(normalized)) {
    return false;
  }
  
  // Check if current status is a final driver status (non-editable) based on booking type
  const bookingType = job.bookingType;
  const jmlSubType = job.jmlSubType;
  
  // ITAD and Leaver: warehouse is final driver status
  if ((!bookingType || bookingType === 'itad_collection' || (bookingType === 'jml' && jmlSubType === 'leaver')) && normalized === 'warehouse') {
    return false;
  }
  
  // New Starter: arrived is final driver status
  if (bookingType === 'jml' && jmlSubType === 'new_starter' && normalized === 'arrived') {
    return false;
  }
  
  // Mover: warehouse is final driver status for first phase (old device collection)
  // Then delivery-arrived is final driver status for second phase (new device delivery)
  if (bookingType === 'jml' && jmlSubType === 'mover') {
    if (normalized === 'warehouse' || normalized === 'delivery-arrived') {
      return false;
    }
  }
  
  // Breakfix: arrived is final driver status for first phase (replacement delivery)
  // Then warehouse is final driver status for second phase (broken device collection)
  if (bookingType === 'jml' && jmlSubType === 'breakfix') {
    if (normalized === 'arrived' || normalized === 'warehouse') {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a job status is the final driver status for a booking type
 * Final driver statuses:
 * - ITAD/Leaver: warehouse
 * - New Starter: arrived
 * - Mover: warehouse (first phase), delivery-arrived (second phase)
 * - Breakfix: arrived (first phase), warehouse (second phase)
 */
export function isDriverFinalStatus(job: Job | null | undefined, status: string): boolean {
  if (!job) return false;
  
  // Normalize the status for comparison
  const normalizedStatus = normalizeStatusForCheck(status);
  const normalized = normalizedStatus === 'delivery_arrived' ? 'delivery-arrived'
    : normalizedStatus === 'delivery_en_route' ? 'delivery-en-route'
    : normalizedStatus === 'delivery_routed' ? 'delivery-routed'
    : normalizedStatus === 'in_transit' ? 'in-transit'
    : normalizedStatus;
  
  const bookingType = job.bookingType;
  const jmlSubType = job.jmlSubType;
  
  // ITAD and Leaver: warehouse is final driver status
  if ((!bookingType || bookingType === 'itad_collection' || (bookingType === 'jml' && jmlSubType === 'leaver')) && normalized === 'warehouse') {
    return true;
  }
  
  // New Starter: arrived is final driver status
  if (bookingType === 'jml' && jmlSubType === 'new_starter' && normalized === 'arrived') {
    return true;
  }
  
  // Mover: warehouse (first phase) or delivery-arrived (second phase) are final driver statuses
  if (bookingType === 'jml' && jmlSubType === 'mover' && (normalized === 'warehouse' || normalized === 'delivery-arrived')) {
    return true;
  }
  
  // Breakfix: arrived (first phase) or warehouse (second phase) are final driver statuses
  if (bookingType === 'jml' && jmlSubType === 'breakfix' && (normalized === 'arrived' || normalized === 'warehouse')) {
    return true;
  }
  
  return false;
}
