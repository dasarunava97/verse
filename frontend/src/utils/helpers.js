/**
 * VERSE Frontend Utility Functions
 * Mystical Enchantment Theme Helpers
 */

import { 
  API_CONFIG, 
  STORAGE_KEYS, 
  ERROR_MESSAGES, 
  THEME_COLORS,
  LIMITS,
  DEV_CONFIG 
} from './constants.js';

// =============================================================================
// MYSTICAL STORAGE ENCHANTMENTS
// =============================================================================

/**
 * Enchanted localStorage wrapper with error handling and encryption-like obfuscation
 */
export const MysticalVault = {
  /**
   * Store a value in the mystical vault with obfuscation
   * @param {string} spellKey - The mystical key
   * @param {any} essence - The value to store
   * @returns {boolean} Success status
   */
  storeEssence: (spellKey, essence) => {
    try {
      const enchantedValue = btoa(JSON.stringify({
        data: essence,
        timestamp: Date.now(),
        sigil: `verse_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      localStorage.setItem(spellKey, enchantedValue);
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log(`🔮 Essence stored in vault: ${spellKey}`);
      }
      
      return true;
    } catch (enchantmentError) {
      console.error('💀 Vault enchantment failed:', enchantmentError);
      return false;
    }
  },

  /**
   * Retrieve and decode a value from the mystical vault
   * @param {string} spellKey - The mystical key
   * @param {any} defaultEssence - Default value if not found
   * @returns {any} Retrieved value or default
   */
  retrieveEssence: (spellKey, defaultEssence = null) => {
    try {
      const enchantedValue = localStorage.getItem(spellKey);
      
      if (!enchantedValue) {
        return defaultEssence;
      }
      
      const decodedValue = JSON.parse(atob(enchantedValue));
      
      // Verify the sigil exists (basic integrity check)
      if (!decodedValue.sigil || !decodedValue.sigil.startsWith('verse_')) {
        throw new Error('Corrupted essence detected');
      }
      
      return decodedValue.data;
    } catch (decipherError) {
      console.warn('🌫️ Failed to decipher vault essence:', decipherError);
      return defaultEssence;
    }
  },

  /**
   * Remove essence from the mystical vault
   * @param {string} spellKey - The mystical key
   * @returns {boolean} Success status
   */
  banishEssence: (spellKey) => {
    try {
      localStorage.removeItem(spellKey);
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log(`🗑️ Essence banished from vault: ${spellKey}`);
      }
      
      return true;
    } catch (banishmentError) {
      console.error('💀 Banishment ritual failed:', banishmentError);
      return false;
    }
  },

  /**
   * Clear all VERSE-related essence from vault
   * @returns {boolean} Success status
   */
  purgeVault: () => {
    try {
      const verseKeys = Object.values(STORAGE_KEYS);
      let purgedCount = 0;
      
      verseKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          purgedCount++;
        }
      });
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log(`🧹 Vault purged: ${purgedCount} essences banished`);
      }
      
      return true;
    } catch (purgeError) {
      console.error('💀 Vault purge ritual failed:', purgeError);
      return false;
    }
  }
};

// =============================================================================
// TEMPORAL ENCHANTMENTS (Date/Time Utilities)
// =============================================================================

/**
 * Mystical time formatting utilities
 */
export const TemporalMagic = {
  /**
   * Convert timestamp to mystical readable format
   * @param {number|string|Date} timeEssence - Timestamp
   * @returns {string} Formatted time string
   */
  // Add these functions to the TemporalMagic section (around line 100)

/**
 * Format relative time (alias for formatMysticalTime for backward compatibility)
 * @param {number|string|Date} timeEssence - Timestamp
 * @returns {string} Formatted relative time string
 */
formatRelativeTime: (timeEssence) => {
  return TemporalMagic.formatMysticalTime(timeEssence);
},

/**
 * Format relative time with more granular control
 * @param {number|string|Date} timeEssence - Timestamp
 * @param {object} options - Formatting options
 * @returns {string} Formatted relative time string
 */
formatAdvancedRelativeTime: (timeEssence, options = {}) => {
  try {
    const {
      includeSeconds = false,
      shortForm = false,
      mysticalTerms = true
    } = options;
    
    const temporalMoment = new Date(timeEssence);
    const now = new Date();
    const timeDrift = now - temporalMoment;
    
    const seconds = Math.floor(timeDrift / 1000);
    const minutes = Math.floor(timeDrift / 60000);
    const hours = Math.floor(timeDrift / 3600000);
    const days = Math.floor(timeDrift / 86400000);
    const weeks = Math.floor(timeDrift / 604800000);
    const months = Math.floor(timeDrift / 2629746000);
    const years = Math.floor(timeDrift / 31556952000);
    
    if (mysticalTerms) {
      // Use mystical terminology
      if (years > 0) return shortForm ? `${years}y` : `${years} ${years === 1 ? 'epoch' : 'epochs'} ago`;
      if (months > 0) return shortForm ? `${months}mo` : `${months} ${months === 1 ? 'moon' : 'moons'} ago`;
      if (weeks > 0) return shortForm ? `${weeks}w` : `${weeks} ${weeks === 1 ? 'cycle' : 'cycles'} ago`;
      if (days > 0) return shortForm ? `${days}d` : `${days} ${days === 1 ? 'dawn' : 'dawns'} ago`;
      if (hours > 0) return shortForm ? `${hours}h` : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      if (minutes > 0) return shortForm ? `${minutes}m` : `${minutes} ${minutes === 1 ? 'moment' : 'moments'} ago`;
      
      if (includeSeconds && seconds > 0) {
        return shortForm ? `${seconds}s` : `${seconds} ${seconds === 1 ? 'breath' : 'breaths'} ago`;
      }
    } else {
      // Use standard terminology
      if (years > 0) return shortForm ? `${years}y` : `${years} ${years === 1 ? 'year' : 'years'} ago`;
      if (months > 0) return shortForm ? `${months}mo` : `${months} ${months === 1 ? 'month' : 'months'} ago`;
      if (weeks > 0) return shortForm ? `${weeks}w` : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      if (days > 0) return shortForm ? `${days}d` : `${days} ${days === 1 ? 'day' : 'days'} ago`;
      if (hours > 0) return shortForm ? `${hours}h` : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      if (minutes > 0) return shortForm ? `${minutes}m` : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      
      if (includeSeconds && seconds > 0) {
        return shortForm ? `${seconds}s` : `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
      }
    }
    
    return 'Just now';
  } catch (temporalError) {
    console.warn('⏰ Advanced temporal magic failed:', temporalError);
    return 'Unknown time';
  }
},

// Add these functions to the TextSpells section (around line 200)



/**
 * Truncate text with word boundary respect
 * @param {string} textEssence - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {object} options - Truncation options
 * @returns {string} Truncated text
 */
truncateAtWordBoundary: (textEssence, maxLength = 100, options = {}) => {
  const {
    suffix = '...',
    respectWords = true,
    preserveHTML = false
  } = options;
  
  if (!textEssence || typeof textEssence !== 'string') return '';
  
  // Strip HTML if not preserving it
  let workingText = preserveHTML ? textEssence : textEssence.replace(/<[^>]*>/g, '');
  
  if (workingText.length <= maxLength) return workingText;
  
  if (respectWords) {
    // Find the last space before the cutoff point
    const cutoffPoint = maxLength - suffix.length;
    let truncated = workingText.substring(0, cutoffPoint);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0 && lastSpace > cutoffPoint * 0.8) {
      // If we found a space and it's not too far back, use it
      truncated = truncated.substring(0, lastSpace);
    }
    
    return truncated + suffix;
  } else {
    return workingText.substring(0, maxLength - suffix.length) + suffix;
  }
},

/**
 * Smart text truncation with ellipsis positioning
 * @param {string} textEssence - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} position - Where to place ellipsis ('end', 'middle', 'start')
 * @returns {string} Truncated text
 */
smartTruncate: (textEssence, maxLength = 100, position = 'end') => {
  if (!textEssence || typeof textEssence !== 'string') return '';
  
  if (textEssence.length <= maxLength) return textEssence;
  
  const ellipsis = '...';
  const availableLength = maxLength - ellipsis.length;
  
  switch (position) {
    case 'start':
      return ellipsis + textEssence.substring(textEssence.length - availableLength);
    
    case 'middle':
      const frontLength = Math.ceil(availableLength / 2);
      const backLength = Math.floor(availableLength / 2);
      return textEssence.substring(0, frontLength) + 
             ellipsis + 
             textEssence.substring(textEssence.length - backLength);
    
    case 'end':
    default:
      return textEssence.substring(0, availableLength) + ellipsis;
  }
},

  formatMysticalTime: (timeEssence) => {
    try {
      const temporalMoment = new Date(timeEssence);
      const now = new Date();
      const timeDrift = now - temporalMoment;
      
      const minutes = Math.floor(timeDrift / 60000);
      const hours = Math.floor(timeDrift / 3600000);
      const days = Math.floor(timeDrift / 86400000);
      const weeks = Math.floor(timeDrift / 604800000);
      const months = Math.floor(timeDrift / 2629746000);
      const years = Math.floor(timeDrift / 31556952000);
      
      if (years > 0) return `${years} ${years === 1 ? 'epoch' : 'epochs'} ago`;
      if (months > 0) return `${months} ${months === 1 ? 'moon' : 'moons'} ago`;
      if (weeks > 0) return `${weeks} ${weeks === 1 ? 'cycle' : 'cycles'} ago`;
      if (days > 0) return `${days} ${days === 1 ? 'dawn' : 'dawns'} ago`;
      if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      if (minutes > 0) return `${minutes} ${minutes === 1 ? 'moment' : 'moments'} ago`;
      
      return 'Just now';
    } catch (temporalError) {
      console.warn('⏰ Temporal magic failed:', temporalError);
      return 'Unknown time';
    }
  },

  /**
   * Format duration in mystical terms
   * @param {number} milliseconds - Duration in ms
   * @returns {string} Formatted duration
   */
  formatMysticalDuration: (milliseconds) => {
    try {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    } catch (durationError) {
      console.warn('⏱️ Duration enchantment failed:', durationError);
      return '0s';
    }
  },

  /**
   * Get mystical greeting based on time of day
   * @returns {string} Time-appropriate greeting
   */
  getMysticalGreeting: () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'Good morning, Storyteller';
    if (hour >= 12 && hour < 17) return 'Good afternoon, Wordweaver';
    if (hour >= 17 && hour < 21) return 'Good evening, Tale-spinner';
    return 'Good night, Dream-walker';
  }
};

// =============================================================================
// TEXT ENCHANTMENTS
// =============================================================================

/**
 * Mystical text processing utilities
 */
export const TextSpells = {
  /**
   * Truncate text with mystical ellipsis
   * @param {string} textEssence - Text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} mysticalSuffix - Suffix to append
   * @returns {string} Truncated text
   */
  truncateWithMagic: (textEssence, maxLength = 100, mysticalSuffix = '...✨') => {
    if (!textEssence || typeof textEssence !== 'string') return '';
    
    if (textEssence.length <= maxLength) return textEssence;
    
    return textEssence.substring(0, maxLength - mysticalSuffix.length) + mysticalSuffix;
  },

    /**
   * Truncate text (alias for truncateWithMagic for backward compatibility)
   * @param {string} textEssence - Text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to append
   * @returns {string} Truncated text
   */
  truncateText: (textEssence, maxLength = 100, suffix = '...') => {
    return TextSpells.truncateWithMagic(textEssence, maxLength, suffix);
  },

  /**
   * Capitalize words with mystical flair
   * @param {string} textEssence - Text to capitalize
   * @returns {string} Capitalized text
   */
  enchantCapitalization: (textEssence) => {
    if (!textEssence || typeof textEssence !== 'string') return '';
    
    return textEssence
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Extract initials for mystical avatars
   * @param {string} nameEssence - Full name
   * @returns {string} Initials
   */
  extractMysticalInitials: (nameEssence) => {
    if (!nameEssence || typeof nameEssence !== 'string') return '??';
    
    return nameEssence
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  },

  /**
   * Generate slug from text with mystical naming
   * @param {string} textEssence - Text to slugify
   * @returns {string} URL-safe slug
   */
  forgeSlug: (textEssence) => {
    if (!textEssence || typeof textEssence !== 'string') return '';
    
    return textEssence
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },

  /**
   * Count mystical reading time
   * @param {string} textEssence - Text content
   * @param {number} wordsPerMinute - Reading speed
   * @returns {string} Reading time estimate
   */
  estimateReadingTime: (textEssence, wordsPerMinute = 200) => {
    if (!textEssence || typeof textEssence !== 'string') return '0 min';
    
    const wordCount = textEssence.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
  },

  /**
   * Highlight search terms with mystical glow
   * @param {string} textEssence - Text to search in
   * @param {string} searchSpell - Search term
   * @returns {string} HTML with highlighted terms
   */
  highlightSearchTerms: (textEssence, searchSpell) => {
    if (!textEssence || !searchSpell) return textEssence;
    
    const regex = new RegExp(`(${searchSpell})`, 'gi');
    return textEssence.replace(
      regex, 
      '<span class="verse-text-mystical verse-glow-pulse">$1</span>'
    );
  }
};

// =============================================================================
// VALIDATION ENCHANTMENTS
// =============================================================================

/**
 * Mystical validation utilities
 */
export const ValidationSpells = {
  /**
   * Validate email with mystical accuracy
   * @param {string} emailEssence - Email to validate
   * @returns {boolean} Validation result
   */
  isValidEmail: (emailEssence) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(emailEssence);
  },

  /**
   * Validate password strength with mystical criteria
   * @param {string} passwordEssence - Password to validate
   * @returns {object} Validation result with strength details
   */
  validatePasswordStrength: (passwordEssence) => {
    const validationResult = {
      isValid: false,
      strength: 'weak',
      score: 0,
      feedback: []
    };
    
    if (!passwordEssence) {
      validationResult.feedback.push('Password essence is required');
      return validationResult;
    }
    
    // Length check
    if (passwordEssence.length >= 8) {
      validationResult.score += 2;
    } else {
      validationResult.feedback.push('Password must be at least 8 characters');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(passwordEssence)) {
      validationResult.score += 1;
    } else {
      validationResult.feedback.push('Include at least one uppercase letter');
    }
    
    // Lowercase check
    if (/[a-z]/.test(passwordEssence)) {
      validationResult.score += 1;
    } else {
      validationResult.feedback.push('Include at least one lowercase letter');
    }
    
    // Number check
    if (/\d/.test(passwordEssence)) {
      validationResult.score += 1;
    } else {
      validationResult.feedback.push('Include at least one number');
    }
    
    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordEssence)) {
      validationResult.score += 2;
    } else {
      validationResult.feedback.push('Include at least one special character');
    }
    
    // Determine strength
    if (validationResult.score >= 6) {
      validationResult.strength = 'mystical';
      validationResult.isValid = true;
    } else if (validationResult.score >= 4) {
      validationResult.strength = 'strong';
      validationResult.isValid = true;
    } else if (validationResult.score >= 2) {
      validationResult.strength = 'moderate';
    }
    
    return validationResult;
  },

  /**
   * Validate username with mystical rules
   * @param {string} usernameEssence - Username to validate
   * @returns {object} Validation result
   */
  validateUsername: (usernameEssence) => {
    const result = { isValid: false, feedback: [] };
    
    if (!usernameEssence) {
      result.feedback.push('Username essence is required');
      return result;
    }
    
    if (usernameEssence.length < 3) {
      result.feedback.push('Username must be at least 3 characters');
    }
    
    if (usernameEssence.length > 50) {
      result.feedback.push('Username cannot exceed 50 characters');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(usernameEssence)) {
      result.feedback.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
    
    if (/^[_-]/.test(usernameEssence) || /[_-]$/.test(usernameEssence)) {
      result.feedback.push('Username cannot start or end with special characters');
    }
    
    result.isValid = result.feedback.length === 0;
    return result;
  }
};

// =============================================================================
// NUMBER ENCHANTMENTS
// =============================================================================

/**
 * Mystical number formatting utilities
 */
export const NumberSpells = {
  /**
   * Format numbers with mystical suffixes
   * @param {number} numberEssence - Number to format
   * @returns {string} Formatted number with suffix
   */
  formatMysticalNumber: (numberEssence) => {
    if (numberEssence >= 1000000000) {
      return (numberEssence / 1000000000).toFixed(1) + 'B';
    }
    if (numberEssence >= 1000000) {
      return (numberEssence / 1000000).toFixed(1) + 'M';
    }
    if (numberEssence >= 1000) {
      return (numberEssence / 1000).toFixed(1) + 'K';
    }
    return numberEssence.toString();
  },

  /**
   * Generate random number within mystical range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  generateMysticalRandom: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Calculate percentage with mystical precision
   * @param {number} part - Part value
   * @param {number} whole - Whole value
   * @returns {string} Formatted percentage
   */
  calculateMysticalPercentage: (part, whole) => {
    if (whole === 0) return '0%';
    return Math.round((part / whole) * 100) + '%';
  }
};

// =============================================================================
// URL ENCHANTMENTS
// =============================================================================

/**
 * Mystical URL utilities
 */
export const URLSpells = {
  /**
   * Build API URL with mystical parameters
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {string} Complete URL
   */
  forgeAPIUrl: (endpoint, params = {}) => {
    const baseUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  },

  /**
   * Extract parameters from current URL
   * @returns {object} URL parameters
   */
  extractURLParams: () => {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  },

  /**
   * Build route with parameters
   * @param {string} routePattern - Route pattern with :param placeholders
   * @param {object} params - Parameters to replace
   * @returns {string} Complete route
   */
  forgeRoute: (routePattern, params = {}) => {
    let route = routePattern;
    
    Object.entries(params).forEach(([key, value]) => {
      route = route.replace(`:${key}`, encodeURIComponent(value));
    });
    
    return route;
  }
};

// =============================================================================
// COLOR ENCHANTMENTS
// =============================================================================

/**
 * Mystical color utilities
 */
export const ColorSpells = {
  /**
   * Generate mystical color based on text
   * @param {string} textEssence - Text to generate color from
   * @returns {string} CSS color value
   */
  generateMysticalColor: (textEssence) => {
    if (!textEssence) return THEME_COLORS.PRIMARY[500];
    
    let hash = 0;
    for (let i = 0; i < textEssence.length; i++) {
      hash = textEssence.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % 5;
    const colors = [
      THEME_COLORS.PRIMARY[500],
      THEME_COLORS.SECONDARY[500],
      THEME_COLORS.ACCENT[500],
      THEME_COLORS.PRIMARY[600],
      THEME_COLORS.SECONDARY[600]
    ];
    
    return colors[colorIndex];
  },

  /**
   * Convert hex to RGB with alpha
   * @param {string} hex - Hex color value
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} RGBA color value
   */
  hexToRGBA: (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
};

// =============================================================================
// DEVICE ENCHANTMENTS
// =============================================================================

/**
 * Mystical device detection utilities
 */
export const DeviceSpells = {
  /**
   * Detect if device is mobile
   * @returns {boolean} Is mobile device
   */
  isMobileDevice: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  /**
   * Detect if device supports touch
   * @returns {boolean} Supports touch
   */
  supportsTouchMagic: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Get viewport dimensions
   * @returns {object} Viewport width and height
   */
  getViewportDimensions: () => {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  },

  /**
   * Detect preferred color scheme
   * @returns {string} 'dark' or 'light'
   */
  getPreferredColorScheme: () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
};

// =============================================================================
// PERFORMANCE ENCHANTMENTS
// =============================================================================

/**
 * Mystical performance utilities
 */
export const PerformanceSpells = {
  /**
   * Debounce function with mystical timing
   * @param {function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {function} Debounced function
   */
  castDebounce: (func, delay = LIMITS.DEBOUNCE_DELAY) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * Throttle function with mystical control
   * @param {function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {function} Throttled function
   */
  castThrottle: (func, limit = 100) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Measure function execution time
   * @param {function} func - Function to measure
   * @param {string} label - Label for logging
   * @returns {any} Function result
   */
  measureExecutionTime: (func, label = 'Function') => {
    const startTime = performance.now();
    const result = func();
    const endTime = performance.now();
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log(`⏱️ ${label} execution time: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  }
};

// =============================================================================
// ERROR ENCHANTMENTS
// =============================================================================

/**
 * Mystical error handling utilities
 */
export const ErrorSpells = {
  /**
   * Create standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {object} details - Additional details
   * @returns {object} Standardized error
   */
  forgeError: (message, code = 'UNKNOWN_ERROR', details = {}) => {
    return {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      source: 'VERSE_FRONTEND'
    };
  },

  /**
   * Log error with mystical formatting
   * @param {Error|object} error - Error to log
   * @param {string} context - Error context
   */
  logMysticalError: (error, context = 'Unknown') => {
    const errorInfo = {
      context,
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('🔥 Mystical Error Encountered:', errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (!DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      // sendErrorToService(errorInfo);
    }
  }
};

// =============================================================================
// CLIPBOARD ENCHANTMENTS
// =============================================================================

/**
 * Mystical clipboard utilities
 */
export const ClipboardSpells = {
  /**
   * Copy text to clipboard with mystical feedback
   * @param {string} textEssence - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  copyToMysticalClipboard: async (textEssence) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textEssence);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textEssence;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (clipboardError) {
      console.error('📋 Clipboard enchantment failed:', clipboardError);
      return false;
    }
  }
};



// =============================================================================
// EXPORT MYSTICAL UTILITIES
// =============================================================================

export default {
  MysticalVault,
  TemporalMagic,
  TextSpells,
  ValidationSpells,
  NumberSpells,
  URLSpells,
  ColorSpells,
  DeviceSpells,
  PerformanceSpells,
  ErrorSpells,
  ClipboardSpells
};

export const formatRelativeTime = TemporalMagic.formatRelativeTime;
export const truncateText = TextSpells.truncateText;