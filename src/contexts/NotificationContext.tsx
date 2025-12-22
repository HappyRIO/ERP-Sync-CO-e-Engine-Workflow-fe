// Notification Context for shared state
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Notification type definition
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
  url?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Role-based notification data
const getNotificationsByRole = (role: string): Notification[] => {
  const baseNotifications: Notification[] = [
    {
      id: '1',
      type: 'success',
      title: 'Job completed',
      message: 'Job ERP-2024-00142 has been completed successfully',
      time: '2 hours ago',
      read: false,
      url: role === 'driver' ? '/driver/jobs/job-001' : '/jobs/job-001'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Collection reminder',
      message: role === 'driver' 
        ? 'You have a collection scheduled for tomorrow' 
        : 'Booking booking-002 is scheduled for tomorrow',
      time: '5 hours ago',
      read: false,
      url: role === 'driver' ? '/driver/schedule' : '/bookings/booking-002'
    },
    {
      id: '3',
      type: 'info',
      title: 'Certificate ready',
      message: 'Data wipe certificate is now available for download',
      time: '1 day ago',
      read: false,
      url: '/documents'
    },
    {
      id: '5',
      type: 'success',
      title: 'Booking updated',
      message: 'Your booking status has been updated',
      time: '2 days ago',
      read: true,
      url: '/bookings'
    },
    {
      id: '6',
      type: 'info',
      title: 'New document available',
      message: 'ESG report for Q4 2024 is now available',
      time: '3 days ago',
      read: true,
      url: '/documents'
    }
  ];

  // Add role-specific notifications
  if (role === 'driver') {
    baseNotifications.unshift({
      id: '4',
      type: 'info',
      title: 'New job assigned',
      message: 'A new collection job has been assigned to you',
      time: '3 hours ago',
      read: false,
      url: '/driver/jobs/job-002'
    });
  } else if (role === 'admin') {
    baseNotifications.unshift({
      id: '4',
      type: 'warning',
      title: 'Pending approval',
      message: 'Booking booking-003 requires your approval',
      time: '1 hour ago',
      read: false,
      url: '/admin/approval/booking-003'
    });
  } else if (role === 'client' || role === 'reseller') {
    baseNotifications.unshift({
      id: '4',
      type: 'info',
      title: 'Booking confirmed',
      message: 'Your booking has been confirmed and scheduled',
      time: '4 hours ago',
      read: false,
      url: '/bookings/booking-001'
    });
  }

  return baseNotifications;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => 
    getNotificationsByRole(user?.role || 'client')
  );

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`notifications_${user?.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (e) {
        // If parsing fails, use default
        setNotifications(getNotificationsByRole(user?.role || 'client'));
      }
    }
  }, [user?.id, user?.role]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const refreshNotifications = () => {
    setNotifications(getNotificationsByRole(user?.role || 'client'));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

