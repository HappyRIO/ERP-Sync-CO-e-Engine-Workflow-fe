export type BookingLifecycleStatus = 
  | 'pending'       // Booking submitted by client/reseller, awaiting admin approval
  | 'created'       // Booking approved by admin, now active
  | 'scheduled'     // Admin has scheduled and assigned driver
  | 'collected'     // Driver has collected assets
  | 'warehouse'     // Assets at warehouse (ITAD and Leaver)
  | 'sanitised'     // Admin/Ops have sanitised assets
  | 'graded'        // Admin/Ops have graded assets
  | 'completed'     // Final state - all processes complete
  | 'device_allocated'  // JML: Device allocated from inventory
  | 'courier_booked'    // JML: Courier booked
  | 'in_transit'        // JML: In transit (with assets)
  | 'delivered'         // JML: Delivered
  | 'collection_scheduled' // JML: Collection scheduled
  | 'delivery_scheduled'  // Breakfix re-delivery scheduling
  | 'inventory'          // Leaver: Added to inventory (handles both reuse and disposal)

export const lifecycleTransitions: Record<BookingLifecycleStatus, (BookingLifecycleStatus | 'cancelled')[]> = {
  pending: ['created', 'cancelled', 'device_allocated'], // JML can go to device_allocated
  created: ['scheduled', 'cancelled'],
  scheduled: ['collected', 'cancelled', 'courier_booked'], // JML can go to courier_booked
  collected: ['sanitised', 'warehouse', 'in_transit'], // ITAD: sanitised, Leaver: warehouse, New-starter/Mover: in_transit
  warehouse: ['sanitised'], // ITAD and Leaver: warehouse → sanitised
  sanitised: ['graded'],
  graded: ['completed', 'delivery_scheduled', 'inventory'], // ITAD: completed, Leaver: inventory, Breakfix: delivery_scheduled (re-delivery)
  inventory: ['completed'], // Added to inventory (handles both reuse and disposal)
  completed: [], // Terminal state
  device_allocated: ['courier_booked', 'cancelled'],
  courier_booked: ['in_transit', 'delivered', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['completed'], // JML new starter/mover/breakfix outbound - ticket closed
  collection_scheduled: ['collected', 'cancelled'], // JML leaver - collection scheduled
  delivery_scheduled: ['in_transit', 'cancelled'], // Breakfix: delivery_scheduled → in_transit
};

export const roleTransitionPermissions: Record<string, BookingLifecycleStatus[]> = {
  admin: ['scheduled', 'sanitised', 'graded', 'completed', 'inventory', 'device_allocated', 'courier_booked'],
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
    warehouse: 'At Warehouse',
    sanitised: 'Sanitised',
    graded: 'Graded',
    completed: 'Completed',
    device_allocated: 'Device Allocated',
    courier_booked: 'Courier Booked',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    collection_scheduled: 'Collection Scheduled',
    delivery_scheduled: 'Delivery Scheduled', // Breakfix re-delivery
    inventory: 'Inventory',
  };
  return labels[status] || status;
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
    warehouse: 'bg-secondary-foreground/10 text-secondary-foreground',
    sanitised: 'bg-accent/10 text-accent',
    graded: 'bg-success/10 text-success',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
    device_allocated: 'bg-blue-500/10 text-blue-500',
    courier_booked: 'bg-purple-500/10 text-purple-500',
    in_transit: 'bg-orange-500/10 text-orange-500',
    delivered: 'bg-green-500/10 text-green-500',
    collection_scheduled: 'bg-cyan-500/10 text-cyan-500',
    delivery_scheduled: 'bg-indigo-500/10 text-indigo-500', // Breakfix re-delivery
    inventory: 'bg-green-500/10 text-green-500',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-500';
}

/**
 * Get status label for display (including cancelled)
 */
export function getStatusLabelExtended(status: BookingLifecycleStatus | 'cancelled'): string {
  if (status === 'cancelled') return 'Cancelled';
  return getStatusLabel(status);
}

