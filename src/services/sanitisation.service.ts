// Sanitisation Service (for admin sanitisation management)
import type { SanitisationRecord } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'sanitisation';

// Mock sanitisation records
const mockSanitisationRecords: SanitisationRecord[] = [
  {
    id: 'sanit-001',
    bookingId: 'booking-005',
    assetId: 'laptop',
    method: 'blancco',
    timestamp: '2024-12-11T15:00:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-001',
    certificateUrl: '#',
    verified: true,
    notes: 'Blancco software wipe completed successfully',
  },
  {
    id: 'sanit-002',
    bookingId: 'booking-005',
    assetId: 'monitor',
    method: 'blancco',
    timestamp: '2024-12-11T15:30:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-002',
    certificateUrl: '#',
    verified: true,
  },
  {
    id: 'sanit-003',
    bookingId: 'booking-006',
    assetId: 'desktop',
    method: 'physical-destruction',
    methodDetails: 'Shredded',
    timestamp: '2024-12-06T10:00:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-003',
    certificateUrl: '#',
    verified: true,
    notes: 'Physical destruction via industrial shredder',
  },
  {
    id: 'sanit-004',
    bookingId: 'booking-006',
    assetId: 'printer',
    method: 'blancco',
    timestamp: '2024-12-06T10:30:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-004',
    certificateUrl: '#',
    verified: true,
  },
  {
    id: 'sanit-005',
    bookingId: 'booking-007',
    assetId: 'laptop',
    method: 'blancco',
    timestamp: '2024-11-29T09:00:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-005',
    certificateUrl: '#',
    verified: true,
  },
  {
    id: 'sanit-006',
    bookingId: 'booking-007',
    assetId: 'monitor',
    method: 'blancco',
    timestamp: '2024-11-29T09:30:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-006',
    certificateUrl: '#',
    verified: true,
  },
  {
    id: 'sanit-007',
    bookingId: 'booking-007',
    assetId: 'phone',
    method: 'blancco',
    timestamp: '2024-11-29T10:00:00Z',
    performedBy: 'user-1',
    certificateId: 'CERT-SANIT-2024-007',
    certificateUrl: '#',
    verified: true,
  },
];

class SanitisationService {
  async getSanitisationRecords(bookingId?: string): Promise<SanitisationRecord[]> {
    if (USE_MOCK_API) {
      return this.getSanitisationRecordsMock(bookingId);
    }
    throw new Error('Real API not implemented yet');
  }

  private async getSanitisationRecordsMock(bookingId?: string): Promise<SanitisationRecord[]> {
    await delay(500);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch sanitisation records. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let records = [...mockSanitisationRecords];

    if (bookingId) {
      records = records.filter(r => r.bookingId === bookingId);
    }

    return records;
  }

  async createSanitisationRecord(
    bookingId: string,
    assetId: string,
    method: SanitisationRecord['method'],
    performedBy: string,
    methodDetails?: string,
    notes?: string
  ): Promise<SanitisationRecord> {
    if (USE_MOCK_API) {
      return this.createSanitisationRecordMock(bookingId, assetId, method, performedBy, methodDetails, notes);
    }
    throw new Error('Real API not implemented yet');
  }

  private async createSanitisationRecordMock(
    bookingId: string,
    assetId: string,
    method: SanitisationRecord['method'],
    performedBy: string,
    methodDetails?: string,
    notes?: string
  ): Promise<SanitisationRecord> {
    await delay(1000);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to create sanitisation record. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const newRecord: SanitisationRecord = {
      id: `sanit-${Date.now()}`,
      bookingId,
      assetId,
      method,
      methodDetails,
      timestamp: new Date().toISOString(),
      performedBy,
      certificateId: `CERT-SANIT-${new Date().getFullYear()}-${String(mockSanitisationRecords.length + 1).padStart(3, '0')}`,
      certificateUrl: '#',
      verified: false,
      notes,
    };

    mockSanitisationRecords.push(newRecord);
    
    // Check if all assets are sanitised and auto-update booking status
    try {
      const { mockBookings } = await import('@/mocks/mock-entities');
      const booking = mockBookings.find(b => b.id === bookingId);
      
      if (booking) {
        // Get all sanitisation records for this booking
        const bookingRecords = mockSanitisationRecords.filter(r => r.bookingId === bookingId);
        const sanitisedAssetIds = new Set(bookingRecords.map(r => r.assetId));
        const allAssetsSanitised = booking.assets.every(asset => sanitisedAssetIds.has(asset.categoryId));
        
        // If all assets are sanitised and booking is in 'collected' status, update to 'sanitised'
        if (allAssetsSanitised && booking.status === 'collected') {
          booking.status = 'sanitised';
          booking.sanitisedAt = new Date().toISOString();
          
          // Also update job status if linked
          if (booking.jobId) {
            const { mockJobs } = await import('@/mocks/mock-data');
            const job = mockJobs.find(j => j.id === booking.jobId);
            if (job && job.status === 'warehouse') {
              job.status = 'sanitised';
            }
          }
        }
      }
    } catch (error) {
      // If sync fails, log but don't fail the record creation
      console.error('Failed to sync booking status:', error);
    }
    
    return newRecord;
  }

  async verifySanitisation(recordId: string): Promise<SanitisationRecord> {
    if (USE_MOCK_API) {
      return this.verifySanitisationMock(recordId);
    }
    throw new Error('Real API not implemented yet');
  }

  private async verifySanitisationMock(recordId: string): Promise<SanitisationRecord> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to verify sanitisation. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const record = mockSanitisationRecords.find(r => r.id === recordId);
    if (!record) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Sanitisation record with ID "${recordId}" was not found.`,
        404,
        { recordId }
      );
    }

    record.verified = true;
    return record;
  }
}

export const sanitisationService = new SanitisationService();

