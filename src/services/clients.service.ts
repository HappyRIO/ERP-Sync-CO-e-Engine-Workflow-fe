// Clients Service (for reseller and admin client management)
import type { Client } from '@/mocks/mock-entities';
import { mockClients } from '@/mocks/mock-entities';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import { apiClient } from './api-client';
import type { User } from '@/types/auth';

const SERVICE_NAME = 'clients';

class ClientsService {
  async getClients(user?: User | null, filter?: { status?: string; resellerId?: string }): Promise<Client[]> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getClientsAPI(filter);
    }
    
    return this.getClientsMock(user, filter);
  }

  private async getClientsAPI(filter?: { status?: string; resellerId?: string }): Promise<Client[]> {
    const params = new URLSearchParams();
    if (filter?.status) {
      params.append('status', filter.status);
    }
    if (filter?.resellerId) {
      params.append('resellerId', filter.resellerId);
    }

    const queryString = params.toString();
    const endpoint = `/clients${queryString ? `?${queryString}` : ''}`;
    
    const clients = await apiClient.get<Client[]>(endpoint);
    return clients;
  }

  private async getClientsMock(user?: User | null, filter?: { status?: string; resellerId?: string }): Promise<Client[]> {
    await delay(500);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch clients. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    let clients = [...mockClients];

    // Filter by user role
    if (user) {
      if (user.role === 'admin') {
        // Admin sees all clients
      } else if (user.role === 'reseller') {
        // Reseller sees only their clients
        clients = clients.filter(c => c.resellerId === user.tenantId);
      } else if (user.role === 'client') {
        // Client sees only themselves
        clients = clients.filter(c => c.tenantId === user.tenantId);
      }
    }

    // Apply filters
    if (filter) {
      if (filter.status) {
        clients = clients.filter(c => c.status === filter.status);
      }
      if (filter.resellerId) {
        clients = clients.filter(c => c.resellerId === filter.resellerId);
      }
    }

    return clients;
  }

  async getClient(id: string): Promise<Client | null> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.getClientAPI(id);
    }
    
    return this.getClientMock(id);
  }

  async getClientProfile(): Promise<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean } | null> {
    if (!USE_MOCK_API) {
      return this.getClientProfileAPI();
    }
    return this.getClientProfileMock();
  }

  private async getClientProfileAPI(): Promise<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean } | null> {
    try {
      const response = await apiClient.get<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean }>('/clients/profile/me');
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  private async getClientProfileMock(): Promise<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean } | null> {
    await delay(300);
    // Mock implementation - return null for now
    return null;
  }

  async updateClientProfile(data: { email: string; phone: string; organisationName: string; registrationNumber: string; address: string }): Promise<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean }> {
    if (!USE_MOCK_API) {
      return this.updateClientProfileAPI(data);
    }
    return this.updateClientProfileMock(data);
  }

  private async updateClientProfileAPI(data: { email: string; phone: string; organisationName: string; registrationNumber: string; address: string }): Promise<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean }> {
    const response = await apiClient.patch<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean }>('/clients/profile/me', data);
    return response;
  }

  private async updateClientProfileMock(data: { email: string; phone: string; organisationName: string; registrationNumber: string; address: string }): Promise<{ id: string; name: string; email: string; phone: string; organisationName: string; registrationNumber: string; address: string; hasProfile: boolean }> {
    await delay(500);
    return {
      id: 'mock-client-id',
      name: 'Mock Client',
      email: data.email,
      phone: data.phone,
      organisationName: data.organisationName,
      registrationNumber: data.registrationNumber,
      address: data.address,
      hasProfile: true,
    };
  }

  private async getClientAPI(id: string): Promise<Client | null> {
    try {
      const client = await apiClient.get<Client>(`/clients/${id}`);
      return client;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  private async getClientMock(id: string): Promise<Client | null> {
    await delay(300);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `Client with ID "${id}" was not found.`,
          404,
          { clientId: id }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch client. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    return mockClients.find(c => c.id === id) || null;
  }

  async updateClientStatus(clientId: string, status: 'active' | 'inactive' | 'pending'): Promise<Client> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.updateClientStatusAPI(clientId, status);
    }
    
    return this.updateClientStatusMock(clientId, status);
  }

  private async updateClientStatusAPI(clientId: string, status: 'active' | 'inactive' | 'pending'): Promise<Client> {
    const client = await apiClient.patch<Client>(`/clients/${clientId}/status`, { status });
    return client;
  }

  private async updateClientStatusMock(clientId: string, status: 'active' | 'inactive' | 'pending'): Promise<Client> {
    await delay(600);

    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to update client status. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    const client = mockClients.find(c => c.id === clientId);
    if (!client) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND,
        `Client with ID "${clientId}" was not found.`,
        404,
        { clientId }
      );
    }

    client.status = status;
    return client;
  }
}

export const clientsService = new ClientsService();

