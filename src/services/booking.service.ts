// Mock Booking Service
import type { Job } from '@/types/jobs';
import type { Booking } from '@/mocks/mock-entities';
import { mockJobs } from '@/mocks/mock-data';
import { mockBookings } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { assetCategories } from '@/mocks/mock-data';
import { calculateReuseCO2e, calculateBuybackEstimate, calculateRoundTripDistance, geocodePostcode, kmToMiles, calculateTravelEmissions } from '@/lib/calculations';
import { USE_MOCK_API } from '@/lib/config';
import { apiClient } from './api-client';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'booking';

export interface BookingRequest {
  clientId?: string; // For resellers: specify which client this booking is for
  clientName?: string; // Client name (from user's tenant name or selected client)
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
  preferredVehicleType?: 'petrol' | 'diesel' | 'electric'; // Vehicle type selected by client
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
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.createBookingAPI(request);
    }

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

    // Get client info (would come from client service in real app)
    const { mockClients } = await import('@/mocks/mock-entities');
    
    // Use provided clientName if available, otherwise look it up
    let clientName = request.clientName?.trim(); // Trim whitespace
    let clientId = request.clientId;
    let resellerId: string | undefined;
    let resellerName: string | undefined;
    
    // Priority 1: If clientId is provided, always look up client name from mockClients (most reliable)
    if (clientId) {
      const client = mockClients.find(c => c.tenantId === clientId);
      if (client) {
        // Use the client name from mockClients (authoritative source)
        clientName = client.name;
        // If client has a reseller, set reseller info
        if (client.resellerId && client.resellerName) {
          resellerId = client.resellerId;
          resellerName = client.resellerName;
        }
      } else if (!clientName || clientName.length === 0) {
        // If client not found and no clientName provided, use default
        clientName = 'Client Name';
      }
      // If clientName was provided and client found, keep the provided name (but clientId takes precedence for lookup)
    } else if (clientName && clientName.length > 0) {
      // Priority 2: If clientName provided but no clientId, try to find matching client
      const client = mockClients.find(c => c.name === clientName);
      if (client) {
        clientId = client.tenantId;
        // Use the client name from mockClients for consistency
        clientName = client.name;
        // If client has a reseller, set reseller info
        if (client.resellerId && client.resellerName) {
          resellerId = client.resellerId;
          resellerName = client.resellerName;
        }
      } else {
        // Client not found, use default clientId
        clientId = 'tenant-2';
      }
    } else {
      // Priority 3: Neither provided, use safe defaults (never fall back to contact full name)
      clientName = 'Client Organisation';
      clientId = 'tenant-2';
    }
    
    // Final validation - ensure clientName is never empty
    if (!clientName || clientName.trim().length === 0) {
      clientName = 'Client Name';
    }

    // Get asset category names
    const assetCategoriesWithNames = request.assets.map(asset => {
      const category = assetCategories.find(c => c.id === asset.categoryId);
      return {
        categoryId: asset.categoryId,
        categoryName: category?.name || asset.categoryId,
        quantity: asset.quantity,
      };
    });

    // Calculate round trip distance
    let roundTripDistanceKm = 0;
    let roundTripDistanceMiles = 0;
    
    if (request.coordinates) {
      // Use provided coordinates
      roundTripDistanceKm = calculateRoundTripDistance(
        request.coordinates.lat,
        request.coordinates.lng
      );
      roundTripDistanceMiles = kmToMiles(roundTripDistanceKm);
    } else if (request.postcode) {
      // Try to geocode postcode and calculate distance
      try {
        const coordinates = await geocodePostcode(request.postcode);
        if (coordinates) {
          roundTripDistanceKm = calculateRoundTripDistance(
            coordinates.lat,
            coordinates.lng
          );
          roundTripDistanceMiles = kmToMiles(roundTripDistanceKm);
        } else {
          // Fallback to default
          roundTripDistanceKm = 80;
          roundTripDistanceMiles = kmToMiles(80);
        }
      } catch (error) {
        console.error('Failed to geocode postcode:', error);
        // Fallback to default
        roundTripDistanceKm = 80;
        roundTripDistanceMiles = kmToMiles(80);
      }
    } else {
      // Extract postcode from address if available
      const postcodeMatch = request.address.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i);
      if (postcodeMatch) {
        try {
          const postcode = postcodeMatch[0].replace(/\s+/g, ' ').trim().toUpperCase();
          const coordinates = await geocodePostcode(postcode);
          if (coordinates) {
            roundTripDistanceKm = calculateRoundTripDistance(
              coordinates.lat,
              coordinates.lng
            );
            roundTripDistanceMiles = kmToMiles(roundTripDistanceKm);
          } else {
            roundTripDistanceKm = 80;
            roundTripDistanceMiles = kmToMiles(80);
          }
        } catch (error) {
          console.error('Failed to geocode postcode from address:', error);
          roundTripDistanceKm = 80;
          roundTripDistanceMiles = kmToMiles(80);
        }
      } else {
        // Default fallback
        roundTripDistanceKm = 80;
        roundTripDistanceMiles = kmToMiles(80);
      }
    }

    // When using API, the backend will create the booking
    // We only create mock booking when using mock mode
    if (USE_MOCK_API) {
      // Create booking entity
      const bookingId = `booking-${Date.now()}`;
      const bookingNumber = `BK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
      
      const newBooking: Booking = {
        id: bookingId,
        bookingNumber,
        clientId,
        clientName,
        resellerId, // Set resellerId if client belongs to a reseller
        resellerName, // Set resellerName if client belongs to a reseller
        siteName: request.siteName,
        siteAddress: request.address,
        scheduledDate: request.scheduledDate,
        status: 'created',
        assets: assetCategoriesWithNames,
        charityPercent: request.charityPercent || 0,
        estimatedCO2e,
        estimatedBuyback,
        preferredVehicleType: request.preferredVehicleType, // Save client's vehicle preference
        roundTripDistanceKm, // Save calculated round trip distance
        roundTripDistanceMiles, // Save calculated round trip distance in miles
        createdAt: new Date().toISOString(),
        createdBy: clientId, // In real app would be actual user ID
      };

      // Add booking to mockBookings array
      mockBookings.push(newBooking);

      // Generate mock job response (for backward compatibility)
      const newJob: BookingResponse = {
        id: bookingId,
        erpJobNumber: bookingNumber,
        status: 'created',
        estimatedCO2e,
        estimatedBuyback,
        createdAt: new Date().toISOString(),
      };

      return newJob;
    }

    // When using API, backend handles everything
    // The createBookingAPI method will be called instead
    throw new Error('This code path should not be reached when using API');
  }

  private async createBookingAPI(request: BookingRequest): Promise<BookingResponse> {
    const payload = {
      clientId: request.clientId,
      clientName: request.clientName,
      siteId: request.siteId,
      siteName: request.siteName,
      address: request.address,
      postcode: request.postcode,
      lat: request.coordinates?.lat,
      lng: request.coordinates?.lng,
      scheduledDate: request.scheduledDate,
      assets: request.assets,
      charityPercent: request.charityPercent || 0,
      preferredVehicleType: request.preferredVehicleType,
    };

    const response = await apiClient.post<BookingResponse>('/bookings', payload);
    return response;
  }

  async getBooking(id: string): Promise<Job | null> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getBookingAPI(id);
    }

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

  private async getBookingAPI(id: string): Promise<Job | null> {
    try {
      const booking = await apiClient.get<Job>(`/bookings/${id}`);
      return booking;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getBookings(user?: User | null, filter?: { status?: string; clientId?: string }): Promise<Booking[]> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getBookingsAPI(filter);
    }
    
    return this.getBookingsMock(user, filter);
  }

  private async getBookingsAPI(filter?: { status?: string; clientId?: string }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filter?.status) {
      params.append('status', filter.status);
    }
    if (filter?.clientId) {
      params.append('clientId', filter.clientId);
    }

    const queryString = params.toString();
    const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;
    
    const bookings = await apiClient.get<Booking[]>(endpoint);
    return bookings;
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
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getBookingByIdAPI(id);
    }
    
    return this.getBookingByIdMock(id);
  }

  private async getBookingByIdAPI(id: string): Promise<Booking | null> {
    try {
      const booking = await apiClient.get<Booking>(`/bookings/${id}`);
      return booking;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
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
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.assignDriverAPI(bookingId, driverId);
    }
    
    return this.assignDriverMock(bookingId, driverId, scheduledBy);
  }

  private async assignDriverAPI(bookingId: string, driverId: string): Promise<Booking> {
    const booking = await apiClient.post<Booking>(`/bookings/${bookingId}/assign-driver`, { driverId });
    return booking;
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
    // For now, use a simple lookup from mockJobs or driverVehicleInfo mapping
    const existingJobWithDriver = mockJobs.find(j => j.driver?.id === driverId);
    let driver = existingJobWithDriver?.driver;
    
    // If not found in jobs, try to get from driverVehicleInfo (from Assignment page)
    if (!driver) {
      // Driver vehicle information mapping (in a real app, this would come from the backend)
      const driverVehicleInfo: Record<string, { 
        vehicleReg: string; 
        vehicleType: 'van' | 'truck' | 'car';
        vehicleFuelType: 'petrol' | 'diesel' | 'electric';
      }> = {
        'user-4': { vehicleReg: 'AB12 CDE', vehicleType: 'van', vehicleFuelType: 'diesel' }, // James Wilson
        'user-6': { vehicleReg: 'XY34 FGH', vehicleType: 'truck', vehicleFuelType: 'diesel' }, // Sarah Chen
        'user-7': { vehicleReg: 'CD56 IJK', vehicleType: 'truck', vehicleFuelType: 'diesel' }, // Mike Thompson
        'user-8': { vehicleReg: 'EF78 LMN', vehicleType: 'truck', vehicleFuelType: 'petrol' }, // Emma Davis
        'user-9': { vehicleReg: 'GH90 OPQ', vehicleType: 'van', vehicleFuelType: 'electric' }, // David Martinez
        'user-10': { vehicleReg: 'IJ12 RST', vehicleType: 'van', vehicleFuelType: 'petrol' }, // Lisa Anderson
      };
      
      const vehicleInfo = driverVehicleInfo[driverId];
      if (vehicleInfo) {
        // Get driver name from users (would come from users service in real app)
        try {
          const { mockExtendedUsers } = await import('@/mocks/mock-entities');
          const user = mockExtendedUsers && Array.isArray(mockExtendedUsers) 
            ? mockExtendedUsers.find(u => u.id === driverId)
            : null;
          driver = {
            id: driverId,
            name: user?.name || 'Driver Name',
            vehicleReg: vehicleInfo.vehicleReg,
            vehicleType: vehicleInfo.vehicleType,
            vehicleFuelType: vehicleInfo.vehicleFuelType,
            phone: user?.email || '+44 7700 900000',
          };
        } catch (error) {
          // Fallback if import fails
          driver = {
            id: driverId,
            name: 'Driver Name',
            vehicleReg: vehicleInfo.vehicleReg,
            vehicleType: vehicleInfo.vehicleType,
            vehicleFuelType: vehicleInfo.vehicleFuelType,
            phone: '+44 7700 900000',
          };
        }
      }
    }
    
    // Final fallback
    if (!driver) {
      driver = { 
      id: driverId, 
      name: 'Driver Name', 
      vehicleReg: 'XX00 XXX', 
      vehicleType: 'van' as const, 
        vehicleFuelType: 'diesel' as const,
      phone: '+44 7700 900000' 
    };
    }

    booking.status = 'scheduled';
    booking.driverId = driverId;
    booking.driverName = driver.name;
    booking.scheduledBy = scheduledBy;
    booking.scheduledAt = new Date().toISOString();

    // Create a job for this booking (if not already created)
    // Job is created with status 'routed' (driver can then move to 'en-route')
    if (!booking.jobId) {
      const jobId = `job-${Date.now()}`;
      const erpJobNumber = `ERP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      
      // Convert booking assets to job assets format
      const jobAssets = booking.assets.map((asset, idx) => ({
        id: `asset-${jobId}-${idx}`,
        category: asset.categoryId,
        quantity: asset.quantity,
      }));

      // Calculate travel emissions based on booking's round trip distance and driver's vehicle type
      // Use driver's vehicleFuelType if available, otherwise use booking's preferredVehicleType, otherwise default to 'diesel'
      const vehicleFuelType = driver.vehicleFuelType || booking.preferredVehicleType || 'diesel';
      const roundTripDistanceKm = booking.roundTripDistanceKm || 80; // Fallback to 80km if not set
      const travelEmissions = calculateTravelEmissions(roundTripDistanceKm, vehicleFuelType);

      const newJob: Job = {
        id: jobId,
        erpJobNumber,
        bookingId: booking.id, // Link job to booking
        clientName: booking.clientName,
        siteName: booking.siteName,
        siteAddress: booking.siteAddress,
        status: 'routed', // Job starts as 'routed' when driver assigned
        scheduledDate: booking.scheduledDate,
        assets: jobAssets,
        driver: {
          id: driver.id,
          name: driver.name,
          vehicleReg: driver.vehicleReg,
          vehicleType: driver.vehicleType,
          vehicleFuelType: driver.vehicleFuelType,
          phone: driver.phone,
        },
        co2eSaved: booking.estimatedCO2e,
        travelEmissions, // Calculate from booking's round trip distance and driver's vehicle type
        buybackValue: booking.estimatedBuyback,
        charityPercent: booking.charityPercent,
        certificates: [],
      };

      // Add job to mockJobs array
      mockJobs.push(newJob);
      booking.jobId = jobId;
    }

    return booking;
  }

  async completeBooking(bookingId: string, completedBy: string): Promise<Booking> {
    if (!USE_MOCK_API) {
      return this.completeBookingAPI(bookingId, completedBy);
    }
    return this.completeBookingMock(bookingId, completedBy);
  }

  private async completeBookingAPI(bookingId: string, completedBy: string): Promise<Booking> {
    // Use the new /complete endpoint for final approval
    const booking = await apiClient.post<Booking>(`/bookings/${bookingId}/complete`, {});
    return booking;
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

    // Update linked job status to 'completed'
    if (booking.jobId) {
      const job = mockJobs.find(j => j.id === booking.jobId);
      if (job && job.status === 'graded') {
        job.status = 'completed';
        job.completedDate = new Date().toISOString();
      }
    }

    // Auto-create commission if reseller exists
    if (booking.resellerId && booking.resellerName) {
      try {
        const { mockCommissions } = await import('@/mocks/mock-entities');
        const commissionPercent = 10; // Default commission percentage (would come from reseller config)
        const commissionAmount = Math.round(booking.estimatedBuyback * (commissionPercent / 100));
        const period = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const newCommission = {
          id: `comm-${Date.now()}`,
          resellerId: booking.resellerId,
          resellerName: booking.resellerName,
          clientId: booking.clientId,
          clientName: booking.clientName,
          jobId: booking.jobId || '',
          jobNumber: booking.jobId ? `ERP-${booking.jobId}` : '',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          commissionPercent,
          jobValue: booking.estimatedBuyback,
          commissionAmount,
          status: 'pending' as const,
          period,
          createdAt: new Date().toISOString(),
        };
        
        mockCommissions.push(newCommission);
      } catch (error) {
        console.error('Failed to create commission:', error);
      }
    }

    // Auto-create invoice
    try {
      const { mockInvoices } = await import('@/mocks/mock-entities');
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(mockInvoices.length + 1).padStart(5, '0')}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now
      
      // Create invoice items from booking assets
      const items = booking.assets.map(asset => {
        const unitPrice = Math.round(booking.estimatedBuyback / booking.assets.reduce((sum, a) => sum + a.quantity, 0));
        return {
          description: `${asset.categoryName} Collection & Processing (${asset.quantity} units)`,
          quantity: asset.quantity,
          unitPrice,
          total: unitPrice * asset.quantity,
        };
      });
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = Math.round(subtotal * 0.2); // 20% VAT
      const total = subtotal + tax;
      
      const newInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        clientId: booking.clientId,
        clientName: booking.clientName,
        jobId: booking.jobId || '',
        jobNumber: booking.jobId ? `ERP-${booking.jobId}` : '',
        issueDate,
        dueDate,
        amount: subtotal,
        status: 'draft' as const,
        items,
        subtotal,
        tax,
        total,
        downloadUrl: '#',
      };
      
      mockInvoices.push(newInvoice);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }

    return booking;
  }

  async approveBooking(bookingId: string, erpJobNumber: string, notes?: string): Promise<Booking> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.approveBookingAPI(bookingId, erpJobNumber, notes);
    }
    
    return this.approveBookingMock(bookingId, erpJobNumber, notes);
  }

  private async approveBookingAPI(bookingId: string, erpJobNumber: string, notes?: string): Promise<Booking> {
    const booking = await apiClient.post<Booking>(`/bookings/${bookingId}/approve`, { erpJobNumber, notes });
    return booking;
  }

  private async approveBookingMock(bookingId: string, erpJobNumber: string, notes?: string): Promise<Booking> {
    await delay(800);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to approve booking. Please try again.',
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

    if (booking.status !== 'pending') {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Cannot approve booking in "${booking.status}" status. Only "pending" bookings can be approved.`,
        400,
        { bookingId, currentStatus: booking.status }
      );
    }

    // Update booking with ERP Job Number
    booking.erpJobNumber = erpJobNumber;
    booking.status = 'created';
    return booking;
  }

  async updateBookingStatus(bookingId: string, status: Booking['status'], notes?: string): Promise<Booking> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.updateBookingStatusAPI(bookingId, status, notes);
    }
    
    return this.updateBookingStatusMock(bookingId, status, notes);
  }

  private async updateBookingStatusAPI(bookingId: string, status: Booking['status'], notes?: string): Promise<Booking> {
    const booking = await apiClient.patch<Booking>(`/bookings/${bookingId}/status`, { status, notes });
    return booking;
  }

  private async updateBookingStatusMock(bookingId: string, status: Booking['status'], notes?: string): Promise<Booking> {
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
    
    // Store cancellation notes if provided
    if (status === 'cancelled' && notes) {
      booking.cancellationNotes = notes;
    }
    
    // Set timestamps
    if (status === 'sanitised' && !booking.sanitisedAt) {
      booking.sanitisedAt = new Date().toISOString();
    } else if (status === 'graded' && !booking.gradedAt) {
      booking.gradedAt = new Date().toISOString();
    } else if (status === 'completed' && !booking.completedAt) {
      booking.completedAt = new Date().toISOString();
    }
    
    // Sync job status when booking status changes
    if (booking.jobId) {
      const job = mockJobs.find(j => j.id === booking.jobId);
      if (job) {
        if (status === 'sanitised' && job.status === 'warehouse') {
          job.status = 'sanitised';
        } else if (status === 'graded' && job.status === 'sanitised') {
          job.status = 'graded';
        } else if (status === 'completed' && job.status === 'graded') {
          job.status = 'completed';
          job.completedDate = new Date().toISOString();
        }
      }
    }
    
    return booking;
  }
}

export const bookingService = new BookingService();

