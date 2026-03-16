// JML Booking Service
import { ApiError, ApiErrorType } from './api-error';
import { apiClient } from './api-client';

export interface NewStarterRequest {
  clientId?: string;
  clientName?: string;
  employeeName: string;
  email: string;
  address: string;
  postcode: string;
  phone: string;
  startDate: string;
  deviceType: 'Windows' | 'Apple';
  siteName: string;
  lat?: number;
  lng?: number;
  devices?: Array<{
    category: string;
    make: string;
    model: string;
    quantity: number;
    deviceType: 'Windows' | 'Apple';
  }>;
}

export interface LeaverRequest {
  clientId?: string;
  clientName?: string;
  leaverName: string;
  address: string;
  postcode: string;
  personalEmail: string;
  phone: string;
  leavingDate: string;
  siteName: string;
  lat?: number;
  lng?: number;
  devices?: Array<{
    category: string;
    make: string;
    model: string;
    quantity: number;
    deviceType: 'Windows' | 'Apple';
  }>;
  charityPercent?: number;
  preferredVehicleType?: 'petrol' | 'diesel' | 'electric';
  assets?: Array<{
    categoryId: string;
    quantity: number;
  }>;
}

export interface BreakfixRequest {
  clientId?: string;
  clientName?: string;
  employeeName: string;
  email: string;
  address: string;
  postcode: string;
  phone: string;
  siteName: string;
  brokenDevices: Array<{
    category: string;
    make: string;
    model: string;
    quantity: number;
    deviceType: 'Windows' | 'Apple';
  }>;
  deviceType: 'Windows' | 'Apple';
  lat?: number;
  lng?: number;
}

export interface MoverRequest {
  clientId?: string;
  clientName?: string;
  employeeName: string;
  email: string;
  address: string; // New address (delivery)
  postcode: string; // New address postcode
  phone: string;
  siteName: string; // New address site name
  scheduledDate: string; // Move date
  currentAddress?: string; // Current address (collection) - optional for backward compatibility
  currentPostcode?: string; // Current address postcode
  currentSiteName?: string; // Current address site name
  currentLat?: number; // Current address latitude
  currentLng?: number; // Current address longitude
  currentDevices: Array<{
    category: string;
    make: string;
    model: string;
    quantity: number;
    deviceType: 'Windows' | 'Apple';
  }>;
  deviceType?: 'Windows' | 'Apple'; // Optional - removed replacement device section
  lat?: number; // New address latitude
  lng?: number; // New address longitude
}

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  erpJobNumber?: string;
  status: string;
  createdAt: string;
  bookingType: 'itad_collection' | 'jml';
  jmlSubType?: 'new_starter' | 'leaver' | 'breakfix' | 'mover';
  employeeName?: string;
  employeeEmail?: string;
  employeePhone?: string;
  startDate?: string;
  deviceType?: string;
  courierTracking?: string;
  deliveryDate?: string;
}

class JMLBookingService {
  async createNewStarter(request: NewStarterRequest): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>('/bookings/jml/new-starter', request);
    return response;
  }

  async createLeaver(request: LeaverRequest): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>('/bookings/jml/leaver', request);
    return response;
  }

  async createBreakfix(request: BreakfixRequest): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>('/bookings/jml/breakfix', request);
    return response;
  }

  async createMover(request: MoverRequest): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>('/bookings/jml/mover', request);
    return response;
  }

  async allocateDevice(bookingId: string, serialNumber: string): Promise<BookingResponse> {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${bookingId}/allocate-device`, {
      serialNumber,
    });
    return response;
  }

  async updateCourierTracking(bookingId: string, trackingNumber: string): Promise<BookingResponse> {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${bookingId}/courier-tracking`, {
      trackingNumber,
    });
    return response;
  }

  async markDelivered(bookingId: string): Promise<BookingResponse> {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${bookingId}/mark-delivered`, {});
    return response;
  }

  async markCollected(
    bookingId: string,
    items: Array<{
      make: string;
      model: string;
      serialNumber: string;
      imei?: string;
      accessories?: string[];
    }>
  ): Promise<BookingResponse> {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${bookingId}/mark-collected`, {
      items,
    });
    return response;
  }
}

export const jmlBookingService = new JMLBookingService();
