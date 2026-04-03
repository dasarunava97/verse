/**
 * VERSE Mystical Navigation Header
 * Enchanted navigation portal with adaptive theming and user controls
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import MysticalButton from '../common/Button.jsx';
import MysticalDropdown from '../common/Dropdown.jsx';
import MysticalModal from '../common/Modal.jsx';
import UserAvatar from '../user/Avatar.jsx';
import NotificationPanel from '../notifications/NotificationPanel.jsx';
import SearchBar from '../search/SearchBar.jsx';
import ThemeToggle from '../theme/ThemeToggle.jsx';
import { DeviceSpells, ScrollSpells, PerformanceSpells } from '../../utils/helpers.js';
import { ROUTES, ICONS, UI_CONFIG, THEMES } from '../../utils/constants.js';
import './Header.css';

// =============================================================================
// MYSTICAL HEADER COMPONENT
// =============================================================================

const MysticalHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  
  const { 
  user, 
  isAuthenticated, 
  isLoading: authLoading,
  logout,
  error: authError,
  authState,
  setAuthState
} = useAuth();

// Add debug logging after the useAuth call:
useEffect(() => {
  console.log('🎭 Header auth state:', {
    isAuthenticated,
    authLoading,
    user: user?.username || 'none',
    error: authError
  });
}, [isAuthenticated, authLoading, user, authError]);
  
  const { 
    theme, 
    toggleTheme, 
    isDarkMode 
  } = useTheme();
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearAll 
  } = useNotifications();

  // =============================================================================
  // COMPONENT STATE
  // =============================================================================

  const [headerState, setHeaderState] = useState({
    isScrolled: false,
    isMobileMenuOpen: false,
    isSearchExpanded: false,
    isNotificationPanelOpen: false,
    isUserMenuOpen: false,
    lastScrollY: 0,
    isVisible: true
  });

  const [searchState, setSearchState] = useState({
    query: '',
    results: [],
    isSearching: false,
    recentSearches: []
  });

  const [modalState, setModalState] = useState({
    showLogoutModal: false,
    showSearchModal: false,
    showSettingsModal: false
  });

  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: DeviceSpells.isMobileDevice(),
    isTablet: false,
    screenWidth: window.innerWidth
  });

  // =============================================================================
  // NAVIGATION CONFIGURATION
  // =============================================================================

  const navigationItems = useMemo(() => {
  const publicItems = [
    { 
      path: ROUTES.HOME, 
      label: 'Home', 
      icon: ICONS.HOME, 
      enabled: true 
    },
    { 
      path: ROUTES.EXPLORE, 
      label: 'Explore', 
      icon: ICONS.COMPASS, 
      enabled: false, 
      comingSoon: true 
    },
    { 
      path: ROUTES.COMMUNITY, 
      label: 'Community', 
      icon: ICONS.USERS, 
      enabled: false, 
      comingSoon: true 
    },
    { 
      path: ROUTES.ABOUT, 
      label: 'About', 
      icon: ICONS.INFO, 
      enabled: false, 
      comingSoon: true 
    }
  ];

  const authenticatedItems = [
    { 
      path: ROUTES.DASHBOARD, 
      label: 'Dashboard', 
      icon: ICONS.DASHBOARD, 
      enabled: true 
    },
    { 
      path: ROUTES.MY_STORIES, 
      label: 'Stories', 
      icon: ICONS.BOOK, 
      enabled: true 
    },
    { 
      path: ROUTES.LIBRARY, 
      label: 'Library', 
      icon: ICONS.BOOKMARK, 
      enabled: false, 
      comingSoon: true 
    },
    { 
      path: ROUTES.WRITING_TOOLS, 
      label: 'Tools', 
      icon: ICONS.QUILL, 
      enabled: false, 
      comingSoon: true 
    },
    { 
      path: ROUTES.COMMUNITY, 
      label: 'Community', 
      icon: ICONS.USERS, 
      enabled: false, 
      comingSoon: true 
    }
  ];

  return isAuthenticated ? authenticatedItems : publicItems;
}, [isAuthenticated]);

// Replace the existing handleLogout function (around line 140):
const handleLogout = useCallback(async () => {
  try {
    console.log('🎭 Starting logout process...');
    
    // Close any open modals/menus
    setModalState(prev => ({ ...prev, showLogoutModal: false }));
    setHeaderState(prev => ({
      ...prev,
      isUserMenuOpen: false,
      isMobileMenuOpen: false,
      isNotificationPanelOpen: false
    }));
    
    // Update auth state immediately for UI feedback
    setAuthState(prevState => ({
      ...prevState,
      isAuthenticated: false,
      user: null
    }));
    
    // Call the actual logout function if it exists
    // if (logout && typeof logout === 'function') {
    //   await logout();
    // }
    
    console.log('🎭 User logged out successfully');
    
    // Navigate to home
    navigate(ROUTES.HOME);
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still navigate to home even if logout fails
    setAuthState(prevState => ({
      ...prevState,
      isAuthenticated: false,
      user: null
    }));
    navigate(ROUTES.HOME);
  }
}, [logout, navigate, setAuthState]);

  const toggleMobileMenu = useCallback(() => {
    setHeaderState(prev => ({
      ...prev,
      isMobileMenuOpen: !prev.isMobileMenuOpen,
      isVisible: true // Always show header when menu is opened
    }));
  }, []);

  const userMenuItems = useMemo(() => [
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: ICONS.USER, 
      action: () => {},
      shortcut: 'P'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: ICONS.SETTINGS, 
      action: () => {},
      shortcut: 'S'
    },
    { 
      id: 'help', 
      label: 'Help Center', 
      icon: ICONS.HELP, 
      action: () => {},
      shortcut: 'H'
    },
    { type: 'divider' },
    { 
      id: 'logout', 
      label: 'Sign Out', 
      icon: ICONS.LOGOUT, 
      action: handleLogout,
      variant: 'danger',
      shortcut: 'Q'
    }
  ], [navigate, handleLogout]);

  // =============================================================================
  // SCROLL BEHAVIOR
  // =============================================================================

  const closeMobileMenu = useCallback(() => {
    setHeaderState(prev => ({ ...prev, isMobileMenuOpen: false }));
  }, []);


  const handleNavigationClick = useCallback((item, event) => {
  if (!item.enabled) {
    event.preventDefault();
    
    // Show coming soon notification
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('verse-notification', {
        detail: {
          type: 'info',
          title: 'Coming Soon!',
          message: `${item.label} feature will be available in the next update. Stay tuned for mystical enhancements!`,
          duration: 3000
        }
      }));
    }
    
    // For fallback if notification system isn't available
    setTimeout(() => {
      alert(`🚀 ${item.label} feature is coming soon! This will be available in the next update.`);
    }, 100);
    
    return;
  }
  
  // Normal navigation for enabled items
  closeMobileMenu();
}, [closeMobileMenu]);
  
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollThreshold = 10;
    const hideThreshold = 100;

    setHeaderState(prev => {
      const isScrolled = currentScrollY > scrollThreshold;
      const isScrollingDown = currentScrollY > prev.lastScrollY;
      const shouldHide = isScrollingDown && 
                        currentScrollY > hideThreshold && 
                        !prev.isMobileMenuOpen &&
                        !prev.isNotificationPanelOpen;

      return {
        ...prev,
        isScrolled,
        isVisible: !shouldHide,
        lastScrollY: currentScrollY
      };
    });
  }, []);

  // =============================================================================
  // SEARCH FUNCTIONALITY
  // =============================================================================

  const handleSearchChange = useCallback(async (query) => {
    setSearchState(prev => ({ 
      ...prev, 
      query,
      isSearching: query.length > 0
    }));

    if (query.length >= 2) {
      // Debounced search API call would go here
      const debouncedSearch = PerformanceSpells.castDebounce(async (searchQuery) => {
        try {
          // Mock search results for now
          const mockResults = [
            { id: 1, title: 'Mystical Adventures', type: 'story', author: 'MysticWriter' },
            { id: 2, title: 'Fantasy Realm Guide', type: 'guide', author: 'RealmMaster' },
            { id: 3, title: 'Enchanted Tales', type: 'collection', author: 'StoryWeaver' }
          ].filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.author.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchState(prev => ({
            ...prev,
            results: mockResults,
            isSearching: false
          }));
        } catch (error) {
          console.error('Search error:', error);
          setSearchState(prev => ({ ...prev, isSearching: false }));
        }
      }, 300);

      debouncedSearch(query);
    } else {
      setSearchState(prev => ({ 
        ...prev, 
        results: [], 
        isSearching: false 
      }));
    }
  }, []);

  const handleSearchSubmit = useCallback((query) => {
    if (query.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
      setHeaderState(prev => ({ ...prev, isSearchExpanded: false }));
      
      // Add to recent searches
      setSearchState(prev => ({
        ...prev,
        recentSearches: [
          query.trim(),
          ...prev.recentSearches.filter(s => s !== query.trim())
        ].slice(0, 5)
      }));
    }
  }, [navigate]);

  // =============================================================================
  // USER ACTIONS
  // =============================================================================

  
  const toggleNotificationPanel = useCallback(() => {
    setHeaderState(prev => ({
      ...prev,
      isNotificationPanelOpen: !prev.isNotificationPanelOpen,
      isUserMenuOpen: false // Close user menu if open
    }));
  }, []);

  const toggleUserMenu = useCallback(() => {
    setHeaderState(prev => ({
      ...prev,
      isUserMenuOpen: !prev.isUserMenuOpen,
      isNotificationPanelOpen: false // Close notification panel if open
    }));
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Scroll behavior
  useEffect(() => {
    const debouncedHandleScroll = PerformanceSpells.castDebounce(handleScroll, 10);
    
    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedHandleScroll);
  }, [handleScroll]);

  // Responsive behavior
  useEffect(() => {
    const handleResize = PerformanceSpells.castDebounce(() => {
      const newDeviceInfo = {
        isMobile: DeviceSpells.isMobileDevice(),
        isTablet: false,
        screenWidth: window.innerWidth
      };

      setDeviceInfo(newDeviceInfo);

      // Close mobile menu on desktop
      if (!newDeviceInfo.isMobile && headerState.isMobileMenuOpen) {
        setHeaderState(prev => ({ ...prev, isMobileMenuOpen: false }));
      }
    }, 150);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [headerState.isMobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setHeaderState(prev => ({
          ...prev,
          isNotificationPanelOpen: false,
          isUserMenuOpen: false,
          isSearchExpanded: false
        }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            setHeaderState(prev => ({ ...prev, isSearchExpanded: true }));
            break;
          case '/':
            event.preventDefault();
            setHeaderState(prev => ({ ...prev, isSearchExpanded: true }));
            break;
        }
      }

      // User menu shortcuts when user menu is open
      if (headerState.isUserMenuOpen && isAuthenticated) {
        const menuItem = userMenuItems.find(item => 
          item.shortcut && event.key.toLowerCase() === item.shortcut.toLowerCase()
        );
        if (menuItem && menuItem.action) {
          event.preventDefault();
          menuItem.action();
          setHeaderState(prev => ({ ...prev, isUserMenuOpen: false }));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [headerState.isUserMenuOpen, isAuthenticated, userMenuItems]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const computedValues = useMemo(() => {
    const currentPath = location.pathname;
    const isHomePage = currentPath === ROUTES.HOME;
    const isDashboardPage = currentPath === ROUTES.DASHBOARD;
    const showSearch = !deviceInfo.isMobile || headerState.isSearchExpanded;
    const headerClasses = [
      'verse-header',
      headerState.isScrolled && 'scrolled',
      !headerState.isVisible && 'hidden',
      isDarkMode && 'dark-mode',
      deviceInfo.isMobile && 'mobile',
      headerState.isMobileMenuOpen && 'menu-open'
    ].filter(Boolean).join(' ');

    return {
      currentPath,
      isHomePage,
      isDashboardPage,
      showSearch,
      headerClasses,
      showNotificationBadge: unreadCount > 0,
      notificationBadgeText: unreadCount > 99 ? '99+' : unreadCount.toString()
    };
  }, [
    location.pathname,
    deviceInfo.isMobile,
    headerState.isScrolled,
    headerState.isVisible,
    headerState.isSearchExpanded,
    headerState.isMobileMenuOpen,
    isDarkMode,
    unreadCount
  ]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderLogo = () => (
    <Link 
      to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME} 
      className="verse-header-logo"
      onClick={closeMobileMenu}
    >
      <span className="verse-logo-icon">{ICONS.MYSTICAL_BOOK}</span>
      <span className="verse-logo-text">VERSE</span>
    </Link>
  );

  const renderNavigation = () => (
  <nav className="verse-header-nav">
    <ul className="verse-nav-list">
      {navigationItems.map((item) => {
        const isActive = computedValues.currentPath === item.path;
        const isDisabled = !item.enabled;
        const isComingSoon = item.comingSoon;
        
        return (
          <li key={item.path} className="verse-nav-item">
            <Link
              to={item.enabled ? item.path : '#'}
              className={`verse-nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
              onClick={(event) => handleNavigationClick(item, event)}
              title={isComingSoon ? `${item.label} - Coming Soon!` : item.label}
              aria-label={isComingSoon ? `${item.label}: Coming soon in the next update` : `Navigate to ${item.label}`}
            >
              <span className="verse-nav-icon">
                {item.icon}
                {isComingSoon && (
                  <span className="verse-nav-coming-soon-badge">Soon</span>
                )}
              </span>
              <span className="verse-nav-label">
                {item.label}
                {/* {isComingSoon && (
                  <span className="verse-nav-coming-soon-text"> (Soon)</span>
                )} */}
              </span>
              
              {/* Tooltip for coming soon items */}
              {isComingSoon && (
                <div className="verse-nav-tooltip">
                  <div className="verse-nav-tooltip-content">
                    🚀 Coming Soon!
                    <br />
                    <small>This feature will be available in the next update</small>
                  </div>
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

  const renderSearchBar = () => {
    if (!computedValues.showSearch && !headerState.isSearchExpanded) return null;

    return (
      <div className={`verse-header-search ${headerState.isSearchExpanded ? 'expanded' : ''}`}>
        <SearchBar
          value={searchState.query}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          results={searchState.results}
          isSearching={searchState.isSearching}
          recentSearches={searchState.recentSearches}
          placeholder="Search stories, authors, and realms..."
          variant="header"
          showResults={searchState.query.length > 0}
        />
      </div>
    );
  };

  const renderUserActions = () => {
  // console.log('🎭 Rendering user actions - isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    return (
      <div className="verse-header-actions">
        <ThemeToggle 
          theme={theme}
          onToggle={toggleTheme}
          size="sm"
          variant="header"
        />
        
        <div className="verse-auth-buttons">
          <MysticalButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Sign In
          </MysticalButton>
          
          <MysticalButton
            variant="primary"
            size="sm"
            onClick={() => navigate(ROUTES.REGISTER)}
          >
            Join Realm
          </MysticalButton>
        </div>
      </div>
    );
  }

  // Authenticated user actions
  return (
    <div className="verse-header-actions">
      {/* Search toggle for mobile */}
      {deviceInfo.isMobile && (
        <button
          className="verse-search-toggle"
          onClick={() => setHeaderState(prev => ({ 
            ...prev, 
            isSearchExpanded: !prev.isSearchExpanded 
          }))}
          aria-label="Toggle search"
        >
          {ICONS.SEARCH}
        </button>
      )}

      <ThemeToggle 
        theme={theme}
        onToggle={toggleTheme}
        size="sm"
        variant="header"
      />

      {/* Notifications */}
      <div className="verse-notification-trigger">
        <button
          className={`verse-notification-button ${
            headerState.isNotificationPanelOpen ? 'active' : ''
          }`}
          onClick={toggleNotificationPanel}
          aria-label={`Notifications ${computedValues.showNotificationBadge ? `(${unreadCount} unread)` : ''}`}
        >
          {ICONS.BELL}
          {computedValues.showNotificationBadge && (
            <span className="verse-notification-badge">
              {computedValues.notificationBadgeText}
            </span>
          )}
        </button>

        {headerState.isNotificationPanelOpen && (
          <NotificationPanel
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAll}
            onClose={() => setHeaderState(prev => ({ 
              ...prev, 
              isNotificationPanelOpen: false 
            }))}
          />
        )}
      </div>

      {/* User menu */}
      <MysticalDropdown
        trigger={
          <button className="verse-user-trigger">
            <UserAvatar
              user={authState.user}
              size="sm"
              showOnlineStatus
            />
            {/* <span className="verse-user-name">
              {authState.user?.firstName || authState.user?.username}
            </span> */}
            <span className="verse-dropdown-arrow">
              {headerState.isUserMenuOpen ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN}
            </span>
          </button>
        }
        isOpen={headerState.isUserMenuOpen}
        onToggle={toggleUserMenu}
        items={userMenuItems}
        placement="bottom-end"
        variant="mystical"
        showShortcuts
      />
    </div>
  );
};

  const renderMobileMenuToggle = () => {
    if (!deviceInfo.isMobile) return null;

    return (
      <button
        className={`verse-mobile-menu-toggle ${
          headerState.isMobileMenuOpen ? 'active' : ''
        }`}
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={headerState.isMobileMenuOpen}
      >
        <span className="verse-hamburger-line"></span>
        <span className="verse-hamburger-line"></span>
        <span className="verse-hamburger-line"></span>
      </button>
    );
  };

  const renderMobileMenu = () => {
  if (!deviceInfo.isMobile || !headerState.isMobileMenuOpen) return null;

  return (
    <div className="verse-mobile-menu">
      <div className="verse-mobile-menu-content">
        {/* Mobile search */}
        <div className="verse-mobile-search">
          <SearchBar
            value={searchState.query}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
            results={searchState.results}
            isSearching={searchState.isSearching}
            placeholder="Search stories, authors..."
            variant="mobile"
            autoFocus
          />
        </div>

        {/* Mobile navigation */}
        <nav className="verse-mobile-nav">
          <ul className="verse-mobile-nav-list">
            {navigationItems.map((item) => {
              const isActive = computedValues.currentPath === item.path;
              const isDisabled = !item.enabled;
              const isComingSoon = item.comingSoon;
              
              return (
                <li key={item.path} className="verse-mobile-nav-item">
                  <Link
                    to={item.enabled ? item.path : '#'}
                    className={`verse-mobile-nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
                    onClick={(event) => handleNavigationClick(item, event)}
                  >
                    <span className="verse-mobile-nav-icon">
                      {item.icon}
                      {isComingSoon && (
                        <span className="verse-mobile-nav-coming-soon-badge">Soon</span>
                      )}
                    </span>
                    <span className="verse-mobile-nav-label">
                      {item.label}
                      {isComingSoon && (
                        <span className="verse-mobile-nav-coming-soon-text"> (Soon)</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile user section */}
        {authState.isAuthenticated && (
          <div className="verse-mobile-user">
            <div className="verse-mobile-user-info">
              <UserAvatar user={authState.user} size="md" />
              <div className="verse-mobile-user-details">
                <span className="verse-mobile-user-name">
                  {authState.user?.firstName} {authState.user?.lastName}
                </span>
                <span className="verse-mobile-user-email">
                  {authState.user?.email}
                </span>
              </div>
            </div>

            <div className="verse-mobile-user-actions">
              {userMenuItems.filter(item => item.type !== 'divider').map((item) => (
                <button
                  key={item.id}
                  className={`verse-mobile-user-action ${item.variant || ''}`}
                  onClick={async(event) => {
                    // event.stopPropagation();
                    event.preventDefault();
                    console.log(`🎭 Mobile menu action: ${item.label}`);
                    if(item.label === 'Sign Out') await handleLogout();
                     else item.action();
                    closeMobileMenu();
                  }}
                >
                  <span className="verse-mobile-action-icon">{item.icon}</span>
                  <span className="verse-mobile-action-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu overlay */}
      <div 
        className="verse-mobile-menu-overlay"
        onClick={closeMobileMenu}
      />
    </div>
  );
};

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <>
      <header ref={headerRef} className={computedValues.headerClasses}>
        <div className="verse-header-container">
          <div className="verse-header-left">
            {renderLogo()}
            {!deviceInfo.isMobile && renderNavigation()}
          </div>

          <div className="verse-header-center">
            {renderSearchBar()}
          </div>

          <div className="verse-header-right">
            {renderUserActions()}
            {renderMobileMenuToggle()}
          </div>
        </div>

        {renderMobileMenu()}
      </header>

      {/* Logout Confirmation Modal */}
      <MysticalModal
        isOpen={modalState.showLogoutModal}
        onClose={() => setModalState(prev => ({ ...prev, showLogoutModal: false }))}
        title="Leave the Mystical Realm?"
        subtitle="Are you sure you want to sign out of your account?"
        size="small"
        variant="confirmation"
      >
        <div className="verse-logout-modal-actions">
          <MysticalButton
            variant="secondary"
            onClick={() => setModalState(prev => ({ ...prev, showLogoutModal: false }))}
          >
            Stay in Realm
          </MysticalButton>
          
          <MysticalButton
            variant="danger"
            onClick={handleLogout}
            loading={authLoading}
          >
            Sign Out
          </MysticalButton>
        </div>
      </MysticalModal>
    </>
  );
};

export default MysticalHeader;