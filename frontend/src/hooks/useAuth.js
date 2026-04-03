/**
 * VERSE Mystical Authentication Hook
 * Simplified version with direct state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AuthSpells from '../services/auth.js';
import { APISpells } from '../services/api.js';
import { MysticalVault, ErrorSpells, DeviceSpells } from '../utils/helpers.js';
import { STORAGE_KEYS, AUTH_CONFIG, DEV_CONFIG } from '../utils/constants.js';

// =============================================================================
// AUTHENTICATION CONTEXT
// =============================================================================

const AuthContext = createContext(null);

// =============================================================================
// AUTHENTICATION STATE MANAGEMENT
// =============================================================================

/**
 * Create initial authentication state
 */
const createAuthState = () => ({
  // Core authentication state
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  
  // User data
  user: null,
  
  // Token information
  tokenMetadata: null,
  needsRefresh: false,
  
  // Error state
  error: null,
  
  // Action states
  isLoggingIn: false,
  isLoggingOut: false,
  isRegistering: false,
  isRefreshing: false,
  
  // Session information
  sessionId: null,
  lastActivity: null,
  sessionTimeout: null
});

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

export const AuthProvider = ({ children, ...options }) => {
  const authValue = useAuthLogic(options);
  
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// SIMPLIFIED AUTHENTICATION HOOK LOGIC
// =============================================================================

/**
 * Main authentication hook logic - separated for provider use
 */
const useAuthLogic = (options = {}) => {
  const {
    autoRefresh = true,
    enableSessionTimeout = true,
    sessionTimeoutDuration = AUTH_CONFIG.SESSION_TIMEOUT || 30 * 60 * 1000,
    enableActivityTracking = true,
    persistAuthState = true,
    onAuthStateChange = null,
    onSessionTimeout = null,
    onTokenRefresh = null,
    onAuthError = null
  } = options;

  // State management
  const [authState, setAuthState] = useState(createAuthState);
  
  // Refs for tracking and cleanup
  const mountedRef = useRef(true);
  const sessionTimeoutRef = useRef(null);
  const initializationPromise = useRef(null);

  // =============================================================================
  // CORE METHODS - SIMPLIFIED
  // =============================================================================

  const login = useCallback(async (credentials) => {
    try {
      console.log('🔑 Starting login process...');
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoggingIn: true,
        isLoading: true,
        error: null 
      }));

      const result = await AuthSpells.castLoginSpell(credentials);
      console.log('✅ Login result:', result);
      
      // if (!mountedRef.current) return result;

      const newState = {
        isAuthenticated: true,
        isLoggingIn: false,
        isLoading: false,
        user: result.user,
        tokenMetadata: result.tokenMetadata,
        needsRefresh: false,
        error: null,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastActivity: Date.now()
      };

      setAuthState(prev => ({ ...prev, ...newState }));
      
      console.log('✨ Login successful - Auth state updated ' + newState);
      
      return result;

    } catch (error) {
      console.error('❌ Login error:', error);
      
      if (!mountedRef.current) return;

      const errorState = {
        isLoggingIn: false,
        isLoading: false,
        error: error.message || 'Login failed'
      };

      setAuthState(prev => ({ ...prev, ...errorState }));
      throw error;
    }
  }, []);

  const generateBasicStory = useCallback(async (basicStoryData) => {
    try {
      console.log('📝 Starting basic story generation process...');

      const response = await APISpells.stories.create(basicStoryData);
      const result = response;
      console.log('✅ Basic story generation result:', result);

      if (!mountedRef.current) return result;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));

      return result;

    } catch (error) {
      console.error('❌ Basic story generation error:', error);

      if (!mountedRef.current) return;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Basic story generation failed'
      }));
      throw error;
    }
  }, []);

  const listStories = useCallback(async (userData) => {
    try {
      console.log('📝 Starting story listing process...', userData);

      const response = await APISpells.stories.list(userData);
      const result = response;
      console.log('✅ Story list result:', result);

      // if (!mountedRef.current) return result;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));

      return result;

    } catch (error) {
      console.error('❌ Story listing error:', error);

      if (!mountedRef.current) return;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Story listing failed'
      }));
      throw error;
    }
  }, []);

  const deleteStories = useCallback(async (story_id) => {
    try {
      console.log('📝 Starting story deletion process...', story_id);

      const response = await APISpells.stories.delete(story_id);
      const result = response;
      console.log('✅ Story deletion result:', result);

      // if (!mountedRef.current) return result;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));

      return result;

    } catch (error) {
      console.error('❌ Story deletion error:', error);

      if (!mountedRef.current) return;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Story deletion failed'
      }));
      throw error;
    }
  }, []);

  const progressStories = useCallback(async (storyData) => {
    try {
      console.log('📝 Starting story progress process...', storyData);
      const response = await APISpells.stories.modify(storyData);
      const result = response;
      console.log('✅ Story progress result:', result);

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));

      return result;

    } catch (error) {
      console.error('❌ Story progress error:', error);

      if (!mountedRef.current) return;

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Story progress failed'
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      console.log('📝 Starting registration process...');
      
      setAuthState(prev => ({ 
        ...prev, 
        isRegistering: true,
        error: null 
      }));

      const result = await AuthSpells.castRegistrationSpell(userData);
      console.log('✅ Registration result:', result);
      
      // if (!mountedRef.current) return result;

      let newState = {
        isRegistering: false,
        error: null
      };

      // If auto-login after registration
      if (result.autoLogin && result.user) {
        newState = {
          ...newState,
          isAuthenticated: true,
          user: result.user,
          tokenMetadata: result.tokenMetadata,
          needsRefresh: false,
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lastActivity: Date.now()
        };
        
        console.log('✨ Registration with auto-login successful');
      }

      setAuthState(prev => ({ ...prev, ...newState }));
      
      return result;

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (!mountedRef.current) return;

      const errorState = {
        isRegistering: false,
        error: error.message || 'Registration failed'
      };

      setAuthState(prev => ({ ...prev, ...errorState }));
      throw error;
    }
  }, []);

  const logout = useCallback(async (allDevices = false) => {
    try {
      console.log('👋 Starting logout process...');
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoggingOut: true,
        isLoading: true,
        error: null 
      }));

      await AuthSpells.castLogoutSpell(allDevices);
      
      if (!mountedRef.current) return;

      // Clear session timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      const newState = {
        ...createAuthState(),
        isInitialized: true
      };

      setAuthState(newState);
      
      console.log('✨ Logout successful');

    } catch (error) {
      console.error('❌ Logout error:', error);
      
      if (!mountedRef.current) return;

      // Even if logout fails, clear local state
      const newState = {
        ...createAuthState(),
        isInitialized: true,
        error: error.message || 'Logout failed'
      };

      setAuthState(newState);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // =============================================================================
  // INITIALIZATION - SIMPLIFIED
  // =============================================================================

  const initialize = useCallback(async () => {
    if (initializationPromise.current) {
      return await initializationPromise.current;
    }

    initializationPromise.current = (async () => {
      try {
        console.log('🔮 Initializing authentication...');
        
        setAuthState(prev => ({ ...prev, isLoading: true }));

        const currentAuthState = AuthSpells.getAuthState();
        console.log('📋 Current auth state from service:', currentAuthState);
        
        if (!mountedRef.current) return;

        const newState = {
          isLoading: false,
          isInitialized: true,
          isAuthenticated: currentAuthState.isAuthenticated,
          user: currentAuthState.user,
          tokenMetadata: currentAuthState.tokenMetadata,
          needsRefresh: currentAuthState.needsRefresh
        };

        setAuthState(prev => ({ ...prev, ...newState }));
        
        console.log('✨ Authentication initialized:', newState);

      } catch (error) {
        console.error('❌ Initialization error:', error);
        
        if (!mountedRef.current) return;

        const errorState = {
          isLoading: false,
          isInitialized: true,
          error: error.message || 'Initialization failed'
        };

        setAuthState(prev => ({ ...prev, ...errorState }));
      } finally {
        initializationPromise.current = null;
      }
    })();

    return await initializationPromise.current;
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging
  useEffect(() => {
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      // console.log('🔍 Auth state changed:', {
      //   isAuthenticated: authState.isAuthenticated,
      //   isLoading: authState.isLoading,
      //   isInitialized: authState.isInitialized,
      //   user: authState.user || 'none',
      //   error: authState.error
      // });
    }
  }, [authState.isAuthenticated, authState.isLoading, authState.isInitialized, authState.user, authState.error]);

  // =============================================================================
  // COMPUTED VALUES - SIMPLIFIED
  // =============================================================================

  const computedValues = useMemo(() => ({
    // Authentication status
    isAuthenticated: authState.isAuthenticated,
    isGuest: !authState.isAuthenticated,
    
    // Loading states
    isLoading: authState.isLoading || authState.isLoggingIn || authState.isLoggingOut,
    isRegistering: authState.isRegistering,
    isInitialized: authState.isInitialized,
    
    // User information
    user: authState.user,
    hasProfile: !!authState.user,
    
    // Session information
    sessionId: authState.sessionId,
    isSessionActive: !!authState.sessionId && !!authState.lastActivity,
    
    // Token information
    hasValidToken: !!authState.tokenMetadata && !authState.needsRefresh,
    tokenExpiresAt: authState.tokenMetadata?.expiresAt,
    
    // Error state
    hasError: !!authState.error,
    error: authState.error
  }), [authState]);

  // =============================================================================
  // RETURN API - SIMPLIFIED
  // =============================================================================

  return {
    // State
    ...computedValues,
    
    // Actions
    login,
    register,
    logout,
    initialize,
    clearError,
    authState,
    generateBasicStory,
    listStories,
    progressStories,
    deleteStories,
    setAuthState,
    // Raw state (for debugging)
    _rawState: DEV_CONFIG.ENABLE_CONSOLE_LOGS ? authState : undefined
  };
};

// =============================================================================
// HOOK FOR CONSUMING AUTH CONTEXT
// =============================================================================

/**
 * Hook to consume authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  // const context = authState;
  
  // Always call the hook logic - hooks must be called unconditionally
  const fallbackAuth = useAuthLogic();
  
  // Return context if available, otherwise return fallback
  if (!context) {
    console.warn('⚠️ useAuth called outside AuthProvider, using fallback');
    return fallbackAuth;
  }
  // console.log(context)
  // console.log(fallbackAuth.authState);
  return {...context, ...fallbackAuth.authState};
};

// =============================================================================
// EXPORTS
// =============================================================================

export default useAuth;