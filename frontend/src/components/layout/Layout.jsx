/**
 * VERSE Mystical Layout Component
 * Main layout wrapper that orchestrates Header, Sidebar, and content areas
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import MysticalHeader from './Header.jsx';
import MysticalSidebar from './Sidebar.jsx';
import { BREAKPOINTS } from '../../utils/constants.js';
import AuthDebug from '../debug/AuthDebug.jsx';
import './Layout.css';

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

const LAYOUT_VARIANTS = {
  default: {
    sidebarWidth: '16rem',
    sidebarCollapsedWidth: '4rem',
    headerHeight: '4rem',
    contentPadding: 'var(--verse-space-lg)'
  },
  compact: {
    sidebarWidth: '14rem',
    sidebarCollapsedWidth: '3.5rem',
    headerHeight: '3.5rem',
    contentPadding: 'var(--verse-space-md)'
  },
  wide: {
    sidebarWidth: '18rem',
    sidebarCollapsedWidth: '4.5rem',
    headerHeight: '4.5rem',
    contentPadding: 'var(--verse-space-xl)'
  }
};

const PROTECTED_ROUTES = [
  '/dashboard',
  '/stories',
  '/write',
  '/library',
  '/profile',
  '/settings'
];

const SIDEBAR_HIDDEN_ROUTES = [
  '/login',
  '/register',
  '/welcome',
  '/onboarding'
];

// =============================================================================
// MYSTICAL LAYOUT COMPONENT
// =============================================================================

const MysticalLayout = ({
  children,
  variant = 'default',
  showSidebar = true,
  showHeader = true,
  sidebarCollapsed = false,
  className = '',
  contentClassName = '',
  ...props
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(sidebarCollapsed);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [contentScrolled, setContentScrolled] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const layoutConfig = useMemo(() => 
    LAYOUT_VARIANTS[variant] || LAYOUT_VARIANTS.default, [variant]
  );

  const currentPath = location.pathname;

  const shouldShowSidebar = useMemo(() => {
    if (!showSidebar) return false;
    if (SIDEBAR_HIDDEN_ROUTES.some(route => currentPath.startsWith(route))) return false;
    if (!isAuthenticated && PROTECTED_ROUTES.some(route => currentPath.startsWith(route))) return false;
    return true;
  }, [showSidebar, currentPath, isAuthenticated]);

  const shouldShowHeader = useMemo(() => {
    return showHeader;
  }, [showHeader]);

  const isProtectedRoute = useMemo(() => 
    PROTECTED_ROUTES.some(route => currentPath.startsWith(route)), [currentPath]
  );

  const effectiveSidebarCollapsed = useMemo(() => {
    if (isMobile) return false; // Always use overlay on mobile
    return isSidebarCollapsed;
  }, [isMobile, isSidebarCollapsed]);

  const layoutStyles = useMemo(() => ({
    '--verse-layout-sidebar-width': effectiveSidebarCollapsed 
      ? layoutConfig.sidebarCollapsedWidth 
      : layoutConfig.sidebarWidth,
    '--verse-layout-header-height': layoutConfig.headerHeight,
    '--verse-layout-content-padding': layoutConfig.contentPadding,
  }), [effectiveSidebarCollapsed, layoutConfig]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      setIsMobileMenuOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleContentScroll = useCallback((event) => {
    const scrollTop = event.target.scrollTop;
    const isScrolled = scrollTop > 20;
    
    if (isScrolled !== contentScrolled) {
      setContentScrolled(isScrolled);
    }
  }, [contentScrolled]);

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const newIsMobile = width <= BREAKPOINTS.mobile;
    const newIsTablet = width <= BREAKPOINTS.tablet && width > BREAKPOINTS.mobile;

    setIsMobile(newIsMobile);
    setIsTablet(newIsTablet);

    // Auto-close mobile menu on resize to desktop
    if (!newIsMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // Auto-collapse sidebar on tablet
    if (newIsTablet && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobileMenuOpen, isSidebarCollapsed]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Handle responsive behavior
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Handle route changes
  useEffect(() => {
    // Close mobile menu on route change
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // Reset content scroll
    setContentScrolled(false);

    // Handle auth redirects for protected routes
    if (isProtectedRoute && !authLoading && !isAuthenticated) {
      // This would typically be handled by a route guard
      console.warn('Attempted to access protected route without authentication');
    }
  }, [currentPath, isMobileMenuOpen, isProtectedRoute, authLoading, isAuthenticated]);

  // Handle escape key for mobile menu
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderHeader = () => {
    if (!shouldShowHeader) return null;

    return (
      <MysticalHeader
        variant={variant}
        showSidebarToggle={shouldShowSidebar}
        sidebarCollapsed={effectiveSidebarCollapsed}
        onSidebarToggle={handleSidebarToggle}
        isScrolled={contentScrolled}
        isMobile={isMobile}
        className="verse-layout-header"
      />
    );
  };

  const renderSidebar = () => {
    if (!shouldShowSidebar) return null;

    return (
      <MysticalSidebar
        variant={variant}
        isCollapsed={effectiveSidebarCollapsed}
        isOverlay={isMobile}
        isOpen={isMobile ? isMobileMenuOpen : true}
        onToggle={handleSidebarToggle}
        onClose={handleMobileMenuClose}
        className="verse-layout-sidebar"
      />
    );
  };

  const renderMainContent = () => {
    const contentClasses = [
      'verse-layout-content',
      contentScrolled && 'scrolled',
      contentClassName
    ].filter(Boolean).join(' ');

    return (
      <main 
        className={contentClasses}
        onScroll={handleContentScroll}
        role="main"
        aria-label="Main content"
      >
        <div className="verse-layout-content-inner">
          {children}
        </div>
        
        {/* Scroll indicator */}
        {contentScrolled && (
          <div className="verse-layout-scroll-indicator" />
        )}
        <AuthDebug />
      </main>
    );
  };

  // Replace the renderLoadingOverlay function with this enhanced version:

const renderLoadingOverlay = () => {
  // Don't show loading overlay on auth pages
  const isAuthPage = ['/login', '/register', '/welcome'].some(route => 
    currentPath.startsWith(route)
  );

  return null;
  
  // if (isAuthPage || !authLoading) return null;

  // return (
  //   <div className="verse-layout-loading-overlay">
  //     <div className="verse-layout-loading-content">
  //       <div className="verse-layout-loading-spinner">
  //         <div className="verse-loading-mystical">
  //           <div className="verse-loading-orb"></div>
  //           <div className="verse-loading-ring"></div>
  //           <div className="verse-loading-particles">
  //             <span></span>
  //             <span></span>
  //             <span></span>
  //             <span></span>
  //           </div>
  //         </div>
  //       </div>
  //       <p className="verse-layout-loading-text">
  //         Connecting to the mystical realm...
  //       </p>
  //     </div>
  //   </div>
  // );
};

  const renderMysticalEffects = () => {
    return (
      <div className="verse-layout-mystical-bg">
        <div className="verse-layout-cosmic-dust"></div>
        <div className="verse-layout-constellation">
          <div className="verse-layout-star star-1"></div>
          <div className="verse-layout-star star-2"></div>
          <div className="verse-layout-star star-3"></div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const layoutClasses = [
    'verse-layout',
    `variant-${variant}`,
    `theme-${theme}`,
    isDarkMode && 'dark-mode',
    shouldShowSidebar && 'has-sidebar',
    shouldShowHeader && 'has-header',
    effectiveSidebarCollapsed && 'sidebar-collapsed',
    isMobile && 'mobile',
    isTablet && 'tablet',
    isMobileMenuOpen && 'mobile-menu-open',
    contentScrolled && 'content-scrolled',
    authLoading && 'loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={layoutClasses}
      style={layoutStyles}
      {...props}
    >
      {renderMysticalEffects()}
      
      {renderHeader()}
      
      {renderSidebar()}
      
      <div className="verse-layout-main">
        {renderMainContent()}
      </div>

      {renderLoadingOverlay()}
    </div>
  );
};

export default MysticalLayout;