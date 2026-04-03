/**
 * VERSE Mystical Theme Toggle Component
 * Enchanted theme switcher with smooth transitions and mystical animations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ICONS } from '../../utils/constants.js';
import './ThemeToggle.css';

// =============================================================================
// THEME TOGGLE CONFIGURATIONS
// =============================================================================

const TOGGLE_SIZES = {
  xs: {
    width: '2rem',
    height: '1rem',
    thumbSize: '0.75rem',
    fontSize: '0.5rem'
  },
  sm: {
    width: '2.5rem',
    height: '1.25rem',
    thumbSize: '1rem',
    fontSize: '0.625rem'
  },
  md: {
    width: '3rem',
    height: '1.5rem',
    thumbSize: '1.25rem',
    fontSize: '0.75rem'
  },
  lg: {
    width: '3.5rem',
    height: '1.75rem',
    thumbSize: '1.5rem',
    fontSize: '0.875rem'
  }
};

const THEME_VARIANTS = {
  default: {
    lightBg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    darkBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    thumbLight: '#ffffff',
    thumbDark: '#334155'
  },
  mystical: {
    lightBg: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
    darkBg: 'linear-gradient(135deg, #581c87 0%, #3730a3 100%)',
    thumbLight: '#fbbf24',
    thumbDark: '#8b5cf6'
  },
  ethereal: {
    lightBg: 'linear-gradient(135deg, #ddd6fe 0%, #c084fc 100%)',
    darkBg: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)',
    thumbLight: '#a855f7',
    thumbDark: '#6366f1'
  },
  header: {
    lightBg: 'rgba(248, 250, 252, 0.1)',
    darkBg: 'rgba(51, 65, 85, 0.2)',
    thumbLight: 'rgba(255, 255, 255, 0.9)',
    thumbDark: 'rgba(124, 58, 237, 0.9)'
  }
};

// =============================================================================
// MYSTICAL THEME TOGGLE COMPONENT
// =============================================================================

const ThemeToggle = ({
  theme = 'auto',
  onToggle,
  size = 'md',
  variant = 'default',
  showLabel = false,
  showTooltip = true,
  disabled = false,
  animated = true,
  className = '',
  ...props
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const toggleConfig = useMemo(() => TOGGLE_SIZES[size] || TOGGLE_SIZES.md, [size]);
  const variantConfig = useMemo(() => THEME_VARIANTS[variant] || THEME_VARIANTS.default, [variant]);

  const themeInfo = useMemo(() => {
    const isDarkMode = theme === 'dark';
    const isLightMode = theme === 'light';
    const isAutoMode = theme === 'auto';

    return {
      isDarkMode,
      isLightMode,
      isAutoMode,
      currentIcon: isDarkMode ? ICONS.MOON : isLightMode ? ICONS.SUN : ICONS.AUTO,
      currentLabel: isDarkMode ? 'Dark Mode' : isLightMode ? 'Light Mode' : 'Auto Mode',
      nextTheme: isDarkMode ? 'light' : isLightMode ? 'auto' : 'dark',
      nextLabel: isDarkMode ? 'Switch to Light Mode' : isLightMode ? 'Switch to Auto Mode' : 'Switch to Dark Mode'
    };
  }, [theme]);

  const toggleStyle = useMemo(() => ({
    width: toggleConfig.width,
    height: toggleConfig.height,
    background: themeInfo.isDarkMode ? variantConfig.darkBg : variantConfig.lightBg,
    ...props.style
  }), [toggleConfig, themeInfo.isDarkMode, variantConfig, props.style]);

  const thumbStyle = useMemo(() => ({
    width: toggleConfig.thumbSize,
    height: toggleConfig.thumbSize,
    backgroundColor: themeInfo.isDarkMode ? variantConfig.thumbDark : variantConfig.thumbLight,
    transform: `translateX(${themeInfo.isDarkMode ? 
      `calc(${toggleConfig.width} - ${toggleConfig.thumbSize} - 0.125rem)` : 
      '0.125rem'
    })`
  }), [toggleConfig, themeInfo.isDarkMode, variantConfig]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleToggle = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || isToggling) return;

    setIsToggling(true);

    try {
      // Add small delay for animation feedback
      if (animated) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      if (onToggle) {
        onToggle(themeInfo.nextTheme);
      }
    } catch (error) {
      console.error('Theme toggle error:', error);
    } finally {
      setIsToggling(false);
    }
  }, [disabled, isToggling, animated, onToggle, themeInfo.nextTheme]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle(event);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setShowThemeMenu(prev => !prev);
    }
  }, [handleToggle]);

  const handleSpecificThemeSelect = useCallback((selectedTheme) => {
    if (onToggle) {
      onToggle(selectedTheme);
    }
    setShowThemeMenu(false);
  }, [onToggle]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderThemeIcon = () => {
    const iconClasses = [
      'verse-theme-icon',
      themeInfo.isDarkMode && 'dark',
      isToggling && 'toggling'
    ].filter(Boolean).join(' ');

    return (
      <span 
        className={iconClasses}
        style={{ fontSize: toggleConfig.fontSize }}
      >
        {themeInfo.currentIcon}
      </span>
    );
  };

  const renderThemeIndicators = () => (
    <div className="verse-theme-indicators">
      <span 
        className="verse-theme-indicator light"
        title="Light Mode"
        aria-label="Light Mode Indicator"
      >
        {ICONS.SUN || '☀️'}
      </span>
      <span 
        className="verse-theme-indicator dark"
        title="Dark Mode"
        aria-label="Dark Mode Indicator"
      >
        {ICONS.MOON || '🌙'}
      </span>
    </div>
  );

  const renderThemeMenu = () => {
    if (!showThemeMenu) return null;

    const themeOptions = [
      { value: 'light', label: 'Light Mode', icon: ICONS.SUN },
      { value: 'dark', label: 'Dark Mode', icon: ICONS.MOON },
      { value: 'auto', label: 'Auto Mode', icon: ICONS.AUTO }
    ];

    return (
      <div className="verse-theme-menu">
        <div className="verse-theme-menu-content">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              className={`verse-theme-menu-item ${theme === option.value ? 'active' : ''}`}
              onClick={() => handleSpecificThemeSelect(option.value)}
            >
              <span className="verse-theme-menu-icon">{option.icon}</span>
              <span className="verse-theme-menu-label">{option.label}</span>
              {theme === option.value && (
                <span className="verse-theme-menu-check">{ICONS.CHECK}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLabel = () => {
    if (!showLabel) return null;

    return (
      <span className="verse-theme-label">
        {themeInfo.currentLabel}
      </span>
    );
  };

  const renderTooltip = () => {
    if (!showTooltip) return null;

    return (
      <div className="verse-theme-tooltip">
        <span className="verse-theme-tooltip-text">
          {themeInfo.nextLabel}
        </span>
        <div className="verse-theme-tooltip-shortcut">
          <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const toggleClasses = [
    'verse-theme-toggle',
    `size-${size}`,
    `variant-${variant}`,
    themeInfo.isDarkMode && 'dark-mode',
    themeInfo.isAutoMode && 'auto-mode',
    disabled && 'disabled',
    isToggling && 'toggling',
    animated && 'animated',
    showThemeMenu && 'menu-open',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="verse-theme-toggle-container">
      <div
        className={toggleClasses}
        style={toggleStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={showTooltip ? themeInfo.nextLabel : undefined}
        aria-pressed={themeInfo.isDarkMode}
        role="switch"
        tabIndex={0}
        {...props}
      >
        {/* Toggle Track */}
        <div className="verse-theme-track">
          {/* Cosmic Background Effects */}
          <div className="verse-theme-cosmic-bg">
            <div className="verse-theme-stars"></div>
            <div className="verse-theme-planets"></div>
          </div>

          {/* Theme Indicators - Added before thumb for proper layering */}
          {renderThemeIndicators()}

          {/* Toggle Thumb */}
          <div 
            className="verse-theme-thumb"
            style={thumbStyle}
          >
            <div className="verse-theme-thumb-content">
              {renderThemeIcon()}
              
              {/* Mystical Glow Effect */}
              <div className="verse-theme-glow"></div>
            </div>
          </div>
        </div>

        {/* Ripple Effect */}
        {animated && (
          <div className="verse-theme-ripple"></div>
        )}

        {renderTooltip()}
      </div>

      {renderLabel()}
      {renderThemeMenu()}
    </div>
  );
};

export default ThemeToggle;