/**
 * VERSE Mystical Notifications Management Hook
 * Enchanted notification system with real-time updates and persistence
 */

import { useState, useEffect, useCallback, useContext, createContext, useRef } from 'react';
import { useAuth } from './useAuth.js';

// =============================================================================
// NOTIFICATION CONTEXT CREATION
// =============================================================================

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  clearRead: () => {}
});

// =============================================================================
// NOTIFICATION TYPES AND CONSTANTS
// =============================================================================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  STORY: 'story',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  LIKE: 'like',
  ACHIEVEMENT: 'achievement',
  SYSTEM: 'system'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const MAX_NOTIFICATIONS = 100;
const STORAGE_KEY = 'verse-notifications';
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// NOTIFICATION PROVIDER COMPONENT
// =============================================================================

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const cleanupTimerRef = useRef(null);
  const notificationIdCounter = useRef(1);

  // =============================================================================
  // STORAGE UTILITIES
  // =============================================================================

  const getStorageKey = useCallback(() => {
    return isAuthenticated && user?.id ? `${STORAGE_KEY}-${user.id}` : STORAGE_KEY;
  }, [isAuthenticated, user?.id]);

  const saveNotifications = useCallback((notificationList) => {
    try {
      const storageKey = getStorageKey();
      const dataToStore = {
        notifications: notificationList.slice(0, MAX_NOTIFICATIONS),
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }, [getStorageKey]);

  const loadNotifications = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return [];

      const { notifications: storedNotifications, timestamp } = JSON.parse(stored);
      
      // Remove notifications older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (timestamp < thirtyDaysAgo) {
        localStorage.removeItem(storageKey);
        return [];
      }

      // Filter out expired notifications
      const validNotifications = storedNotifications.filter(notification => {
        if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
          return false;
        }
        return true;
      });

      return validNotifications.map(notification => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
        expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : null
      }));
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
      return [];
    }
  }, [getStorageKey]);

  // =============================================================================
  // NOTIFICATION CREATION
  // =============================================================================

  const createNotification = useCallback((options) => {
    const {
      type = NOTIFICATION_TYPES.INFO,
      title,
      message,
      priority = NOTIFICATION_PRIORITIES.MEDIUM,
      persistent = false,
      autoHide = true,
      hideAfter = 5000,
      actionButton = null,
      metadata = {}
    } = options;

    const notification = {
      id: `verse-notification-${Date.now()}-${notificationIdCounter.current++}`,
      type,
      title,
      message,
      priority,
      persistent,
      autoHide,
      hideAfter,
      actionButton,
      metadata,
      isRead: false,
      createdAt: new Date(),
      expiresAt: persistent ? null : new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours
      userId: user?.id || null
    };

    return notification;
  }, [user?.id]);

  // =============================================================================
  // NOTIFICATION MANAGEMENT
  // =============================================================================

  const addNotification = useCallback((options) => {
    const notification = createNotification(options);
    
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(updated);
      return updated;
    });

    // Auto-hide notification if specified
    if (notification.autoHide && !notification.persistent) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.hideAfter);
    }

    // Dispatch custom event for external listeners
    window.dispatchEvent(new CustomEvent('verse-notification-added', {
      detail: { notification }
    }));

    return notification.id;
  }, [createNotification, saveNotifications]);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      saveNotifications(updated);
      return updated;
    });

    window.dispatchEvent(new CustomEvent('verse-notification-removed', {
      detail: { notificationId }
    }));
  }, [saveNotifications]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });

    window.dispatchEvent(new CustomEvent('verse-notification-read', {
      detail: { notificationId }
    }));
  }, [saveNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, isRead: true }));
      saveNotifications(updated);
      return updated;
    });

    window.dispatchEvent(new CustomEvent('verse-notifications-all-read'));
  }, [saveNotifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear notifications from localStorage:', error);
    }

    window.dispatchEvent(new CustomEvent('verse-notifications-cleared'));
  }, [getStorageKey]);

  const clearRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.filter(notification => !notification.isRead);
      saveNotifications(updated);
      return updated;
    });

    window.dispatchEvent(new CustomEvent('verse-notifications-read-cleared'));
  }, [saveNotifications]);

  // =============================================================================
  // NOTIFICATION HELPERS
  // =============================================================================

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.isRead);
  }, [notifications]);

  const hasUnreadOfType = useCallback((type) => {
    return notifications.some(notification => 
      notification.type === type && !notification.isRead
    );
  }, [notifications]);

  // =============================================================================
  // QUICK NOTIFICATION METHODS
  // =============================================================================

  const showSuccess = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      persistent: true,
      autoHide: false,
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      hideAfter: 8000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.LOW,
      ...options
    });
  }, [addNotification]);

  const showAchievement = useCallback((title, message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ACHIEVEMENT,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      persistent: true,
      hideAfter: 10000,
      ...options
    });
  }, [addNotification]);

  // =============================================================================
  // CLEANUP AND MAINTENANCE
  // =============================================================================

  const cleanupExpiredNotifications = useCallback(() => {
    const now = new Date();
    setNotifications(prev => {
      const updated = prev.filter(notification => {
        if (notification.expiresAt && notification.expiresAt < now) {
          return false;
        }
        return true;
      });
      
      if (updated.length !== prev.length) {
        saveNotifications(updated);
      }
      
      return updated;
    });
  }, [saveNotifications]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Load notifications on mount and auth changes
  useEffect(() => {
    const loadedNotifications = loadNotifications();
    setNotifications(loadedNotifications);
  }, [loadNotifications, isAuthenticated, user?.id]);

  // Setup cleanup timer
  useEffect(() => {
    cleanupTimerRef.current = setInterval(cleanupExpiredNotifications, CLEANUP_INTERVAL);
    
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupExpiredNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, []);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread = unreadCount > 0;
  const urgentCount = notifications.filter(n => 
    !n.isRead && n.priority === NOTIFICATION_PRIORITIES.URGENT
  ).length;

  const contextValue = {
    notifications,
    unreadCount,
    hasUnread,
    urgentCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    getNotificationsByType,
    getUnreadNotifications,
    hasUnreadOfType,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAchievement
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// =============================================================================
// NOTIFICATION HOOK
// =============================================================================

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default useNotifications;