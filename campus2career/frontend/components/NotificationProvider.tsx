'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Notification {
  _id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  entityType?: string;
  entityId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, '_id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API helper functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // User is not authenticated, don't fetch notifications
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, clear local storage and don't show error
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      if (data.success && data.data && data.data.notifications) {
        const formattedNotifications = data.data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.createdAt || n.timestamp)
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications from API on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + N to mark all as read
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        const currentUnreadCount = notifications.filter(n => !n.read).length;
        if (currentUnreadCount > 0) {
          markAllAsRead();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [notifications]);

  const addNotification = async (notification: Omit<Notification, '_id' | 'timestamp' | 'read'>) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // User is not authenticated, just show toast notification
        switch (notification.type) {
          case 'success':
            toast.success(notification.title, { description: notification.message });
            break;
          case 'error':
            toast.error(notification.title, { description: notification.message });
            break;
          case 'warning':
            toast.warning(notification.title, { description: notification.message });
            break;
          case 'info':
            toast.info(notification.title, { description: notification.message });
            break;
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notification)
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const newNotification = {
          ...data.data,
          timestamp: new Date(data.data.createdAt || data.data.timestamp)
        };
        setNotifications(prev => [newNotification, ...prev]);

        // Show toast notification
        switch (notification.type) {
          case 'success':
            toast.success(notification.title, { description: notification.message });
            break;
          case 'error':
            toast.error(notification.title, { description: notification.message });
            break;
          case 'warning':
            toast.warning(notification.title, { description: notification.message });
            break;
          case 'info':
            toast.info(notification.title, { description: notification.message });
            break;
        }
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      // Fallback: show toast even if API fails
      switch (notification.type) {
        case 'success':
          toast.success(notification.title, { description: notification.message });
          break;
        case 'error':
          toast.error(notification.title, { description: notification.message });
          break;
        case 'warning':
          toast.warning(notification.title, { description: notification.message });
          break;
        case 'info':
          toast.info(notification.title, { description: notification.message });
          break;
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // User is not authenticated, just update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === id ? { ...notification, read: true } : notification
          )
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === id ? { ...notification, read: true } : notification
          )
        );
        toast.info('Notification marked as read');
      } else {
        const errorData = await response.json();
        console.error('Failed to mark notification as read:', errorData);
        throw new Error(errorData.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback: update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // User is not authenticated, just update local state
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback: update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const removeNotification = async (id: string) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // User is not authenticated, just update local state
        setNotifications(prev => prev.filter(notification => notification._id !== id));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notification => notification._id !== id));
        toast.info('Notification removed');
      }
    } catch (error) {
      console.error('Error removing notification:', error);
      // Fallback: update local state
      setNotifications(prev => prev.filter(notification => notification._id !== id));
    }
  };

  const clearAll = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        // User is not authenticated, just update local state
        setNotifications([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setNotifications([]);
        toast.success('All notifications cleared');
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Fallback: update local state
      setNotifications([]);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    unreadCount,
    isLoading,
    error,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

