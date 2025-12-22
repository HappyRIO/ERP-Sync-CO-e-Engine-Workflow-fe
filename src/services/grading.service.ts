// Grading Service (for admin grading management)
import type { GradingRecord } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';

const SERVICE_NAME = 'grading';

// Mock grading records
const mockGradingRecords: GradingRecord[] = [
  {
    id: 'grade-001',
    bookingId: 'booking-005',
    assetId: 'laptop',
    assetCategory: 'laptop',
    grade: 'A',
    resaleValue: 85,
    gradedAt: '2024-12-12T10:00:00Z',
    gradedBy: 'user-1',
    condition: 'Excellent condition',
  },
  {
    id: 'grade-002',
    bookingId: 'booking-005',
    assetId: 'monitor',
    assetCategory: 'monitor',
    grade: 'B',
    resaleValue: 18,
    gradedAt: '2024-12-12T10:30:00Z',
    gradedBy: 'user-1',
    condition: 'Good condition',
  },
  {
    id: 'grade-003',
    bookingId: 'booking-006',
    assetId: 'desktop',
    assetCategory: 'desktop',
    grade: 'B',
    resaleValue: 32,
    gradedAt: '2024-12-07T14:00:00Z',
    gradedBy: 'user-1',
    condition: 'Good condition, minor wear',
  },
  {
    id: 'grade-004',
    bookingId: 'booking-006',
    assetId: 'printer',
    assetCategory: 'printer',
    grade: 'C',
    resaleValue: 6,
    gradedAt: '2024-12-07T14:15:00Z',
    gradedBy: 'user-1',
    condition: 'Functional but worn',
  },
  {
    id: 'grade-005',
    bookingId: 'booking-007',
    assetId: 'laptop',
    assetCategory: 'laptop',
    grade: 'A',
    resaleValue: 85,
    gradedAt: '2024-11-30T11:00:00Z',
    gradedBy: 'user-1',
    condition: 'Excellent condition, like new',
  },
  {
    id: 'grade-006',
    bookingId: 'booking-007',
    assetId: 'monitor',
    assetCategory: 'monitor',
    grade: 'B',
    resaleValue: 18,
    gradedAt: '2024-11-30T11:30:00Z',
    gradedBy: 'user-1',
    condition: 'Good condition',
  },
  {
    id: 'grade-007',
    bookingId: 'booking-007',
    assetId: 'phone',
    assetCategory: 'phone',
    grade: 'A',
    resaleValue: 40,
    gradedAt: '2024-11-30T12:00:00Z',
    gradedBy: 'user-1',
    condition: 'Excellent condition',
  },
];

// Grade-based resale value multipliers (per unit)
const gradeMultipliers: Record<string, number> = {
  'A': 1.0,      // Full value
  'B': 0.7,      // 70% value
  'C': 0.4,      // 40% value
  'D': 0.2,      // 20% value
  'Recycled': 0, // No resale value
};

// Base resale values by category (per unit)
const baseResaleValues: Record<string, number> = {
  'laptop': 85,
  'desktop': 45,
  'monitor': 25,
  'server': 250,
  'phone': 40,
  'tablet': 55,
  'printer': 15,
  'network': 35,
};

class GradingService {
  async getGradingRecords(bookingId?: string): Promise<GradingRecord[]> {
    if (USE_MOCK_API) {
      return this.getGradingRecordsMock(bookingId);
    }
    throw new Error('Real API not implemented yet');
  }

  private async getGradingRecordsMock(bookingId?: string): Promise<GradingRecord[]> {
    await delay(500);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch grading records. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let records = [...mockGradingRecords];

    if (bookingId) {
      records = records.filter(r => r.bookingId === bookingId);
    }

    return records;
  }

  async createGradingRecord(
    bookingId: string,
    assetId: string,
    assetCategory: string,
    grade: GradingRecord['grade'],
    gradedBy: string,
    condition?: string,
    notes?: string
  ): Promise<GradingRecord> {
    if (USE_MOCK_API) {
      return this.createGradingRecordMock(bookingId, assetId, assetCategory, grade, gradedBy, condition, notes);
    }
    throw new Error('Real API not implemented yet');
  }

  private async createGradingRecordMock(
    bookingId: string,
    assetId: string,
    assetCategory: string,
    grade: GradingRecord['grade'],
    gradedBy: string,
    condition?: string,
    notes?: string
  ): Promise<GradingRecord> {
    await delay(800);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to create grading record. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Calculate resale value based on grade and category
    const baseValue = baseResaleValues[assetCategory] || 0;
    const multiplier = gradeMultipliers[grade] || 0;
    const resaleValue = Math.round(baseValue * multiplier);

    const newRecord: GradingRecord = {
      id: `grade-${Date.now()}`,
      bookingId,
      assetId,
      assetCategory,
      grade,
      resaleValue,
      gradedAt: new Date().toISOString(),
      gradedBy,
      condition,
      notes,
    };

    mockGradingRecords.push(newRecord);
    return newRecord;
  }

  calculateResaleValue(category: string, grade: GradingRecord['grade'], quantity: number): number {
    const baseValue = baseResaleValues[category] || 0;
    const multiplier = gradeMultipliers[grade] || 0;
    return Math.round(baseValue * multiplier * quantity);
  }
}

export const gradingService = new GradingService();

