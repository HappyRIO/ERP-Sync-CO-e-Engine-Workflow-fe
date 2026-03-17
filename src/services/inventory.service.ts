// Inventory Service
import { ApiError, ApiErrorType } from './api-error';
import { apiClient } from './api-client';

export interface InventoryItem {
  id: string;
  tenantId: string;
  category: string;
  deviceType: string | null; // Windows/Apple for laptop/desktop, null for others
  make: string;
  model: string;
  serialNumber: string;
  imei?: string;
  conditionCode: string;
  erpInventoryId?: string;
  status: 'available' | 'allocated' | 'in_transit' | 'delivered' | 'collected' | 'warehouse';
  allocatedTo: string | null; // Client ID if allocated
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface InventoryUploadItem {
  deviceType: string;
  make: string;
  model: string;
  serialNumber: string;
  imei?: string;
  conditionCode: string;
  status?: string;
}

export interface InventoryUploadResponse {
  created: number;
  total: number;
}

export interface InventorySyncResponse {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

class InventoryService {
  async getInventory(allocatedTo?: string | null): Promise<InventoryItem[]> {
    // For admin, if allocatedTo is null/undefined, don't pass it (shows all inventory)
    // For client users, don't pass allocatedTo (they see their allocated inventory)
    const params = allocatedTo ? `?allocatedTo=${allocatedTo}` : '';
    const response = await apiClient.get<InventoryItem[]>(`/inventory${params}`);
    return response || [];
  }

  async uploadInventory(items: InventoryUploadItem[], clientId?: string): Promise<InventoryUploadResponse> {
    const response = await apiClient.post<InventoryUploadResponse>('/inventory/upload', {
      items,
      clientId,
    });
    return response;
  }

  async syncInventory(clientId?: string): Promise<InventorySyncResponse> {
    const response = await apiClient.post<InventorySyncResponse>('/inventory/sync', {
      clientId,
    });
    return response;
  }

  async getAvailableInventory(allocatedTo: string, category?: string, conditionCode?: string): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    params.append('allocatedTo', allocatedTo);
    if (category) params.append('category', category);
    if (conditionCode) params.append('conditionCode', conditionCode);
    
    const response = await apiClient.get<InventoryItem[]>(`/inventory/available?${params.toString()}`);
    return response || [];
  }

  async updateInventory(id: string, data: {
    make?: string;
    model?: string;
    imei?: string;
    conditionCode?: string;
    status?: string;
  }): Promise<InventoryItem> {
    const response = await apiClient.patch<InventoryItem>(`/inventory/${id}`, data);
    return response;
  }
}

export const inventoryService = new InventoryService();
