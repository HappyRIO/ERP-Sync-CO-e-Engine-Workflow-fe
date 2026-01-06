// Organisation Profile Service

import { apiClient } from './api-client';
import { USE_MOCK_API } from '@/lib/config';

export interface OrganisationProfile {
  id: string;
  userId: string;
  organisationName: string;
  registrationNumber: string;
  address: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface OrganisationProfileData {
  organisationName: string;
  registrationNumber: string;
  address: string;
  email: string;
  phone: string;
}

class OrganisationProfileService {
  private async getProfileAPI(): Promise<OrganisationProfile | null> {
    try {
      const response = await apiClient.get<OrganisationProfile>('/organisation-profile');
      return response || null;
    } catch (error) {
      // If API call fails (e.g., 404 - no profile exists), return null
      // This is expected for users who haven't created a profile yet
      console.error('Failed to get organisation profile:', error);
      return null;
    }
  }

  private async getProfileMock(): Promise<OrganisationProfile | null> {
    // Mock implementation - return null (no profile exists initially)
    return null;
  }

  async getProfile(): Promise<OrganisationProfile | null> {
    if (USE_MOCK_API) {
      return this.getProfileMock();
    }
    return this.getProfileAPI();
  }

  private async upsertProfileAPI(data: OrganisationProfileData): Promise<OrganisationProfile> {
    return apiClient.patch<OrganisationProfile>('/organisation-profile', data);
  }

  private async upsertProfileMock(data: OrganisationProfileData): Promise<OrganisationProfile> {
    // Mock implementation
    return {
      id: `org-profile-${Date.now()}`,
      userId: 'current-user-id',
      organisationName: data.organisationName,
      registrationNumber: data.registrationNumber,
      address: data.address,
      email: data.email,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async upsertProfile(data: OrganisationProfileData): Promise<OrganisationProfile> {
    if (USE_MOCK_API) {
      return this.upsertProfileMock(data);
    }
    return this.upsertProfileAPI(data);
  }

  private async checkProfileCompleteAPI(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isComplete: boolean }>('/organisation-profile/complete');
      return response?.isComplete || false;
    } catch (error) {
      // If API call fails, return false (profile not complete)
      // This prevents blocking the page load
      console.error('Failed to check organisation profile completeness:', error);
      return false;
    }
  }

  private async checkProfileCompleteMock(): Promise<boolean> {
    // Mock implementation
    return false;
  }

  async checkProfileComplete(): Promise<boolean> {
    if (USE_MOCK_API) {
      return this.checkProfileCompleteMock();
    }
    return this.checkProfileCompleteAPI();
  }
}

export const organisationProfileService = new OrganisationProfileService();

