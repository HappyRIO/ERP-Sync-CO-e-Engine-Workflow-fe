// Driver Service
import type { User } from '@/types/auth';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API, API_BASE_URL } from '@/lib/config';
import { apiClient } from './api-client';

const SERVICE_NAME = 'driver';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  vehicleReg: string;
  vehicleType: 'van' | 'truck' | 'car';
  vehicleFuelType: 'petrol' | 'diesel' | 'electric';
  hasProfile: boolean;
}

export interface DriverProfileRequest {
  userId?: string;
  name?: string;
  email?: string;
  vehicleReg: string;
  vehicleType: 'van' | 'truck' | 'car';
  vehicleFuelType: 'petrol' | 'diesel' | 'electric';
  phone?: string;
}

class DriverService {
  async getDrivers(): Promise<Driver[]> {
    if (!USE_MOCK_API) {
      return this.getDriversAPI();
    }
    return this.getDriversMock();
  }

  private async getDriversAPI(): Promise<Driver[]> {
    const drivers = await apiClient.get<Driver[]>('/drivers');
    return drivers;
  }

  private async getDriversMock(): Promise<Driver[]> {
    await delay(500);
    
    if (shouldSimulateError(SERVICE_NAME)) {
      throw new ApiError(
        ApiErrorType.NETWORK_ERROR,
        'Failed to fetch drivers. Please try again.',
        500
      );
    }

    // Return empty array for now - will be populated from backend
    return [];
  }

  async getDriverById(id: string): Promise<Driver | null> {
    if (!USE_MOCK_API) {
      return this.getDriverByIdAPI(id);
    }
    return this.getDriverByIdMock(id);
  }

  private async getDriverByIdAPI(id: string): Promise<Driver | null> {
    try {
      const driver = await apiClient.get<Driver>(`/drivers/${id}`);
      return driver;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  private async getDriverByIdMock(id: string): Promise<Driver | null> {
    await delay(300);
    return null;
  }

  async createOrUpdateProfile(data: DriverProfileRequest): Promise<any> {
    if (!USE_MOCK_API) {
      return this.createOrUpdateProfileAPI(data);
    }
    return this.createOrUpdateProfileMock(data);
  }

  private async createOrUpdateProfileAPI(data: DriverProfileRequest): Promise<any> {
    return apiClient.post('/drivers/profile', data);
  }

  private async createOrUpdateProfileMock(data: DriverProfileRequest): Promise<any> {
    await delay(600);
    return { success: true, data };
  }

  async updateProfile(driverId: string, data: Partial<DriverProfileRequest>): Promise<any> {
    if (!USE_MOCK_API) {
      return this.updateProfileAPI(driverId, data);
    }
    return this.updateProfileMock(driverId, data);
  }

  private async updateProfileAPI(driverId: string, data: Partial<DriverProfileRequest>): Promise<any> {
    return apiClient.patch(`/drivers/${driverId}/profile`, data);
  }

  private async updateProfileMock(driverId: string, data: Partial<DriverProfileRequest>): Promise<any> {
    await delay(600);
    return { success: true, data };
  }

  async deleteProfile(driverId: string): Promise<void> {
    if (!USE_MOCK_API) {
      return this.deleteProfileAPI(driverId);
    }
    return this.deleteProfileMock(driverId);
  }

  private async deleteProfileAPI(driverId: string): Promise<void> {
    await apiClient.delete(`/drivers/${driverId}/profile`);
  }

  private async deleteProfileMock(driverId: string): Promise<void> {
    await delay(300);
  }
}

export const driverService = new DriverService();

