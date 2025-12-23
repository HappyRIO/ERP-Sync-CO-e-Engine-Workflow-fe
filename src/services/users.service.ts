// Users Service (for admin user management)
import type { ExtendedUser } from '@/mocks/mock-entities';
import { mockExtendedUsers } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'users';

class UsersService {
  async getUsers(filter?: { role?: string; tenantId?: string; isActive?: boolean; status?: string }): Promise<ExtendedUser[]> {
    if (USE_MOCK_API) {
      return this.getUsersMock(filter);
    }
    throw new Error('Real API not implemented yet');
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
    if (USE_MOCK_API) {
      return this.getUserMock(id);
    }
    throw new Error('Real API not implemented yet');
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
    if (USE_MOCK_API) {
      return this.updateUserStatusMock(id, isActive);
    }
    throw new Error('Real API not implemented yet');
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
    if (USE_MOCK_API) {
      return this.approveUserMock(id);
    }
    throw new Error('Real API not implemented yet');
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

