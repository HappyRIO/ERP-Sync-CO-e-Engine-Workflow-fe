// Commission Service (for reseller earnings)
import type { Commission } from '@/mocks/mock-entities';
import { mockCommissions } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'commission';

class CommissionService {
  async getCommissions(user?: User | null, filter?: { status?: string; period?: string }): Promise<Commission[]> {
    if (USE_MOCK_API) {
      return this.getCommissionsMock(user, filter);
    }
    throw new Error('Real API not implemented yet');
  }

  private async getCommissionsMock(user?: User | null, filter?: { status?: string; period?: string }): Promise<Commission[]> {
    await delay(500);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch commission records. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let commissions = [...mockCommissions];

    // Filter by user role
    if (user) {
      if (user.role === 'admin') {
        // Admin sees all commissions
      } else if (user.role === 'reseller') {
        // Reseller sees only their commissions
        commissions = commissions.filter(c => c.resellerId === user.tenantId);
      } else {
        // Other roles don't see commissions
        commissions = [];
      }
    }

    // Apply filters
    if (filter) {
      if (filter.status) {
        commissions = commissions.filter(c => c.status === filter.status);
      }
      if (filter.period) {
        commissions = commissions.filter(c => c.period === filter.period);
      }
    }

    return commissions;
  }

  async getCommissionSummary(user?: User | null): Promise<{
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
    totalAmount: number;
    byPeriod: Record<string, number>;
  }> {
    if (USE_MOCK_API) {
      return this.getCommissionSummaryMock(user);
    }
    throw new Error('Real API not implemented yet');
  }

  private async getCommissionSummaryMock(user?: User | null): Promise<{
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
    totalAmount: number;
    byPeriod: Record<string, number>;
  }> {
    await delay(400);

    const commissions = await this.getCommissionsMock(user);

    const summary = {
      totalPending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0),
      totalApproved: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commissionAmount, 0),
      totalPaid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0),
      totalAmount: commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
      byPeriod: {} as Record<string, number>,
    };

    // Group by period
    commissions.forEach(c => {
      summary.byPeriod[c.period] = (summary.byPeriod[c.period] || 0) + c.commissionAmount;
    });

    return summary;
  }

  /**
   * Update commission status (admin only)
   * Valid transitions: pending → approved → paid
   */
  async updateCommissionStatus(commissionId: string, status: 'pending' | 'approved' | 'paid'): Promise<Commission> {
    if (USE_MOCK_API) {
      return this.updateCommissionStatusMock(commissionId, status);
    }
    throw new Error('Real API not implemented yet');
  }

  private async updateCommissionStatusMock(commissionId: string, status: 'pending' | 'approved' | 'paid'): Promise<Commission> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update commission status. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const commission = mockCommissions.find(c => c.id === commissionId);
    if (!commission) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Commission with ID "${commissionId}" was not found.`,
        404
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'pending': ['approved'],
      'approved': ['paid'],
      'paid': [], // Paid is final status
    };

    const currentStatus = commission.status;
    const allowedNextStatuses = validTransitions[currentStatus] || [];
    
    if (status !== currentStatus && allowedNextStatuses.length > 0 && !allowedNextStatuses.includes(status)) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Invalid status transition from "${currentStatus}" to "${status}". Allowed next status: ${allowedNextStatuses.join(', ')}`,
        400
      );
    }

    commission.status = status;
    
    // Set paid date if moving to paid
    if (status === 'paid' && !commission.paidDate) {
      commission.paidDate = new Date().toISOString();
    }

    return commission;
  }
}

export const commissionService = new CommissionService();

