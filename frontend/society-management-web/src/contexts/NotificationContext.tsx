import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axiosClient from '../api/axiosClient';
import { Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { token, user } = useAuth();

  const fetchNotifications = async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const res = await axiosClient.get<Notification[]>('notifications');
      setNotifications(res.data);
      
      const countRes = await axiosClient.get<{ count: number }>('notifications/unread-count');
      // Wait, let's check if the API returns a number directly or an object. Let's see what NotificationsController returns.
      // Usually, it is either an object { count } or a primitive. Let's support both:
      const countValue = typeof countRes.data === 'object' && countRes.data !== null && 'count' in countRes.data 
        ? (countRes.data as any).count 
        : (countRes.data as number);
      setUnreadCount(countValue);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token, user]);

  const markAsRead = async (id: number) => {
    try {
      await axiosClient.put(`notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.put('notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
