import type { User } from '@/types/auth';
import type { BookingLifecycleStatus } from '@/types/booking-lifecycle';

export interface ExtendedUser extends User {
  isActive: boolean;
  status?: 'pending' | 'active' | 'inactive' | 'declined';
  lastLogin?: string;
  invitedBy?: string;
}

export interface Client {
  id: string;
  name: string;
  organisationName?: string;
  tenantId: string;
  tenantName: string;
  email: string;
  contactName: string;
  contactPhone: string;
  resellerId?: string;
  resellerName?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  totalBookings: number;
  totalJobs: number;
  totalValue: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  organisationName?: string;
  resellerId?: string;
  resellerName?: string;
  siteName: string;
  siteAddress: string;
  scheduledDate: string;
  status: BookingLifecycleStatus | 'cancelled';
  assets: Array<{
    categoryId: string;
    categoryName: string;
    quantity: number;
  }>;
  charityPercent: number;
  estimatedCO2e: number;
  estimatedBuyback: number;
  preferredVehicleType?: 'petrol' | 'diesel' | 'electric';
  roundTripDistanceKm?: number;
  roundTripDistanceMiles?: number;
  jobId?: string;
  driverId?: string;
  driverName?: string;
  createdAt: string;
  createdBy: string;
  scheduledBy?: string;
  scheduledAt?: string;
  collectedAt?: string;
  sanitisedAt?: string;
  gradedAt?: string;
  completedAt?: string;
  notes?: string;
  cancellationNotes?: string;
}

export interface SanitisationRecord {
  id: string;
  bookingId: string;
  jobId?: string;
  assetId: string;
  method: 'blancco' | 'physical-destruction' | 'degaussing' | 'shredding' | 'other';
  methodDetails?: string;
  timestamp: string;
  performedBy: string;
  certificateId: string;
  certificateUrl: string;
  verified: boolean;
  notes?: string;
}

export interface GradingRecord {
  id: string;
  bookingId: string;
  jobId?: string;
  assetId: string;
  assetCategory: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'Recycled';
  resaleValue: number;
  gradedAt: string;
  gradedBy: string;
  notes?: string;
  condition?: string;
}
