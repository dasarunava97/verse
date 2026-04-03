/**
 * VERSE Mystical Sidebar Component
 * Enchanted navigation portal with adaptive layout and mystical effects
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import UserAvatar from '../user/Avatar.jsx';
import { ICONS } from '../../utils/constants.js';
import './Sidebar.css';

// =============================================================================
// SIDEBAR NAVIGATION CONFIGURATION
// =============================================================================

const NAVIGATION_SECTIONS = {
  main: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: ICONS.DASHBOARD,
      path: '/dashboard',
      description: 'Your mystical realm overview',
      enabled: true // Explicitly enabled
    },
    {
      id: 'stories',
      label: 'Stories',
      icon: ICONS.BOOK,
      path: '/stories',
      description: 'Explore enchanted tales',
      // badge: 'new',
      enabled: true // Explicitly enabled
    },
    {
      id: 'write',
      label: 'Write',
      icon: ICONS.QUILL,
      path: '/write',
      description: 'Craft your magical story',
      enabled: false, // Disabled
      comingSoon: true
    },
    {
      id: 'library',
      label: 'Library',
      icon: ICONS.LIBRARY,
      path: '/library',
      description: 'Your personal collection',
      enabled: false, // Disabled
      comingSoon: true
    }
  ],
  discover: [
    {
      id: 'explore',
      label: 'Explore',
      icon: ICONS.COMPASS,
      path: '/explore',
      description: 'Discover new realms',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'genres',
      label: 'Genres',
      icon: ICONS.CATEGORIES,
      path: '/genres',
      description: 'Browse by magical categories',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'authors',
      label: 'Authors',
      icon: ICONS.USERS,
      path: '/authors',
      description: 'Meet fellow storytellers',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: ICONS.TRENDING,
      path: '/trending',
      description: 'Popular enchantments',
      badge: 'hot',
      enabled: false,
      comingSoon: true
    }
  ],
  community: [
    {
      id: 'feed',
      label: 'Feed',
      icon: ICONS.FEED,
      path: '/feed',
      description: 'Community updates',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'forums',
      label: 'Forums',
      icon: ICONS.CHAT,
      path: '/forums',
      description: 'Join the conversation',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'events',
      label: 'Events',
      icon: ICONS.CALENDAR,
      path: '/events',
      description: 'Mystical gatherings',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'contests',
      label: 'Contests',
      icon: ICONS.TROPHY,
      path: '/contests',
      description: 'Prove your mastery',
      enabled: false,
      comingSoon: true
    }
  ],
  personal: [
    {
      id: 'profile',
      label: 'Profile',
      icon: ICONS.USER,
      path: '/profile',
      description: 'Your mystical identity',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: ICONS.SETTINGS,
      path: '/settings',
      description: 'Customize your realm',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'help',
      label: 'Help',
      icon: ICONS.HELP,
      path: '/help',
      description: 'Guidance for travelers',
      enabled: false,
      comingSoon: true
    }
  ]
};
const SIDEBAR_SIZES = {
  collapsed: '4rem',
  normal: '16rem',
  expanded: '20rem'
};

// =============================================================================
// MYSTICAL SIDEBAR COMPONENT
// =============================================================================

const MysticalSidebar = ({
  isCollapsed = false,
  isOverlay = false,
  onToggle,
  onClose,
  className = '',
  variant = 'default',
  ...props
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [isHovered, setIsHovered] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isExpanded = useMemo(() => {
    return !isCollapsed || isHovered;
  }, [isCollapsed, isHovered]);

  const currentPath = location.pathname;

  const activeNavItem = useMemo(() => {
    const allItems = [
      ...NAVIGATION_SECTIONS.main,
      ...NAVIGATION_SECTIONS.discover,
      ...NAVIGATION_SECTIONS.community,
      ...NAVIGATION_SECTIONS.personal
    ];
    return allItems.find(item => currentPath.startsWith(item.path));
  }, [currentPath]);

  const sidebarWidth = useMemo(() => {
    if (isCollapsed && !isHovered) return SIDEBAR_SIZES.collapsed;
    return SIDEBAR_SIZES.normal;
  }, [isCollapsed, isHovered]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

 const handleNavigation = useCallback((item) => {
  // Check if item is enabled
  if (!item.enabled) {
    // Show coming soon notification instead of navigating
    window.dispatchEvent(new CustomEvent('verse-notification', {
      detail: {
        type: 'info',
        title: 'Coming Soon!',
        message: `${item.label} feature will be available in the next update. Stay tuned for mystical enhancements!`,
        duration: 3000
      }
    }));
    return;
  }

  navigate(item.path);
  
  if (isOverlay && onClose) {
    onClose();
  }

  // Track navigation analytics
  window.dispatchEvent(new CustomEvent('verse-navigation', {
    detail: { 
      from: currentPath, 
      to: item.path, 
      itemId: item.id 
    }
  }));
}, [navigate, isOverlay, onClose, currentPath]);

  const handleMouseEnter = useCallback(() => {
    if (isCollapsed) {
      setIsHovered(true);
    }
  }, [isCollapsed]);

  const handleMouseLeave = useCallback(() => {
    if (isCollapsed) {
      setIsHovered(false);
      setActiveSection(null);
    }
  }, [isCollapsed]);

  const handleSectionHover = useCallback((sectionKey) => {
    if (isCollapsed && isHovered) {
      setActiveSection(sectionKey);
    }
  }, [isCollapsed, isHovered]);

  const handleUserMenuToggle = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleKeyDown = useCallback((event, item) => {
  if (!item.enabled) return; // Don't handle keyboard navigation for disabled items
  
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleNavigation(item);
  }
}, [handleNavigation]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.verse-sidebar-user')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Handle escape key for overlay
  useEffect(() => {
    if (isOverlay) {
      const handleEscape = (event) => {
        if (event.key === 'Escape' && onClose) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOverlay, onClose]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderNavigationSection = (sectionKey, items) => {
    const sectionConfig = {
      main: { title: 'Main', icon: ICONS.HOME },
      discover: { title: 'Discover', icon: ICONS.COMPASS },
      community: { title: 'Community', icon: ICONS.USERS },
      personal: { title: 'Personal', icon: ICONS.USER }
    };

    const config = sectionConfig[sectionKey];
    const isActive = activeSection === sectionKey;

    return (
      <div 
        key={sectionKey}
        className={`verse-sidebar-section ${isActive ? 'active' : ''}`}
        onMouseEnter={() => handleSectionHover(sectionKey)}
      >
        {isExpanded && (
          <div className="verse-sidebar-section-header">
            <span className="verse-sidebar-section-icon">
              {config.icon}
            </span>
            <span className="verse-sidebar-section-title">
              {config.title}
            </span>
          </div>
        )}

        <ul className="verse-sidebar-nav-list">
          {items.map((item) => renderNavigationItem(item))}
        </ul>
      </div>
    );
  };

  const renderNavigationItem = (item) => {
  const isActive = activeNavItem?.id === item.id;
  const hasNotifications = item.id === 'feed' && unreadCount > 0;
  const isDisabled = !item.enabled;
  const isComingSoon = item.comingSoon;

  return (
    <li key={item.id} className="verse-sidebar-nav-item">
      <button
        className={`verse-sidebar-nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
        onClick={() => handleNavigation(item)}
        onKeyDown={(e) => handleKeyDown(e, item)}
        title={!isExpanded ? 
          (isComingSoon ? `${item.label} - Coming Soon!` : item.label) : 
          undefined
        }
        aria-label={isComingSoon ? 
          `${item.label}: Coming soon in the next update` : 
          `Navigate to ${item.label}: ${item.description}`
        }
        disabled={isDisabled}
      >
        <span className="verse-sidebar-nav-icon">
          {item.icon}
          {hasNotifications && (
            <span className="verse-sidebar-notification-dot">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {isComingSoon && (
            <span className="verse-sidebar-coming-soon-badge">
              Soon
            </span>
          )}
        </span>

        {isExpanded && (
          <span className="verse-sidebar-nav-content">
            <span className="verse-sidebar-nav-label">
              {item.label}
              {isComingSoon && (
                <span className="verse-sidebar-coming-soon-text"> (Soon)</span>
              )}
            </span>
            <span className="verse-sidebar-nav-description" title={
              isComingSoon ? 
                'This feature will be available in the next update!' : 
                item.description
            }>
              {isComingSoon ? 
                'Coming in the next update!' : 
                item.description
              }
            </span>
          </span>
        )}

        {isExpanded && item.badge && !isComingSoon && (
          <span className={`verse-sidebar-nav-badge ${item.badge}`}>
            {item.badge === 'new' ? 'NEW' : item.badge === 'hot' ? '🔥' : item.badge}
          </span>
        )}

        {isActive && !isDisabled && (
          <div className="verse-sidebar-nav-active-indicator" />
        )}

        {/* Tooltip for coming soon items */}
        {isComingSoon && (
          <div className="verse-sidebar-tooltip">
            <div className="verse-sidebar-tooltip-content">
              🚀 Coming Soon!
              <br />
              <small>This feature will be available in the next update</small>
            </div>
          </div>
        )}
      </button>
    </li>
  );
};

  const renderUserSection = () => {
    if (!isAuthenticated || !user) {
      return (
        <div className="verse-sidebar-auth">
          <button
            className="verse-sidebar-auth-button"
            onClick={() => navigate('/login')}
          >
            <span className="verse-sidebar-auth-icon">
              {ICONS.LOGIN}
            </span>
            {isExpanded && (
              <span className="verse-sidebar-auth-text">
                Sign In
              </span>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className={`verse-sidebar-user ${isUserMenuOpen ? 'menu-open' : ''}`}>
        <button
          className="verse-sidebar-user-trigger"
          onClick={handleUserMenuToggle}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="true"
        >
          <UserAvatar
            user={user}
            size={isExpanded ? 'md' : 'sm'}
            showOnlineStatus={true}
            variant="mystical"
          />

          {isExpanded && (
            <div className="verse-sidebar-user-info">
              <span className="verse-sidebar-user-name">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username}
              </span>
              <span className="verse-sidebar-user-role">
                {user.profileType || 'Storyteller'}
              </span>
            </div>
          )}

          {isExpanded && (
            <span className="verse-sidebar-user-chevron">
              {isUserMenuOpen ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN}
            </span>
          )}
        </button>

        {isUserMenuOpen && (
          <div className="verse-sidebar-user-menu">
            <div className="verse-sidebar-user-menu-content">
              <button
                className="verse-sidebar-user-menu-item"
                onClick={() => {
                  navigate('/profile');
                  setIsUserMenuOpen(false);
                }}
              >
                <span className="verse-sidebar-user-menu-icon">
                  {ICONS.USER}
                </span>
                <span className="verse-sidebar-user-menu-text">
                  Profile
                </span>
              </button>

              <button
                className="verse-sidebar-user-menu-item"
                onClick={() => {
                  navigate('/settings');
                  setIsUserMenuOpen(false);
                }}
              >
                <span className="verse-sidebar-user-menu-icon">
                  {ICONS.SETTINGS}
                </span>
                <span className="verse-sidebar-user-menu-text">
                  Settings
                </span>
              </button>

              <div className="verse-sidebar-user-menu-divider" />

              <button
                className="verse-sidebar-user-menu-item theme-toggle"
                onClick={() => {
                  toggleTheme();
                  setIsUserMenuOpen(false);
                }}
              >
                <span className="verse-sidebar-user-menu-icon">
                  {theme === 'dark' ? ICONS.SUN : ICONS.MOON}
                </span>
                <span className="verse-sidebar-user-menu-text">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>

              <div className="verse-sidebar-user-menu-divider" />

              <button
                className="verse-sidebar-user-menu-item logout"
                onClick={handleLogout}
              >
                <span className="verse-sidebar-user-menu-icon">
                  {ICONS.LOGOUT}
                </span>
                <span className="verse-sidebar-user-menu-text">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderToggleButton = () => {
    if (isOverlay || !onToggle) return null;

    return (
      <button
        className="verse-sidebar-toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="verse-sidebar-toggle-icon">
          {isCollapsed ? ICONS.CHEVRON_RIGHT : ICONS.CHEVRON_LEFT}
        </span>
      </button>
    );
  };

  const renderMysticalEffects = () => {
    return (
      <div className="verse-sidebar-mystical-effects">
        <div className="verse-sidebar-constellation">
          <div className="verse-sidebar-star star-1"></div>
          <div className="verse-sidebar-star star-2"></div>
          <div className="verse-sidebar-star star-3"></div>
          <div className="verse-sidebar-star star-4"></div>
          <div className="verse-sidebar-star star-5"></div>
        </div>
        <div className="verse-sidebar-cosmic-dust"></div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const sidebarClasses = [
    'verse-sidebar',
    `variant-${variant}`,
    isCollapsed && 'collapsed',
    isExpanded && 'expanded',
    isHovered && 'hovered',
    isOverlay && 'overlay',
    theme && `theme-${theme}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      {isOverlay && (
        <div 
          className="verse-sidebar-overlay-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={sidebarClasses}
        style={{ width: sidebarWidth }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="navigation"
        aria-label="Main navigation"
        {...props}
      >
        {renderMysticalEffects()}

        <div className="verse-sidebar-content">
          {/* Header Section */}
          <div className="verse-sidebar-header">
            <div className="verse-sidebar-logo">
              {isExpanded ? (
                <div className="verse-sidebar-logo-full">
                  <span className="verse-sidebar-logo-icon">
                    ✨
                  </span>
                  <span className="verse-sidebar-logo-text">
                    VERSE
                  </span>
                </div>
              ) : (
                <span className="verse-sidebar-logo-icon">
                  ✨
                </span>
              )}
            </div>

            {renderToggleButton()}
          </div>

          {/* Navigation Sections */}
          <nav className="verse-sidebar-navigation">
            {Object.entries(NAVIGATION_SECTIONS).map(([sectionKey, items]) =>
              renderNavigationSection(sectionKey, items)
            )}
          </nav>

          {/* User Section */}
          {/* <div className="verse-sidebar-footer">
            {renderUserSection()}
          </div> */}
        </div>
      </aside>
    </>
  );
};

export default MysticalSidebar;