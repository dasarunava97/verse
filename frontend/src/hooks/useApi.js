/**
 * VERSE Mystical API Hook
 * Enchanted hook for casting API spells with state management and mystical effects
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { APISpells, APIMonitoring } from '../services/api.js';
import { ErrorSpells, PerformanceSpells, MysticalVault } from '../utils/helpers.js';
import { STORAGE_KEYS, API_CONFIG, DEV_CONFIG } from '../utils/constants.js';

// =============================================================================
// MYSTICAL API STATE MANAGEMENT
// =============================================================================

/**
 * Enhanced API state with mystical properties
 */
const createMysticalAPIState = () => ({
  data: null,
  loading: false,
  error: null,
  success: false,
  spellId: null,
  castTime: null,
  completionTime: null,
  duration: null,
  retryCount: 0,
  isCancelled: false,
  metadata: {
    endpoint: null,
    method: null,
    params: null,
    responseSize: null,
    statusCode: null
  }
});

// =============================================================================
// CORE MYSTICAL API HOOK
// =============================================================================

/**
 * Main mystical API hook for enchanted HTTP requests
 * @param {Function|Object} apiSpell - API function or configuration object
 * @param {Object} options - Hook configuration options
 * @returns {Object} API state and control functions
 */
export const useMysticalAPI = (apiSpell, options = {}) => {
  const {
    immediate = false,
    resetOnCall = true,
    retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
    retryDelay = API_CONFIG.RETRY_DELAY,
    cacheKey = null,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    transformData = null,
    onSuccess = null,
    onError = null,
    onLoading = null,
    onComplete = null,
    debounceMs = 0,
    enablePolling = false,
    pollingInterval = 30000,
    pollingCondition = null,
    cancelOnUnmount = true,
    optimisticUpdates = false,
    refreshDependencies = [],
    errorRetryCondition = null
  } = options;

  // State management
  const [state, setState] = useState(createMysticalAPIState);
  
  // Refs for tracking and cleanup
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const cacheRef = useRef(new Map());
  const lastParamsRef = useRef(null);
  const optimisticDataRef = useRef(null);

  // =============================================================================
  // MYSTICAL CACHE MANAGEMENT
  // =============================================================================

  const getCachedData = useCallback((key) => {
    if (!key || !cacheRef.current.has(key)) return null;
    
    const cached = cacheRef.current.get(key);
    const isExpired = Date.now() - cached.timestamp > cacheTimeout;
    
    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [cacheTimeout]);

  const setCachedData = useCallback((key, data) => {
    if (!key) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (cacheRef.current.size > 50) {
      const entries = Array.from(cacheRef.current.entries());
      const oldestKey = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      cacheRef.current.delete(oldestKey);
    }
  }, []);

  const clearCache = useCallback((pattern) => {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of cacheRef.current.entries()) {
        if (regex.test(key)) {
          cacheRef.current.delete(key);
        }
      }
    } else {
      cacheRef.current.clear();
    }
  }, []);

  // =============================================================================
  // OPTIMISTIC UPDATES
  // =============================================================================

  const applyOptimisticUpdate = useCallback((optimisticData) => {
    if (!optimisticUpdates) return;
    
    optimisticDataRef.current = state.data;
    setState(prev => ({
      ...prev,
      data: typeof optimisticData === 'function' 
        ? optimisticData(prev.data) 
        : optimisticData
    }));
  }, [optimisticUpdates, state.data]);

  const revertOptimisticUpdate = useCallback(() => {
    if (optimisticDataRef.current !== null) {
      setState(prev => ({
        ...prev,
        data: optimisticDataRef.current
      }));
      optimisticDataRef.current = null;
    }
  }, []);

  // =============================================================================
  // CORE SPELL CASTING FUNCTION
  // =============================================================================

  const castSpell = useCallback(async (...args) => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear polling and retry timeouts
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const spellId = `spell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const castTime = Date.now();
    
    // Store current params for comparison
    lastParamsRef.current = args;

    // Check cache first
    const currentCacheKey = cacheKey ? 
      (typeof cacheKey === 'function' ? cacheKey(...args) : `${cacheKey}_${JSON.stringify(args)}`) 
      : null;
    
    const cachedData = getCachedData(currentCacheKey);
    if (cachedData && !resetOnCall) {
      setState(prev => ({
        ...prev,
        data: cachedData,
        loading: false,
        error: null,
        success: true,
        spellId,
        castTime,
        completionTime: Date.now(),
        duration: 0,
        metadata: {
          ...prev.metadata,
          fromCache: true
        }
      }));
      
      onSuccess?.(cachedData, { fromCache: true });
      onComplete?.(cachedData, null, { fromCache: true });
      return cachedData;
    }

    // Reset state if needed
    if (resetOnCall) {
      setState(createMysticalAPIState());
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
      spellId,
      castTime,
      isCancelled: false,
      metadata: {
        endpoint: typeof apiSpell === 'function' ? 'dynamic' : apiSpell.endpoint || 'unknown',
        method: typeof apiSpell === 'function' ? 'unknown' : apiSpell.method || 'GET',
        params: args
      }
    }));

    onLoading?.(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    const attemptSpell = async (attempt = 0) => {
      try {
        let response;
        
        // Determine how to call the API
        if (typeof apiSpell === 'function') {
          response = await apiSpell(...args, {
            signal: abortControllerRef.current.signal
          });
        } else if (typeof apiSpell === 'object') {
          const { method = 'GET', endpoint, data } = apiSpell;
          const apiMethod = APISpells[endpoint] || APISpells.raw[method.toLowerCase()];
          
          if (!apiMethod) {
            throw new Error(`Unknown API method: ${method} or endpoint: ${endpoint}`);
          }
          
          if (method.toUpperCase() === 'GET') {
            response = await apiMethod(endpoint, {
              signal: abortControllerRef.current.signal,
              params: args[0]
            });
          } else {
            response = await apiMethod(endpoint, data || args[0], {
              signal: abortControllerRef.current.signal
            });
          }
        } else {
          throw new Error('apiSpell must be a function or configuration object');
        }

        // Check if component is still mounted
        if (!mountedRef.current) return;

        // Transform data if needed
        const finalData = transformData ? transformData(response.data, response) : response.data;
        
        const completionTime = Date.now();
        const duration = completionTime - castTime;

        // Update state with success
        setState(prev => ({
          ...prev,
          data: finalData,
          loading: false,
          error: null,
          success: true,
          completionTime,
          duration,
          retryCount: attempt,
          metadata: {
            ...prev.metadata,
            responseSize: JSON.stringify(response.data).length,
            statusCode: response.status,
            fromCache: false
          }
        }));

        // Cache the result
        setCachedData(currentCacheKey, finalData);
        
        // Clear optimistic updates
        optimisticDataRef.current = null;

        onLoading?.(false);
        onSuccess?.(finalData, response);
        onComplete?.(finalData, null, response);

        // Start polling if enabled
        if (enablePolling && mountedRef.current) {
          schedulePolling();
        }

        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.log(`✨ Spell ${spellId} completed successfully in ${duration}ms`);
        }

        return finalData;

      } catch (error) {
        if (!mountedRef.current) return;

        // Handle abort/cancellation
        if (error.name === 'AbortError' || error.code === 'SPELL_CANCELLED') {
          setState(prev => ({
            ...prev,
            loading: false,
            isCancelled: true
          }));
          
          onLoading?.(false);
          return;
        }

        // Determine if we should retry
        const shouldRetry = attempt < retryAttempts && 
          (errorRetryCondition ? errorRetryCondition(error, attempt) : 
           (error.status >= 500 || error.name === 'TypeError' || error.status === 408));

        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          
          if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
            console.log(`🔄 Retrying spell ${spellId} (attempt ${attempt + 1}) after ${delay}ms`);
          }

          setState(prev => ({
            ...prev,
            retryCount: attempt + 1
          }));

          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              attemptSpell(attempt + 1);
            }
          }, delay);

          return;
        }

        // Revert optimistic updates on error
        revertOptimisticUpdate();

        const mysticalError = ErrorSpells.forgeError(
          error.message || 'Spell casting failed',
          error.code || 'SPELL_FAILED',
          {
            spellId,
            attempt,
            duration: Date.now() - castTime,
            originalError: error
          }
        );

        setState(prev => ({
          ...prev,
          loading: false,
          error: mysticalError,
          success: false,
          retryCount: attempt
        }));

        onLoading?.(false);
        onError?.(mysticalError, error);
        onComplete?.(null, mysticalError, error);

        ErrorSpells.logMysticalError(mysticalError, `API Hook: ${spellId}`);

        throw mysticalError;
      }
    };

    return await attemptSpell();
  }, [
    apiSpell, 
    resetOnCall, 
    retryAttempts, 
    retryDelay, 
    cacheKey, 
    transformData, 
    onSuccess, 
    onError, 
    onLoading, 
    onComplete,
    getCachedData,
    setCachedData,
    enablePolling,
    errorRetryCondition,
    revertOptimisticUpdate
  ]);

  // =============================================================================
  // DEBOUNCED SPELL CASTING
  // =============================================================================

  const debouncedCastSpell = useMemo(() => {
    if (debounceMs > 0) {
      return PerformanceSpells.castDebounce(castSpell, debounceMs);
    }
    return castSpell;
  }, [castSpell, debounceMs]);

  // =============================================================================
  // POLLING MECHANISM
  // =============================================================================

  const schedulePolling = useCallback(() => {
    if (!enablePolling || !mountedRef.current) return;
    
    pollingTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      // Check polling condition
      if (pollingCondition && !pollingCondition(state)) {
        return;
      }
      
      // Re-cast spell with last parameters
      if (lastParamsRef.current) {
        castSpell(...lastParamsRef.current).catch(() => {
          // Ignore polling errors, but log them
          if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
            console.warn('🔄 Polling request failed, will retry on next interval');
          }
        });
      }
    }, pollingInterval);
  }, [enablePolling, pollingCondition, pollingInterval, castSpell, state]);

  // =============================================================================
  // REFRESH MECHANISM
  // =============================================================================

  const refresh = useCallback(() => {
    if (lastParamsRef.current) {
      return debouncedCastSpell(...lastParamsRef.current);
    }
    return Promise.reject(new Error('No previous parameters to refresh with'));
  }, [debouncedCastSpell]);

  // =============================================================================
  // CANCELLATION
  // =============================================================================

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      loading: false,
      isCancelled: true
    }));

    onLoading?.(false);
  }, [onLoading]);

  // =============================================================================
  // LIFECYCLE EFFECTS
  // =============================================================================

  // Immediate execution
  useEffect(() => {
    if (immediate && typeof apiSpell === 'function') {
      debouncedCastSpell();
    }
  }, [immediate]); // Only run on mount if immediate is true

  // Refresh dependencies
  useEffect(() => {
    if (refreshDependencies.length > 0 && lastParamsRef.current) {
      refresh();
    }
  }, refreshDependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (cancelOnUnmount) {
        cancel();
      }
    };
  }, [cancel, cancelOnUnmount]);

  // =============================================================================
  // RETURN API
  // =============================================================================

  return {
    // Core state
    ...state,
    
    // Action functions
    execute: debouncedCastSpell,
    refresh,
    cancel,
    clearCache,
    
    // Helper functions
    applyOptimisticUpdate,
    revertOptimisticUpdate,
    
    // Computed properties
    isIdle: !state.loading && !state.error && !state.success,
    hasData: state.data !== null,
    canRetry: state.error && state.retryCount < retryAttempts,
    
    // Metadata
    analytics: {
      averageResponseTime: state.duration,
      cacheHitRate: cacheRef.current.size > 0 ? 
        (state.metadata.fromCache ? 100 : 0) : 0,
      retryCount: state.retryCount,
      totalRequests: 1
    }
  };
};

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for GET requests with automatic caching
 */
const useMysticalQuery = (endpoint, params, options = {}) => {
  const queryKey = useMemo(() => 
    `query_${endpoint}_${JSON.stringify(params)}`, 
    [endpoint, params]
  );

  return useMysticalAPI(
    () => APISpells.get(endpoint, { params }),
    {
      immediate: true,
      cacheKey: queryKey,
      cacheTimeout: 10 * 60 * 1000, // 10 minutes
      ...options
    }
  );
};

/**
 * Hook for mutations (POST/PUT/DELETE)
 */
const useMysticalMutation = (mutationFn, options = {}) => {
  return useMysticalAPI(mutationFn, {
    immediate: false,
    resetOnCall: true,
    optimisticUpdates: true,
    ...options
  });
};

/**
 * Hook for file uploads with progress tracking
 */
const useMysticalUpload = (uploadFn, options = {}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const apiHook = useMysticalAPI(uploadFn, {
    ...options,
    onLoading: (loading) => {
      if (!loading) setUploadProgress(0);
      options.onLoading?.(loading);
    }
  });

  const uploadWithProgress = useCallback(async (file, ...args) => {
    setUploadProgress(0);
    
    // Create a wrapper function that tracks progress
    const uploadWithProgressTracking = (file, ...args) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ data: response, status: xhr.status });
            } catch (error) {
              resolve({ data: xhr.responseText, status: xhr.status });
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
        
        xhr.open('POST', uploadFn.endpoint || '/upload');
        xhr.setRequestHeader('Authorization', 
          `Bearer ${MysticalVault.retrieveEssence(STORAGE_KEYS.ACCESS_TOKEN)}`
        );
        xhr.send(formData);
      });
    };
    
    return apiHook.execute(uploadWithProgressTracking, file, ...args);
  }, [apiHook, uploadFn]);

  return {
    ...apiHook,
    uploadProgress,
    upload: uploadWithProgress
  };
};

/**
 * Hook for infinite scrolling/pagination
 */
const useMysticalInfiniteQuery = (endpoint, options = {}) => {
  const {
    limit = 20,
    getNextPageParam = (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : null;
    },
    ...restOptions
  } = options;

  const [pages, setPages] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const apiHook = useMysticalAPI(
    (page = 1) => APISpells.get(endpoint, {
      params: { page, limit, ...options.params }
    }),
    {
      immediate: true,
      ...restOptions,
      onSuccess: (data) => {
        setPages(prev => {
          if (data.page === 1) {
            return [data];
          }
          return [...prev, data];
        });
        
        setHasNextPage(!!getNextPageParam(data, pages));
        setIsFetchingNextPage(false);
        
        restOptions.onSuccess?.(data);
      },
      onError: (error) => {
        setIsFetchingNextPage(false);
        restOptions.onError?.(error);
      }
    }
  );

  const fetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || apiHook.loading) return;
    
    setIsFetchingNextPage(true);
    const nextPage = getNextPageParam(pages[pages.length - 1], pages);
    
    if (nextPage) {
      apiHook.execute(nextPage);
    }
  }, [hasNextPage, isFetchingNextPage, apiHook, pages, getNextPageParam]);

  const flatData = useMemo(() => {
    return pages.reduce((acc, page) => {
      return acc.concat(page.data || page.items || []);
    }, []);
  }, [pages]);

  return {
    ...apiHook,
    data: flatData,
    pages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  };
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for API status monitoring
 */
const useAPIMonitoring = () => {
  const [monitoring, setMonitoring] = useState({
    activeRequests: 0,
    analytics: {},
    isOnline: navigator.onLine
  });

  useEffect(() => {
    const updateMonitoring = () => {
      setMonitoring({
        activeRequests: APIMonitoring.getActiveRequests(),
        analytics: APIMonitoring.getAnalytics(),
        isOnline: navigator.onLine
      });
    };

    const interval = setInterval(updateMonitoring, 1000);
    
    const handleOnline = () => setMonitoring(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setMonitoring(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return monitoring;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default useMysticalAPI;
export {
  useMysticalQuery,
  useMysticalMutation,
  useMysticalUpload,
  useMysticalInfiniteQuery,
  useAPIMonitoring
};