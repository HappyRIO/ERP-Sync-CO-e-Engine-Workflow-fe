// Notifications Service
import type { Notification } from '@/contexts/NotificationContext';
import { apiClient } from './api-client';
import { USE_MOCK_API } from '@/lib/config';

const SERVICE_NAME = 'notifications';

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationsService {
  /**
   * Get notifications
   */
  async getNotifications(options?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> {
    if (!USE_MOCK_API) {
      return this.getNotificationsAPI(options);
    }
    return this.getNotificationsMock(options);
  }

  private async getNotificationsAPI(options?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    if (options?.read !== undefined) {
      params.append('read', options.read.toString());
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.offset) {
      params.append('offset', options.offset.toString());
    }

    const queryString = params.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<{ notifications: Notification[]; total: number }>(endpoint);
    
    // Debug logging
    console.log('[Notifications Service] API Response:', {
      endpoint,
      response,
      notificationsCount: response?.notifications?.length || 0,
      total: response?.total || 0,
    });
    
    return {
      notifications: response.notifications || [],
      total: response.total || 0,
    };
  }

  private async getNotificationsMock(options?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> {
    // Return empty for mock - will use context defaults
    return {
      notifications: [],
      total: 0,
    };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    if (!USE_MOCK_API) {
      return this.getUnreadCountAPI();
    }
    return this.getUnreadCountMock();
  }

  private async getUnreadCountAPI(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.count;
  }

  private async getUnreadCountMock(): Promise<number> {
    return 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!USE_MOCK_API) {
      return this.markAsReadAPI(notificationId);
    }
    // Mock doesn't need to do anything
  }

  private async markAsReadAPI(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    if (!USE_MOCK_API) {
      return this.markAllAsReadAPI();
    }
    // Mock doesn't need to do anything
  }

  private async markAllAsReadAPI(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!USE_MOCK_API) {
      return this.deleteNotificationAPI(notificationId);
    }
    // Mock doesn't need to do anything
  }

  private async deleteNotificationAPI(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(): Promise<void> {
    if (!USE_MOCK_API) {
      return this.deleteAllReadAPI();
    }
    // Mock doesn't need to do anything
  }

  private async deleteAllReadAPI(): Promise<void> {
    await apiClient.delete('/notifications/read');
  }
}

export const notificationsService = new NotificationsService();

