/**
 * VERSE Mystical API Conjuration Service
 * Enchanted HTTP client with mystical error handling and request/response transformations
 */

import { 
  API_CONFIG, 
  API_ENDPOINTS, 
  STORAGE_KEYS, 
  ERROR_MESSAGES,
  DEV_CONFIG,
  LIMITS 
} from '../utils/constants.js';
import { 
  MysticalVault, 
  ErrorSpells, 
  PerformanceSpells,
  TemporalMagic 
} from '../utils/helpers.js';

// =============================================================================
// MYSTICAL API CONFIGURATION
// =============================================================================

/**
 * Enchanted API client with mystical powers
 */
class MysticalAPIConjurer {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
    
    // Request interceptors chain
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    
    // Mystical request tracking
    this.activeSpells = new Map();
    this.spellCounter = 0;
    
    // Setup default enchantments
    this.initializeMysticalDefaults();
  }

  /**
   * Initialize default mystical configurations
   */
  initializeMysticalDefaults() {
    // Add authentication enchantment
    this.addRequestInterceptor(this.enchantWithAuthentication.bind(this));
    
    // Add request tracking enchantment
    this.addRequestInterceptor(this.enchantWithTracking.bind(this));
    
    // Add response transformation enchantment
    this.addResponseInterceptor(this.enchantResponseTransformation.bind(this));
    
    // Add error handling enchantment
    this.addErrorInterceptor(this.enchantErrorHandling.bind(this));
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log('🔮 Mystical API Conjurer initialized with base URL:', this.baseURL);
    }
  }

  // =============================================================================
  // INTERCEPTOR ENCHANTMENTS
  // =============================================================================

  /**
   * Add request interceptor
   * @param {Function} interceptor - Request interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Response interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   * @param {Function} interceptor - Error interceptor function
   */
  addErrorInterceptor(interceptor) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Enchant request with authentication essence
   * @param {object} config - Request configuration
   * @returns {object} Enhanced configuration
   */
  enchantWithAuthentication(config) {
    const accessToken = MysticalVault.retrieveEssence(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (accessToken && !config.skipAuth) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
        'X-Mystical-Token': `verse_${Date.now()}` // Custom header for tracking
      };
    }
    
    return config;
  }

  /**
   * Enchant request with tracking magic
   * @param {object} config - Request configuration
   * @returns {object} Enhanced configuration
   */
  enchantWithTracking(config) {
    const spellId = `spell_${++this.spellCounter}_${Date.now()}`;
    config.spellId = spellId;
    config.castTime = Date.now();
    
    // Add mystical headers
    config.headers = {
      ...config.headers,
      'X-Spell-Id': spellId,
      'X-Conjurer-Version': '1.0.0',
      'X-Mystical-Timestamp': config.castTime.toString(),
      'Content-Type': config.headers['Content-Type'] || 'application/json'
    };
    
    // Track active spell
    this.activeSpells.set(spellId, {
      url: config.url,
      method: config.method,
      castTime: config.castTime,
      status: 'casting'
    });
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`🪄 Casting spell ${spellId}:`, config.method, config.url);
    }
    
    return config;
  }

  /**
   * Enchant response transformation
   * @param {Response} response - Fetch response
   * @param {object} config - Request configuration
   * @returns {object} Transformed response
   */
  async enchantResponseTransformation(response, config) {
    const spellId = config.spellId;
    const completionTime = Date.now();
    const duration = completionTime - config.castTime;
    
    // Update spell tracking
    if (this.activeSpells.has(spellId)) {
      this.activeSpells.set(spellId, {
        ...this.activeSpells.get(spellId),
        status: response.ok ? 'completed' : 'failed',
        duration,
        statusCode: response.status
      });
    }
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`✨ Spell ${spellId} completed in ${duration}ms with status:`, response.status);
    }
    
    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
    } catch (parseError) {
      console.warn(`🌫️ Failed to parse response for spell ${spellId}:`, parseError);
      data = null;
    }
    
    // Create mystical response object
    const mysticalResponse = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: this.transformHeaders(response.headers),
      config,
      spellId,
      duration,
      timestamp: completionTime,
      success: response.ok,
      enchanted: true // Mark as processed by our system
    };
    
    // Clean up completed spell after delay
    setTimeout(() => {
      this.activeSpells.delete(spellId);
    }, 5000);
    
    return mysticalResponse;
  }

  /**
   * Enchant error handling with mystical recovery
   * @param {Error} error - Request error
   * @param {object} config - Request configuration
   * @returns {Promise} Enhanced error or retry
   */
  async enchantErrorHandling(error, config) {
    const spellId = config.spellId;
    const errorTime = Date.now();
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.error(`💀 Spell ${spellId} encountered error:`, error.message);
    }
    
    // Update spell tracking
    if (this.activeSpells.has(spellId)) {
      this.activeSpells.set(spellId, {
        ...this.activeSpells.get(spellId),
        status: 'failed',
        error: error.message,
        errorTime
      });
    }
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw this.createMysticalError('SPELL_CANCELLED', 'Request was cancelled', config);
    }
    
    // Network error handling
    if (!navigator.onLine) {
      throw this.createMysticalError('NETWORK_OFFLINE', 'No internet connection', config);
    }
    
    // Handle authentication errors
    if (error.status === 401) {
      await this.handleAuthenticationFailure();
      throw this.createMysticalError('AUTHENTICATION_FAILED', ERROR_MESSAGES.UNAUTHORIZED, config);
    }
    
    // Handle forbidden errors
    if (error.status === 403) {
      throw this.createMysticalError('FORBIDDEN_SPELL', ERROR_MESSAGES.FORBIDDEN, config);
    }
    
    // Retry logic for certain errors
    const shouldRetry = this.shouldRetrySpell(error, config);
    if (shouldRetry && config.retryCount < this.retryAttempts) {
      return await this.retrySpell(config);
    }
    
    // Create mystical error object
    throw this.createMysticalError('SPELL_FAILED', error.message || ERROR_MESSAGES.SERVER_ERROR, config);
  }

  // =============================================================================
  // MYSTICAL HTTP METHODS
  // =============================================================================

  /**
   * Cast GET spell
   * @param {string} url - Request URL
   * @param {object} options - Request options
   * @returns {Promise} Response promise
   */
  async castGet(url, data = null, options = {}) {
    return await this.castSpell(url, {
      method: 'GET',
      params: data,
      ...options
    });
  }

  /**
   * Cast POST spell
   * @param {string} url - Request URL
   * @param {any} data - Request data
   * @param {object} options - Request options
   * @returns {Promise} Response promise
   */
  async castPost(url, data = null, options = {}) {
    return await this.castSpell(url, {
      method: 'POST',
      body: data,
      ...options
    });
  }

  /**
   * Cast PUT spell
   * @param {string} url - Request URL
   * @param {any} data - Request data
   * @param {object} options - Request options
   * @returns {Promise} Response promise
   */
  async castPut(url, data = null, options = {}) {
    return await this.castSpell(url, {
      method: 'PUT',
      body: data,
      ...options
    });
  }

  /**
   * Cast DELETE spell
   * @param {string} url - Request URL
   * @param {object} options - Request options
   * @returns {Promise} Response promise
   */
  async castDelete(url, data = null, options = {}) {
    return await this.castSpell(url, {
      method: 'DELETE',
      body: data,
      ...options
    });
  }

  /**
   * Cast PATCH spell
   * @param {string} url - Request URL
   * @param {any} data - Request data
   * @param {object} options - Request options
   * @returns {Promise} Response promise
   */
  async castPatch(url, data = null, options = {}) {
    return await this.castSpell(url, {
      method: 'PATCH',
      body: data,
      ...options
    });
  }

  // =============================================================================
  // CORE SPELL CASTING MECHANISM
  // =============================================================================

  /**
   * Main spell casting method
   * @param {string} url - Request URL
   * @param {object} config - Request configuration
   * @returns {Promise} Enhanced response
   */
  async castSpell(url, config = {}) {
    try {

      // Prepare mystical configuration
      let mysticalConfig = {
        method: 'GET',
        headers: {},
        retryCount: 0,
        url: this.buildFullURL(url),
        ...config
      };

      let params = config.params || null;
      if (params && typeof params === 'object' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          searchParams.append(key, value);
        }
        mysticalConfig.url += `?${searchParams.toString()}`;
      }

      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        mysticalConfig = await interceptor(mysticalConfig);
      }

      // Prepare fetch options
      const fetchOptions = {
        method: mysticalConfig.method,
        headers: mysticalConfig.headers,
        signal: this.createAbortSignal(mysticalConfig.timeout),
      };

      // Handle request body
      if (mysticalConfig.body) {
        if (mysticalConfig.body instanceof FormData) {
          fetchOptions.body = mysticalConfig.body;
          // Remove content-type for FormData - browser will set it
          delete fetchOptions.headers['Content-Type'];
        } else if (typeof mysticalConfig.body === 'object') {
          fetchOptions.body = JSON.stringify(mysticalConfig.body);
        } else {
          fetchOptions.body = mysticalConfig.body;
        }
      }

      // Cast the spell (make the request)
      const response = await fetch(mysticalConfig.url, fetchOptions);

      // Check for HTTP errors
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      // Apply response interceptors
      let mysticalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        mysticalResponse = await interceptor(mysticalResponse, mysticalConfig);
      }

      return mysticalResponse;

    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.errorInterceptors) {
        try {
          return await interceptor(error, config);
        } catch (interceptorError) {
          // Continue to next interceptor if this one fails
          error = interceptorError;
        }
      }
      
      throw error;
    }
  }

  // =============================================================================
  // UTILITY ENCHANTMENTS
  // =============================================================================

  /**
   * Build full URL from relative path
   * @param {string} url - URL or path
   * @returns {string} Full URL
   */
  buildFullURL(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${this.baseURL}/${cleanUrl}`;
  }

  /**
   * Create abort signal for timeout handling
   * @param {number} timeout - Timeout in milliseconds
   * @returns {AbortSignal} Abort signal
   */
  createAbortSignal(timeout = this.timeout) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * Transform headers from Headers object to plain object
   * @param {Headers} headers - Response headers
   * @returns {object} Plain headers object
   */
  transformHeaders(headers) {
    const headerObj = {};
    for (const [key, value] of headers.entries()) {
      headerObj[key] = value;
    }
    return headerObj;
  }

  /**
   * Determine if spell should be retried
   * @param {Error} error - Request error
   * @param {object} config - Request configuration
   * @returns {boolean} Should retry
   */
  shouldRetrySpell(error, config) {
    // Don't retry if explicitly disabled
    if (config.skipRetry) return false;
    
    // Don't retry authentication errors
    if (error.status === 401 || error.status === 403) return false;
    
    // Don't retry client errors (4xx except 408, 429)
    if (error.status >= 400 && error.status < 500 && 
        error.status !== 408 && error.status !== 429) {
      return false;
    }
    
    // Retry server errors (5xx), timeouts, and network errors
    return error.status >= 500 || 
           error.name === 'TimeoutError' || 
           error.name === 'TypeError' ||
           error.status === 408 ||
           error.status === 429;
  }

  /**
   * Retry failed spell with exponential backoff
   * @param {object} config - Request configuration
   * @returns {Promise} Retry response
   */
  async retrySpell(config) {
    const retryDelay = this.retryDelay * Math.pow(2, config.retryCount);
    config.retryCount = (config.retryCount || 0) + 1;
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`🔄 Retrying spell ${config.spellId} (attempt ${config.retryCount}) after ${retryDelay}ms`);
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return await this.castSpell(config.url, config);
  }

  /**
   * Handle authentication failure
   */
  async handleAuthenticationFailure() {
    // Clear stored tokens
    MysticalVault.banishEssence(STORAGE_KEYS.ACCESS_TOKEN);
    MysticalVault.banishEssence(STORAGE_KEYS.REFRESH_TOKEN);
    MysticalVault.banishEssence(STORAGE_KEYS.USER_DATA);
    
    // Dispatch authentication failure event
    window.dispatchEvent(new CustomEvent('verse:auth:failure', {
      detail: { reason: 'Token expired or invalid' }
    }));
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.warn('🔒 Authentication failure handled - tokens cleared');
    }
  }

  /**
   * Create mystical error object
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {object} config - Request configuration
   * @returns {Error} Enhanced error object
   */
  createMysticalError(code, message, config) {
    const error = new Error(message);
    error.code = code;
    error.config = config;
    error.timestamp = new Date().toISOString();
    error.spellId = config.spellId;
    error.isMysticalError = true;
    
    // Log error for monitoring
    ErrorSpells.logMysticalError(error, `API Spell: ${config.method} ${config.url}`);
    
    return error;
  }

  // =============================================================================
  // MYSTICAL MONITORING & ANALYTICS
  // =============================================================================

  /**
   * Get active spells count
   * @returns {number} Number of active requests
   */
  getActiveSpellsCount() {
    return this.activeSpells.size;
  }

  /**
   * Get spell analytics
   * @returns {object} Analytics data
   */
  getSpellAnalytics() {
    const spells = Array.from(this.activeSpells.values());
    const completed = spells.filter(s => s.status === 'completed');
    const failed = spells.filter(s => s.status === 'failed');
    const casting = spells.filter(s => s.status === 'casting');
    
    const avgDuration = completed.length > 0 
      ? completed.reduce((sum, s) => sum + (s.duration || 0), 0) / completed.length 
      : 0;
    
    return {
      totalSpells: this.spellCounter,
      activeSpells: casting.length,
      completedSpells: completed.length,
      failedSpells: failed.length,
      averageDuration: Math.round(avgDuration),
      successRate: this.spellCounter > 0 ? (completed.length / this.spellCounter * 100).toFixed(1) : 0
    };
  }

  /**
   * Clear spell history (for memory management)
   */
  clearSpellHistory() {
    this.activeSpells.clear();
    this.spellCounter = 0;
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log('🧹 Spell history cleared');
    }
  }
}

// =============================================================================
// MYSTICAL API INSTANCE CREATION
// =============================================================================

// Create singleton instance
const mysticalAPI = new MysticalAPIConjurer();

// =============================================================================
// CONVENIENCE SPELL SHORTCUTS
// =============================================================================

/**
 * Enchanted API shortcuts for common operations
 */

/**
 * Handle API errors with mystical enhancement
 * @param {Error} error - Original error
 * @param {string} defaultMessage - Default error message
 * @param {object} context - Additional context
 * @returns {Error} Enhanced error object
 */
export const handleApiError = (error, defaultMessage = 'An error occurred', context = {}) => {
  // Create enhanced error object
  const enhancedError = new Error();
  
  // Determine error message
  if (error?.data?.message) {
    enhancedError.message = error.data.message;
  } else if (error?.message) {
    enhancedError.message = error.message;
  } else if (typeof error === 'string') {
    enhancedError.message = error;
  } else {
    enhancedError.message = defaultMessage;
  }
  
  // Add error details
  enhancedError.code = error?.code || error?.data?.code || 'UNKNOWN_ERROR';
  enhancedError.status = error?.status || error?.response?.status || null;
  enhancedError.statusText = error?.statusText || error?.response?.statusText || null;
  enhancedError.timestamp = new Date().toISOString();
  enhancedError.context = context;
  enhancedError.isHandled = true;
  
  // Add specific error type handling
  if (error?.status) {
    switch (error.status) {
      case 400:
        enhancedError.type = 'VALIDATION_ERROR';
        enhancedError.userMessage = 'Please check your input and try again.';
        break;
      case 401:
        enhancedError.type = 'AUTHENTICATION_ERROR';
        enhancedError.userMessage = 'Please log in to continue.';
        break;
      case 403:
        enhancedError.type = 'AUTHORIZATION_ERROR';
        enhancedError.userMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        enhancedError.type = 'NOT_FOUND_ERROR';
        enhancedError.userMessage = 'The requested resource was not found.';
        break;
      case 422:
        enhancedError.type = 'VALIDATION_ERROR';
        enhancedError.userMessage = 'Invalid data provided.';
        enhancedError.details = error?.data?.details || {};
        break;
      case 429:
        enhancedError.type = 'RATE_LIMIT_ERROR';
        enhancedError.userMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        enhancedError.type = 'SERVER_ERROR';
        enhancedError.userMessage = 'Server error occurred. Please try again later.';
        break;
      case 502:
      case 503:
      case 504:
        enhancedError.type = 'SERVICE_UNAVAILABLE';
        enhancedError.userMessage = 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        enhancedError.type = 'UNKNOWN_ERROR';
        enhancedError.userMessage = 'An unexpected error occurred.';
    }
  } else if (!navigator.onLine) {
    enhancedError.type = 'NETWORK_ERROR';
    enhancedError.userMessage = 'No internet connection. Please check your network and try again.';
  } else {
    enhancedError.type = 'UNKNOWN_ERROR';
    enhancedError.userMessage = 'An unexpected error occurred.';
  }
  
  // Log error for debugging
  if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
    console.error('🔥 API Error:', {
      message: enhancedError.message,
      code: enhancedError.code,
      status: enhancedError.status,
      type: enhancedError.type,
      context: enhancedError.context,
      originalError: error
    });
  }
  
  return enhancedError;
};

/**
 * Generic API call wrapper using the mystical API conjurer
 * @param {object} options - API call options
 * @returns {Promise} API response
 */
export const apiCall = async (options = {}) => {
  try {
    const {
      endpoint,
      method = 'GET',
      data = null,
      params = {},
      headers = {},
      timeout = API_CONFIG.TIMEOUT,
      skipAuth = false,
      skipRetry = false,
      ...otherOptions
    } = options;
    
    // Build URL with query parameters
    let url = endpoint;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      const queryString = searchParams.toString();
      url = queryString ? `${endpoint}?${queryString}` : endpoint;
    }
    
    // Prepare request configuration
    const config = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout,
      skipAuth,
      skipRetry,
      ...otherOptions
    };
    
    // Add body for non-GET requests
    if (data && !['GET', 'HEAD'].includes(config.method)) {
      config.body = data;
    }
    
    // Make the API call using the mystical conjurer
    let response;
    switch (config.method) {
      case 'GET':
        response = await mysticalAPI.castGet(url, config);
        break;
      case 'POST':
        response = await mysticalAPI.castPost(url, config.body, config);
        break;
      case 'PUT':
        response = await mysticalAPI.castPut(url, config.body, config);
        break;
      case 'PATCH':
        response = await mysticalAPI.castPatch(url, config.body, config);
        break;
      case 'DELETE':
        response = await mysticalAPI.castDelete(url, config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${config.method}`);
    }
    
    return response;
    
  } catch (error) {
    throw handleApiError(error, 'API call failed', { options });
  }
};

export const APISpells = {
  // Authentication spells
  auth: {
    login: (credentials) => mysticalAPI.castPost(API_ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData) => mysticalAPI.castPost(API_ENDPOINTS.AUTH.REGISTER, userData),
    logout: () => mysticalAPI.castPost(API_ENDPOINTS.AUTH.LOGOUT),
    refreshToken: () => mysticalAPI.castPost(API_ENDPOINTS.AUTH.REFRESH),
    getProfile: () => mysticalAPI.castGet(API_ENDPOINTS.AUTH.PROFILE),
  },

  // Story spells
  stories: {
    list: (params) => mysticalAPI.castGet(API_ENDPOINTS.STORIES.LIST, params),
    create: (storyData) => mysticalAPI.castPost(API_ENDPOINTS.STORIES.CREATE, storyData),
    modify: (storyData) => mysticalAPI.castPut(API_ENDPOINTS.STORIES.CREATE, storyData),
    get: (id) => mysticalAPI.castGet(API_ENDPOINTS.STORIES.DETAILS(id)),
    delete: (id) => mysticalAPI.castDelete(API_ENDPOINTS.STORIES.DELETE, { story_id: id }),
    getCurrentScene: (id) => mysticalAPI.castGet(API_ENDPOINTS.STORIES.CURRENT_SCENE(id)),
    getSummary: (id) => mysticalAPI.castGet(API_ENDPOINTS.STORIES.SUMMARY(id)),
  },

  // Choice spells
  choices: {
    generate: (sceneData) => mysticalAPI.castPost(API_ENDPOINTS.CHOICES.GENERATE, sceneData),
    makeChoice: (storyId, choiceData) => mysticalAPI.castPost(
      API_ENDPOINTS.CHOICES.MAKE_CHOICE(storyId), 
      choiceData
    ),
    getHistory: (params) => mysticalAPI.castGet(API_ENDPOINTS.CHOICES.HISTORY, { params }),
    getAnalytics: () => mysticalAPI.castGet(API_ENDPOINTS.CHOICES.ANALYTICS),
  },

  // Generation spells (for future expansion)
  generate: {
    storyIdea: (params) => mysticalAPI.castPost(API_ENDPOINTS.GENERATE.STORY_IDEA, params),
    quickStory: (params) => mysticalAPI.castPost(API_ENDPOINTS.GENERATE.QUICK_STORY, params),
    getStats: () => mysticalAPI.castGet(API_ENDPOINTS.GENERATE.STATS),
  },

  // Health check spells
  health: {
    check: () => mysticalAPI.castGet(API_ENDPOINTS.HEALTH, { skipAuth: true }),
    status: () => mysticalAPI.castGet(API_ENDPOINTS.STATUS, { skipAuth: true }),
  }
};

// =============================================================================
// MYSTICAL EVENT LISTENERS
// =============================================================================

// Listen for online/offline events
window.addEventListener('online', () => {
  if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
    console.log('🌐 Connection restored - mystical spells can be cast again');
  }
});

window.addEventListener('offline', () => {
  if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
    console.warn('📡 Connection lost - spells will fail until restored');
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

export default mysticalAPI;
export { MysticalAPIConjurer };

// Export analytics and monitoring functions
export const APIMonitoring = {
  getActiveRequests: () => mysticalAPI.getActiveSpellsCount(),
  getAnalytics: () => mysticalAPI.getSpellAnalytics(),
  clearHistory: () => mysticalAPI.clearSpellHistory(),
};

// Export configuration utilities
export const APIConfig = {
  setBaseURL: (url) => { mysticalAPI.baseURL = url; },
  setTimeout: (timeout) => { mysticalAPI.timeout = timeout; },
  setRetryAttempts: (attempts) => { mysticalAPI.retryAttempts = attempts; },
  addRequestInterceptor: (interceptor) => mysticalAPI.addRequestInterceptor(interceptor),
  addResponseInterceptor: (interceptor) => mysticalAPI.addResponseInterceptor(interceptor),
  addErrorInterceptor: (interceptor) => mysticalAPI.addErrorInterceptor(interceptor),
};