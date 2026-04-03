/**
 * VERSE Mystical Notification Panel Component
 * Enchanted notification center with real-time updates and mystical animations
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ICONS, NOTIFICATION_TYPES } from '../../utils/constants.js';
import MysticalButton from '../common/Button.jsx';
import './NotificationPanel.css';

// =============================================================================
// NOTIFICATION PANEL COMPONENT
// =============================================================================

const NotificationPanel = ({
  notifications = [],
  onMarkAsRead,
  onClearAll,
  onClose,
  onNotificationClick,
  className = '',
  maxHeight = '400px',
  showEmptyState = true,
  groupByDate = true,
  enableActions = true,
  ...props
}) => {
  const panelRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.isRead);
    } else if (filter !== 'all') {
      filtered = notifications.filter(n => n.type === filter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications, filter]);

  const groupedNotifications = useMemo(() => {
    if (!groupByDate) return { today: filteredNotifications };

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    filteredNotifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      const notificationDay = new Date(
        notificationDate.getFullYear(),
        notificationDate.getMonth(),
        notificationDate.getDate()
      );

      if (notificationDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [filteredNotifications, groupByDate]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const availableFilters = useMemo(() => {
    const types = new Set(notifications.map(n => n.type));
    return [
      { value: 'all', label: 'All', count: notifications.length },
      { value: 'unread', label: 'Unread', count: unreadCount },
      ...Array.from(types).map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        count: notifications.filter(n => n.type === type).length
      }))
    ].filter(filter => filter.count > 0);
  }, [notifications, unreadCount]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleNotificationClick = useCallback((notification, event) => {
    event.stopPropagation();

    // Mark as read if unread
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Custom click handler
    if (onNotificationClick) {
      onNotificationClick(notification, event);
    }

    // Handle notification action if it exists
    if (notification.actionButton && notification.actionButton.action) {
      notification.actionButton.action(notification);
    }
  }, [onMarkAsRead, onNotificationClick]);

  const handleMarkAsRead = useCallback((notificationId, event) => {
    event.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  }, [onMarkAsRead]);

  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
    }
  }, [onClearAll]);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'success':
        return ICONS.CHECK_CIRCLE;
      case 'error':
        return ICONS.X_CIRCLE;
      case 'warning':
        return ICONS.EXCLAMATION_TRIANGLE;
      case 'info':
        return ICONS.INFO_CIRCLE;
      case 'story':
        return ICONS.BOOK;
      case 'comment':
        return ICONS.CHAT;
      case 'follow':
        return ICONS.USER_PLUS;
      case 'like':
        return ICONS.HEART;
      case 'achievement':
        return ICONS.STAR;
      case 'system':
        return ICONS.SETTINGS;
      default:
        return ICONS.BELL;
    }
  }, []);

  const formatNotificationTime = useCallback((date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  }, []);

  const renderFilterTabs = () => {
    if (availableFilters.length <= 1) return null;

    return (
      <div className="verse-notification-filters">
        {availableFilters.map(filterOption => (
          <button
            key={filterOption.value}
            className={`verse-notification-filter ${
              filter === filterOption.value ? 'active' : ''
            }`}
            onClick={() => handleFilterChange(filterOption.value)}
          >
            <span className="verse-filter-label">{filterOption.label}</span>
            <span className="verse-filter-count">{filterOption.count}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderNotificationItem = (notification) => {
    const notificationClasses = [
      'verse-notification-item',
      `type-${notification.type}`,
      `priority-${notification.priority || 'medium'}`,
      !notification.isRead && 'unread',
      notification.actionButton && 'has-action'
    ].filter(Boolean).join(' ');

    return (
      <div
        key={notification.id}
        className={notificationClasses}
        onClick={(event) => handleNotificationClick(notification, event)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleNotificationClick(notification, event);
          }
        }}
      >
        <div className="verse-notification-icon">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="verse-notification-content">
          <div className="verse-notification-header">
            <h4 className="verse-notification-title">
              {notification.title}
            </h4>
            <div className="verse-notification-meta">
              <span className="verse-notification-time">
                {formatNotificationTime(notification.createdAt)}
              </span>
              {!notification.isRead && enableActions && (
                <button
                  className="verse-notification-mark-read"
                  onClick={(event) => handleMarkAsRead(notification.id, event)}
                  aria-label="Mark as read"
                  title="Mark as read"
                >
                  {ICONS.CHECK}
                </button>
              )}
            </div>
          </div>

          {notification.message && (
            <p className="verse-notification-message">
              {notification.message}
            </p>
          )}

          {notification.actionButton && (
            <div className="verse-notification-action">
              <MysticalButton
                variant={notification.actionButton.variant || 'secondary'}
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  notification.actionButton.action(notification);
                }}
              >
                {notification.actionButton.label}
              </MysticalButton>
            </div>
          )}
        </div>

        {!notification.isRead && (
          <div className="verse-notification-unread-indicator" />
        )}
      </div>
    );
  };

  const renderNotificationGroup = (groupName, groupNotifications) => {
    if (groupNotifications.length === 0) return null;

    const groupLabels = {
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      older: 'Older'
    };

    return (
      <div key={groupName} className="verse-notification-group">
        {groupByDate && (
          <div className="verse-notification-group-header">
            <h3 className="verse-notification-group-title">
              {groupLabels[groupName]}
            </h3>
            <span className="verse-notification-group-count">
              {groupNotifications.length}
            </span>
          </div>
        )}
        
        <div className="verse-notification-group-items">
          {groupNotifications.map(renderNotificationItem)}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (!showEmptyState) return null;

    const emptyMessages = {
      all: 'No notifications yet',
      unread: 'All caught up!',
      story: 'No story notifications',
      comment: 'No comment notifications',
      follow: 'No follow notifications',
      like: 'No like notifications',
      achievement: 'No achievement notifications',
      system: 'No system notifications'
    };

    return (
      <div className="verse-notification-empty">
        <div className="verse-notification-empty-icon">
          {ICONS.BELL}
        </div>
        <h3 className="verse-notification-empty-title">
          {emptyMessages[filter] || 'No notifications'}
        </h3>
        <p className="verse-notification-empty-message">
          {filter === 'unread' 
            ? "You're all caught up! No unread notifications."
            : "When you have notifications, they'll appear here."
          }
        </p>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="verse-notification-header">
      <div className="verse-notification-header-left">
        <h2 className="verse-notification-title">
          Notifications
        </h2>
        {unreadCount > 0 && (
          <span className="verse-notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      <div className="verse-notification-header-actions">
        {enableActions && notifications.length > 0 && (
          <>
            <MysticalButton
              variant="ghost"
              size="xs"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >
              Clear All
            </MysticalButton>
            
            <button
              className="verse-notification-expand"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN}
            </button>
          </>
        )}

        {onClose && (
          <button
            className="verse-notification-close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            {ICONS.X}
          </button>
        )}
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const panelClasses = [
    'verse-notification-panel',
    isExpanded && 'expanded',
    filteredNotifications.length === 0 && 'empty',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={panelRef}
      className={panelClasses}
      style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
      role="region"
      aria-label="Notifications"
      {...props}
    >
      {renderHeader()}
      {renderFilterTabs()}

      <div className="verse-notification-content">
        {filteredNotifications.length > 0 ? (
          <div className="verse-notification-list">
            {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) =>
              renderNotificationGroup(groupName, groupNotifications)
            )}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;