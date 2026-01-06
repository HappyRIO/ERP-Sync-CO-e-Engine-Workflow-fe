// Users Service (for admin user management)
import type { ExtendedUser } from '@/mocks/mock-entities';
import { mockExtendedUsers } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import { apiClient } from './api-client';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'users';

class UsersService {
  async getUsers(filter?: { role?: string; tenantId?: string; isActive?: boolean; status?: string }): Promise<ExtendedUser[]> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getUsersAPI(filter);
    }
    
    return this.getUsersMock(filter);
  }

  private async getUsersAPI(filter?: { role?: string; tenantId?: string; isActive?: boolean; status?: string }): Promise<ExtendedUser[]> {
    const params = new URLSearchParams();
    if (filter?.role) {
      params.append('role', filter.role);
    }
    if (filter?.status) {
      params.append('status', filter.status);
    }
    // Note: tenantId and isActive filters are handled client-side if needed
    // Backend returns all users for admin, so we filter client-side for tenantId/isActive

    const queryString = params.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    
    let users = await apiClient.get<ExtendedUser[]>(endpoint);
    
    // Apply client-side filters for tenantId and isActive if needed
    if (filter) {
      if (filter.tenantId) {
        users = users.filter(u => u.tenantId === filter.tenantId);
      }
      if (filter.isActive !== undefined) {
        users = users.filter(u => u.isActive === filter.isActive);
      }
    }
    
    return users;
  }

  private async getUsersMock(filter?: { role?: string; tenantId?: string; isActive?: boolean; status?: string }): Promise<ExtendedUser[]> {
    await delay(500);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch users. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let users = [...mockExtendedUsers];

    if (filter) {
      if (filter.role) {
        users = users.filter(u => u.role === filter.role);
      }
      if (filter.tenantId) {
        users = users.filter(u => u.tenantId === filter.tenantId);
      }
      if (filter.isActive !== undefined) {
        users = users.filter(u => u.isActive === filter.isActive);
      }
      if (filter.status) {
        users = users.filter(u => (u.status || (u.isActive ? 'active' : 'inactive')) === filter.status);
      }
    }

    return users;
  }

  async getUser(id: string): Promise<ExtendedUser | null> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getUserAPI(id);
    }
    
    return this.getUserMock(id);
  }

  private async getUserAPI(id: string): Promise<ExtendedUser | null> {
    try {
      const user = await apiClient.get<ExtendedUser>(`/users/${id}`);
      return user || null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  private async getUserMock(id: string): Promise<ExtendedUser | null> {
    await delay(300);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `User with ID "${id}" was not found.`,
          404,
          { userId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch user. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    return mockExtendedUsers.find(u => u.id === id) || null;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<ExtendedUser> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.updateUserStatusAPI(id, isActive);
    }
    
    return this.updateUserStatusMock(id, isActive);
  }

  private async updateUserStatusAPI(id: string, isActive: boolean): Promise<ExtendedUser> {
    const response = await apiClient.patch<ExtendedUser>(`/users/${id}/status`, { isActive });
    return response;
  }

  private async updateUserStatusMock(id: string, isActive: boolean): Promise<ExtendedUser> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `User with ID "${id}" was not found.`,
          404,
          { userId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update user status. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const user = mockExtendedUsers.find(u => u.id === id);
    if (!user) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `User with ID "${id}" was not found.`,
        404,
        { userId: id }
      );
    }

    user.isActive = isActive;
    // Update status based on isActive
    if (isActive) {
      user.status = 'active';
    } else {
      user.status = user.status === 'pending' ? 'pending' : 'inactive';
    }
    return user;
  }

  /**
   * Approve pending user (change status from pending to active)
   */
  async approveUser(id: string): Promise<ExtendedUser> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.approveUserAPI(id);
    }
    
    return this.approveUserMock(id);
  }

  private async approveUserAPI(id: string): Promise<ExtendedUser> {
    const response = await apiClient.patch<ExtendedUser>(`/users/${id}/approve`, {});
    return response;
  }

  private async approveUserMock(id: string): Promise<ExtendedUser> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to approve user. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const user = mockExtendedUsers.find(u => u.id === id);
    if (!user) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `User with ID "${id}" was not found.`,
        404,
        { userId: id }
      );
    }

    // Only approve if status is pending
    if (user.status === 'pending') {
      user.status = 'active';
      user.isActive = true;
    } else {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `User is not in pending status. Current status: ${user.status || 'unknown'}`,
        400
      );
    }

    return user;
  }
}

export const usersService = new UsersService();

