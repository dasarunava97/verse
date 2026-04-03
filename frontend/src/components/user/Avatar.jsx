/**
 * VERSE Mystical User Avatar Component
 * Enchanted user avatar with status indicators and mystical effects
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ICONS } from '../../utils/constants.js';
import './Avatar.css';

// =============================================================================
// AVATAR SIZE CONFIGURATIONS
// =============================================================================

const AVATAR_SIZES = {
  xs: {
    size: '1.5rem',
    fontSize: '0.625rem',
    statusSize: '0.375rem'
  },
  sm: {
    size: '2rem',
    fontSize: '0.75rem',
    statusSize: '0.5rem'
  },
  md: {
    size: '2.5rem',
    fontSize: '0.875rem',
    statusSize: '0.625rem'
  },
  lg: {
    size: '3rem',
    fontSize: '1rem',
    statusSize: '0.75rem'
  },
  xl: {
    size: '4rem',
    fontSize: '1.25rem',
    statusSize: '1rem'
  },
  '2xl': {
    size: '5rem',
    fontSize: '1.5rem',
    statusSize: '1.25rem'
  }
};

const STATUS_TYPES = {
  online: { color: '#10b981', label: 'Online' },
  away: { color: '#f59e0b', label: 'Away' },
  busy: { color: '#ef4444', label: 'Busy' },
  offline: { color: '#6b7280', label: 'Offline' }
};

// =============================================================================
// MYSTICAL USER AVATAR COMPONENT
// =============================================================================

const UserAvatar = ({
  user,
  size = 'md',
  variant = 'default',
  showOnlineStatus = false,
  showTooltip = false,
  isClickable = false,
  fallbackIcon = ICONS.USER,
  className = '',
  onClick,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const avatarConfig = useMemo(() => AVATAR_SIZES[size] || AVATAR_SIZES.md, [size]);

  const userInfo = useMemo(() => {
    if (!user) {
      return {
        initials: '?',
        displayName: 'Unknown User',
        avatarUrl: null,
        status: 'offline'
      };
    }

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const username = user.username || '';
    const email = user.email || '';

    // Generate initials
    let initials = '';
    if (firstName && lastName) {
      initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      initials = firstName.charAt(0).toUpperCase();
    } else if (username) {
      initials = username.charAt(0).toUpperCase();
    } else if (email) {
      initials = email.charAt(0).toUpperCase();
    } else {
      initials = '?';
    }

    // Generate display name
    let displayName = '';
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    } else if (username) {
      displayName = username;
    } else if (email) {
      displayName = email.split('@')[0];
    } else {
      displayName = 'Unknown User';
    }

    return {
      initials,
      displayName,
      avatarUrl: user.avatarUrl || user.profilePicture || null,
      status: user.status || user.onlineStatus || 'offline',
      profileType: user.profileType || 'user'
    };
  }, [user]);

  const statusConfig = useMemo(() => {
    return STATUS_TYPES[userInfo.status] || STATUS_TYPES.offline;
  }, [userInfo.status]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    
    if (onError) {
      onError();
    }
  }, [onError]);

  const handleClick = useCallback((event) => {
    if (isClickable && onClick) {
      onClick(event, user);
    }
  }, [isClickable, onClick, user]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getProfileTypeIcon = useCallback(() => {
    switch (userInfo.profileType) {
      case 'author':
        return ICONS.QUILL;
      case 'reader':
        return ICONS.BOOK;
      case 'editor':
        return ICONS.EDIT;
      case 'moderator':
        return ICONS.SHIELD;
      case 'admin':
        return ICONS.CROWN;
      default:
        return fallbackIcon;
    }
  }, [userInfo.profileType, fallbackIcon]);

  const generateGradientColor = useCallback(() => {
    // Generate a consistent color based on user initials
    const colors = [
      ['#8b5cf6', '#3b82f6'], // Purple to Blue
      ['#06b6d4', '#10b981'], // Cyan to Emerald
      ['#f59e0b', '#ef4444'], // Amber to Red
      ['#ec4899', '#8b5cf6'], // Pink to Purple
      ['#10b981', '#059669'], // Emerald to Green
      ['#3b82f6', '#1d4ed8'], // Blue to Blue Dark
    ];

    const charCode = userInfo.initials.charCodeAt(0) || 0;
    const colorIndex = charCode % colors.length;
    const [color1, color2] = colors[colorIndex];

    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }, [userInfo.initials]);

  const renderAvatarContent = () => {
    // Show image if available and not errored
    if (userInfo.avatarUrl && !imageError) {
      return (
        <img
          src={userInfo.avatarUrl}
          alt={`${userInfo.displayName}'s avatar`}
          className="verse-avatar-image"
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      );
    }

    // Show initials with gradient background
    return (
      <div 
        className="verse-avatar-initials"
        style={{ background: generateGradientColor() }}
      >
        <span className="verse-avatar-text">
          {userInfo.initials}
        </span>
      </div>
    );
  };

  const renderStatusIndicator = () => {
    if (!showOnlineStatus) return null;

    return (
      <div 
        className={`verse-avatar-status ${userInfo.status}`}
        style={{ 
          backgroundColor: statusConfig.color,
          width: avatarConfig.statusSize,
          height: avatarConfig.statusSize
        }}
        title={showTooltip ? statusConfig.label : undefined}
        aria-label={statusConfig.label}
      />
    );
  };

  const renderProfileTypeBadge = () => {
    if (!user?.profileType || user.profileType === 'user') return null;

    return (
      <div className={`verse-avatar-badge ${user.profileType}`}>
        <span className="verse-avatar-badge-icon">
          {getProfileTypeIcon()}
        </span>
      </div>
    );
  };

  const renderLoadingState = () => {
    if (!isLoading) return null;

    return (
      <div className="verse-avatar-loading">
        <div className="verse-avatar-spinner" />
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const avatarClasses = [
    'verse-avatar',
    `size-${size}`,
    `variant-${variant}`,
    isClickable && 'clickable',
    isLoading && 'loading',
    imageError && 'image-error',
    userInfo.status && `status-${userInfo.status}`,
    className
  ].filter(Boolean).join(' ');

  const avatarStyle = {
    width: avatarConfig.size,
    height: avatarConfig.size,
    fontSize: avatarConfig.fontSize,
    ...props.style
  };

  return (
    <div
      className={avatarClasses}
      style={avatarStyle}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={showTooltip ? userInfo.displayName : undefined}
      title={showTooltip ? userInfo.displayName : undefined}
      {...props}
    >
      <div className="verse-avatar-container">
        {renderAvatarContent()}
        {renderLoadingState()}
        {renderStatusIndicator()}
        {renderProfileTypeBadge()}
      </div>

      {/* Mystical glow effect for special users */}
      {(user?.profileType === 'admin' || user?.profileType === 'moderator') && (
        <div className="verse-avatar-aura" />
      )}
    </div>
  );
};

export default UserAvatar;