// Mock Booking Service
import type { Job } from '@/types/jobs';
import type { Booking } from '@/mocks/mock-entities';
import { mockJobs } from '@/mocks/mock-data';
import { mockBookings } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { assetCategories } from '@/mocks/mock-data';
import { calculateReuseCO2e, calculateBuybackEstimate } from '@/lib/calculations';
import { USE_MOCK_API } from '@/lib/config';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'booking';

export interface BookingRequest {
  siteId?: string;
  siteName: string;
  address: string;
  postcode: string;
  contactName?: string;
  contactPhone?: string;
  scheduledDate: string;
  assets: Array<{
    categoryId: string;
    quantity: number;
  }>;
  charityPercent?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BookingResponse {
  id: string;
  erpJobNumber: string;
  status: string;
  estimatedCO2e: number;
  estimatedBuyback: number;
  createdAt: string;
}

class BookingService {
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    await delay(1500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to create booking. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Validate input
    if (!request.siteName || !request.address || !request.postcode) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Site name, address, and postcode are required.',
        400
      );
    }

    if (!request.scheduledDate) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Scheduled date is required.',
        400
      );
    }

    // Validate scheduled date is in the future
    const scheduledDate = new Date(request.scheduledDate);
    if (scheduledDate < new Date()) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Scheduled date must be in the future.',
        400
      );
    }

    if (!request.assets || request.assets.length === 0) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'At least one asset must be selected.',
        400
      );
    }

    // Validate asset quantities
    for (const asset of request.assets) {
      if (asset.quantity <= 0) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          `Invalid quantity for asset category "${asset.categoryId}". Quantity must be greater than 0.`,
          400,
          { categoryId: asset.categoryId, quantity: asset.quantity }
        );
      }

      // Check if category exists
      const category = assetCategories.find(cat => cat.id === asset.categoryId);
      if (!category) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          `Invalid asset category "${asset.categoryId}".`,
          400,
          { categoryId: asset.categoryId }
        );
      }
    }

    // Validate charity percent
    const charityPercent = request.charityPercent ?? 0;
    if (charityPercent < 0 || charityPercent > 100) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Charity percentage must be between 0 and 100.',
        400
      );
    }

    // Calculate estimates
    const estimatedCO2e = calculateReuseCO2e(request.assets, assetCategories);
    const estimatedBuyback = calculateBuybackEstimate(request.assets, assetCategories);

    // Generate mock job
    const newJob: BookingResponse = {
      id: `job-${Date.now()}`,
      erpJobNumber: `ERP-2024-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      status: 'booked',
      estimatedCO2e,
      estimatedBuyback,
      createdAt: new Date().toISOString(),
    };

    return newJob;
  }

  async getBooking(id: string): Promise<Job | null> {
    await delay(500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Booking with ID "${id}" was not found.`,
          404,
          { bookingId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch booking. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const booking = mockJobs.find(j => j.id === id);
    
    if (!booking && shouldSimulateError(SERVICE_NAME)) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Booking with ID "${id}" was not found.`,
        404,
        { bookingId: id }
      );
    }

    return booking || null;
  }

  async getBookings(user?: User | null, filter?: { status?: string; clientId?: string }): Promise<Booking[]> {
    if (USE_MOCK_API) {
      return this.getBookingsMock(user, filter);
    }
    throw new Error('Real API not implemented yet');
  }

  private async getBookingsMock(user?: User | null, filter?: { status?: string; clientId?: string }): Promise<Booking[]> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch bookings. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let bookings = [...mockBookings];

    // Filter by user role
    if (user) {
      if (user.role === 'admin') {
        // Admin sees all bookings
      } else if (user.role === 'client') {
        // Client sees only their bookings
        bookings = bookings.filter(b => b.clientId === user.tenantId);
      } else if (user.role === 'reseller') {
        // Reseller sees bookings for their clients
        bookings = bookings.filter(b => b.resellerId === user.tenantId);
      }
    }

    // Apply filters
    if (filter) {
      if (filter.status) {
        bookings = bookings.filter(b => b.status === filter.status);
      }
      if (filter.clientId) {
        bookings = bookings.filter(b => b.clientId === filter.clientId);
      }
    }

    return bookings;
  }

  async getBookingById(id: string): Promise<Booking | null> {
    if (USE_MOCK_API) {
      return this.getBookingByIdMock(id);
    }
    throw new Error('Real API not implemented yet');
  }

  private async getBookingByIdMock(id: string): Promise<Booking | null> {
    await delay(300);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Booking with ID "${id}" was not found.`,
          404,
          { bookingId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch booking. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    return mockBookings.find(b => b.id === id) || null;
  }

  async assignDriver(bookingId: string, driverId: string, scheduledBy: string): Promise<Booking> {
    if (USE_MOCK_API) {
      return this.assignDriverMock(bookingId, driverId, scheduledBy);
    }
    throw new Error('Real API not implemented yet');
  }

  private async assignDriverMock(bookingId: string, driverId: string, scheduledBy: string): Promise<Booking> {
    await delay(800);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to assign driver. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Booking with ID "${bookingId}" was not found.`,
        404,
        { bookingId }
      );
    }

    if (booking.status !== 'created') {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Cannot assign driver to booking in "${booking.status}" status. Only "created" bookings can be assigned.`,
        400,
        { bookingId, currentStatus: booking.status }
      );
    }

    // Get driver info (would come from users service in real app)
    const driver = { id: driverId, name: 'Driver Name' }; // Simplified for mock

    booking.status = 'scheduled';
    booking.driverId = driverId;
    booking.driverName = driver.name;
    booking.scheduledBy = scheduledBy;
    booking.scheduledAt = new Date().toISOString();

    return booking;
  }

  async completeBooking(bookingId: string, completedBy: string): Promise<Booking> {
    if (USE_MOCK_API) {
      return this.completeBookingMock(bookingId, completedBy);
    }
    throw new Error('Real API not implemented yet');
  }

  private async completeBookingMock(bookingId: string, completedBy: string): Promise<Booking> {
    await delay(800);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to complete booking. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Booking with ID "${bookingId}" was not found.`,
        404,
        { bookingId }
      );
    }

    if (booking.status !== 'graded') {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Cannot complete booking in "${booking.status}" status. Only "graded" bookings can be completed.`,
        400,
        { bookingId, currentStatus: booking.status }
      );
    }

    booking.status = 'completed';
    booking.completedAt = new Date().toISOString();

    return booking;
  }

  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    if (USE_MOCK_API) {
      return this.updateBookingStatusMock(bookingId, status);
    }
    throw new Error('Real API not implemented yet');
  }

  private async updateBookingStatusMock(bookingId: string, status: Booking['status']): Promise<Booking> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update booking status. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Booking with ID "${bookingId}" was not found.`,
        404,
        { bookingId }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'created': ['scheduled'],
      'scheduled': ['collected'],
      'collected': ['sanitised'],
      'sanitised': ['graded'],
      'graded': ['completed'],
    };

    const currentStatus = booking.status;
    const allowedNextStatuses = validTransitions[currentStatus] || [];
    
    if (status !== currentStatus && allowedNextStatuses.length > 0 && !allowedNextStatuses.includes(status)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Invalid status transition from "${currentStatus}" to "${status}". Allowed next statuses: ${allowedNextStatuses.join(', ')}`,
        400,
        { bookingId, currentStatus, requestedStatus: status }
      );
    }

    booking.status = status;
    
    // Set completion date if moving to completed
    if (status === 'completed' && !booking.completedAt) {
      booking.completedAt = new Date().toISOString();
    }

    return booking;
  }
}

export const bookingService = new BookingService();

