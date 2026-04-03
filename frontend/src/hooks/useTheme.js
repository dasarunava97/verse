/**
 * VERSE Mystical Theme Management Hook
 * Enchanted theme switching with persistent storage and system preferences
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';

// =============================================================================
// THEME CONTEXT CREATION
// =============================================================================

const ThemeContext = createContext({
  theme: 'dark',
  isDarkMode: true,
  isLightMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
  systemPreference: 'dark'
});

// =============================================================================
// THEME PROVIDER COMPONENT
// =============================================================================

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('dark');
  const [systemPreference, setSystemPreference] = useState('dark');

  // =============================================================================
  // THEME DETECTION AND PERSISTENCE
  // =============================================================================

  const getStoredTheme = useCallback(() => {
    try {
      const stored = localStorage.getItem('verse-theme');
      return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'auto';
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return 'auto';
    }
  }, []);

  const saveTheme = useCallback((newTheme) => {
    try {
      localStorage.setItem('verse-theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, []);

  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return 'dark';
    
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('Failed to detect system theme preference:', error);
      return 'dark';
    }
  }, []);

  const resolveTheme = useCallback((themePreference, systemPref) => {
    if (themePreference === 'auto') {
      return systemPref;
    }
    return themePreference;
  }, []);

  // =============================================================================
  // THEME APPLICATION
  // =============================================================================

  const applyTheme = useCallback((resolvedTheme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('verse-theme-light', 'verse-theme-dark');
    body.classList.remove('verse-light', 'verse-dark');

    // Apply new theme classes
    root.classList.add(`verse-theme-${resolvedTheme}`);
    body.classList.add(`verse-${resolvedTheme}`);

    // Update meta theme-color for mobile browsers
    const updateMetaThemeColor = (color) => {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.content = color;
    };

    const themeColors = {
      dark: '#0f172a', // verse-realm-void
      light: '#f8fafc'  // verse-text-moonlight equivalent
    };

    updateMetaThemeColor(themeColors[resolvedTheme]);

    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('verse-theme-changed', {
      detail: { theme: resolvedTheme }
    }));
  }, []);

  // =============================================================================
  // THEME SETTERS
  // =============================================================================

  const setTheme = useCallback((newTheme) => {
    if (!['light', 'dark', 'auto'].includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}. Using 'auto' instead.`);
      newTheme = 'auto';
    }

    const resolvedTheme = resolveTheme(newTheme, systemPreference);
    
    setThemeState(newTheme);
    saveTheme(newTheme);
    applyTheme(resolvedTheme);
  }, [systemPreference, resolveTheme, saveTheme, applyTheme]);

  const toggleTheme = useCallback(() => {
    const storedTheme = getStoredTheme();
    
    if (storedTheme === 'auto') {
      // Auto -> Light/Dark (opposite of system)
      const newTheme = systemPreference === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    } else {
      // Light/Dark -> opposite
      const newTheme = storedTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    }
  }, [getStoredTheme, systemPreference, setTheme]);

  // =============================================================================
  // INITIALIZATION AND EFFECTS
  // =============================================================================

  // Initialize theme on mount
  useEffect(() => {
    const initialSystemPreference = getSystemPreference();
    setSystemPreference(initialSystemPreference);

    const storedTheme = getStoredTheme();
    const resolvedTheme = resolveTheme(storedTheme, initialSystemPreference);
    
    setThemeState(storedTheme);
    applyTheme(resolvedTheme);
  }, [getSystemPreference, getStoredTheme, resolveTheme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const newSystemPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newSystemPreference);

      // If theme is set to auto, update the resolved theme
      const storedTheme = getStoredTheme();
      if (storedTheme === 'auto') {
        applyTheme(newSystemPreference);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, [getStoredTheme, applyTheme]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const resolvedTheme = resolveTheme(theme, systemPreference);
  const isDarkMode = resolvedTheme === 'dark';
  const isLightMode = resolvedTheme === 'light';

  const contextValue = {
    theme,
    resolvedTheme,
    isDarkMode,
    isLightMode,
    systemPreference,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// =============================================================================
// THEME HOOK
// =============================================================================

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// =============================================================================
// THEME UTILITIES
// =============================================================================

export const getThemeValue = (lightValue, darkValue, currentTheme) => {
  return currentTheme === 'dark' ? darkValue : lightValue;
};

export const createThemeAwareStyle = (lightStyles, darkStyles) => {
  return (theme) => theme === 'dark' ? darkStyles : lightStyles;
};

// =============================================================================
// THEME CONSTANTS
// =============================================================================

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

export const THEME_STORAGE_KEY = 'verse-theme';

export default useTheme;