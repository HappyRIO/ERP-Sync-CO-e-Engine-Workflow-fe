// Booking Lifecycle Types
// Authoritative lifecycle: PENDING → CREATED → SCHEDULED → COLLECTED → SANITISED → GRADED → COMPLETED

export type BookingLifecycleStatus = 
  | 'pending'       // Booking submitted by client/reseller, awaiting admin approval
  | 'created'       // Booking approved by admin, now active
  | 'scheduled'     // Admin has scheduled and assigned driver
  | 'collected'     // Driver has collected assets
  | 'sanitised'     // Admin/Ops have sanitised assets
  | 'graded'        // Admin/Ops have graded assets
  | 'completed';    // Final state - all processes complete

// Status transition rules
// Note: 'cancelled' is a special status outside the lifecycle
export const lifecycleTransitions: Record<BookingLifecycleStatus, (BookingLifecycleStatus | 'cancelled')[]> = {
  pending: ['created', 'cancelled'],
  created: ['scheduled', 'cancelled'],
  scheduled: ['collected', 'cancelled'],
  collected: ['sanitised'],
  sanitised: ['graded'],
  graded: ['completed'],
  completed: [], // Terminal state
};

// Role-based transition permissions
export const roleTransitionPermissions: Record<string, BookingLifecycleStatus[]> = {
  admin: ['scheduled', 'sanitised', 'graded', 'completed'],
  client: [], // Clients cannot change booking status
  reseller: [], // Resellers cannot change booking status
  driver: ['collected'], // Drivers can only mark as collected
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  from: BookingLifecycleStatus,
  to: BookingLifecycleStatus
): boolean {
  // Allow same status (no-op)
  if (from === to) return true;
  
  // Check if transition is in allowed list
  const allowed = lifecycleTransitions[from] || [];
  return allowed.includes(to);
}

/**
 * Check if a role can perform a status transition
 */
export function canRoleTransition(
  role: string,
  to: BookingLifecycleStatus
): boolean {
  const allowed = roleTransitionPermissions[role] || [];
  return allowed.includes(to);
}

/**
 * Get next valid statuses for a given current status
 */
export function getNextValidStatuses(
  current: BookingLifecycleStatus
): (BookingLifecycleStatus | 'cancelled')[] {
  return lifecycleTransitions[current] || [];
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: BookingLifecycleStatus): string {
  const labels: Record<BookingLifecycleStatus, string> = {
    pending: 'Pending',
    created: 'Created',
    scheduled: 'Scheduled',
    collected: 'Collected',
    sanitised: 'Sanitised',
    graded: 'Graded',
    completed: 'Completed',
  };
  return labels[status];
}

/**
 * Get status color for UI (text + background)
 */
export function getStatusColor(status: BookingLifecycleStatus | 'cancelled'): string {
  const colors: Record<BookingLifecycleStatus | 'cancelled', string> = {
    pending: 'bg-warning/10 text-warning',
    created: 'bg-info/10 text-info',
    scheduled: 'bg-warning/10 text-warning',
    collected: 'bg-primary/10 text-primary',
    sanitised: 'bg-accent/10 text-accent',
    graded: 'bg-success/10 text-success',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
  };
  return colors[status];
}

/**
 * Get status label for display (including cancelled)
 */
export function getStatusLabelExtended(status: BookingLifecycleStatus | 'cancelled'): string {
  if (status === 'cancelled') return 'Cancelled';
  return getStatusLabel(status);
}

