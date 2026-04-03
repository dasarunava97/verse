/**
 * Constants and configuration for VERSE Frontend
 * Mystical Enchantment Theme
 */

// =============================================================================
// API Configuration
// =============================================================================

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
  },
  
  // Stories
  STORIES: {
    LIST: '/api/v1/stories/list',
    GET_USER_STORY: '/api/v1/stories/details',
    CREATE: '/api/v1/stories/create',
    DETAILS: (id) => `/api/v1/stories/${id}`,
    DELETE: `/api/v1/stories/details`,
    FAVORITE: (id) => `/api/v1/stories/${id}/favorite`,
    UNFAVORITE: (id) => `/api/v1/stories/${id}/unfavorite`,
    CURRENT_SCENE: (id) => `/api/v1/stories/${id}/current-scene`,
    SUMMARY: (id) => `/api/v1/stories/${id}/summary`,
  },

  PROGRESS: {
    GET_USER_PROGRESS: '/api/v1/progress/user/progress',
    GET_USER_STATS: '/api/v1/progress/user/stats'
  },
  
  // Choices
  CHOICES: {
    GENERATE: '/api/v1/choices/generate',
    MAKE_CHOICE: (storyId) => `/api/v1/choices/make-choice?story_id=${storyId}`,
    HISTORY: '/api/v1/choices/history',
    ANALYTICS: '/api/v1/choices/analytics',
  },
  
  // Generation (for future expansion)
  GENERATE: {
    STORY_IDEA: '/api/v1/generate/story-idea',
    QUICK_STORY: '/api/v1/generate/quick-story',
    STATS: '/api/v1/generate/stats',
    STORY_OUTLINE: '/api/v1/generate/story-outline',
    CHAPTER: '/api/v1/generate/chapter',
    CHARACTERS: '/api/v1/generate/characters'
  },
  
  // Health & Status
  HEALTH: '/health',
  STATUS: '/api/v1/status',
};

// =============================================================================
// Mystical Enchantment Theme Colors
// =============================================================================

export const THEME_COLORS = {
  // Primary Colors
  PRIMARY: {
    50: '#F3F1FF',   // Lightest purple
    100: '#E9E5FF',  // Very light purple
    200: '#D6CCFF',  // Light purple
    300: '#B8A6FF',  // Medium light purple
    400: '#9B7DFF',  // Medium purple
    500: '#7C3AED',  // Main purple
    600: '#6B46C1',  // Dark purple
    700: '#553C9A',  // Darker purple
    800: '#44337A',  // Very dark purple
    900: '#372B69',  // Darkest purple
  },
  
  // Secondary Colors (Mystical Teal)
  SECONDARY: {
    50: '#F0FDFA',   // Lightest teal
    100: '#CCFBF1',  // Very light teal
    200: '#99F6E4',  // Light teal
    300: '#5EEAD4',  // Medium light teal
    400: '#2DD4BF',  // Medium teal
    500: '#14B8A6',  // Main teal
    600: '#0D9488',  // Dark teal
    700: '#0F766E',  // Darker teal
    800: '#115E59',  // Very dark teal
    900: '#134E4A',  // Darkest teal
  },
  
  // Accent Colors (Golden Amber)
  ACCENT: {
    50: '#FFFBEB',   // Lightest amber
    100: '#FEF3C7',  // Very light amber
    200: '#FDE68A',  // Light amber
    300: '#FCD34D',  // Medium light amber
    400: '#FBBF24',  // Medium amber
    500: '#F59E0B',  // Main amber
    600: '#D97706',  // Dark amber
    700: '#B45309',  // Darker amber
    800: '#92400E',  // Very dark amber
    900: '#78350F',  // Darkest amber
  },
  
  // Background Colors
  BACKGROUND: {
    PRIMARY: '#0F172A',    // Deep slate
    SECONDARY: '#1E293B',  // Charcoal
    TERTIARY: '#334155',   // Lighter charcoal
    CARD: '#1E293B',       // Card background
    MODAL: '#0F172A',      // Modal background
  },
  
  // Text Colors
  TEXT: {
    PRIMARY: '#F8FAFC',    // Silver white
    SECONDARY: '#CBD5E1',  // Soft gray
    MUTED: '#94A3B8',      // Muted gray
    ACCENT: '#F59E0B',     // Golden accent text
    SUCCESS: '#10B981',    // Success green
    ERROR: '#EF4444',      // Error red
    WARNING: '#F59E0B',    // Warning amber
  },
  
  // Border Colors
  BORDER: {
    DEFAULT: '#334155',    // Default border
    LIGHT: '#475569',      // Light border
    DARK: '#1E293B',       // Dark border
    ACCENT: '#7C3AED',     // Accent border
  },
  
  // Gradient Definitions
  GRADIENTS: {
    PRIMARY: 'linear-gradient(135deg, #7C3AED 0%, #14B8A6 100%)',
    SECONDARY: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    HERO: 'linear-gradient(135deg, #6B46C1 0%, #14B8A6 50%, #F59E0B 100%)',
    CARD: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
    BUTTON: 'linear-gradient(135deg, #7C3AED 0%, #6B46C1 100%)',
  },
};

// =============================================================================
// Story Configuration
// =============================================================================

export const STORY_CONFIG = {
  SUPPORTED_GENRES: [
    { value: 'fantasy', label: 'Fantasy', emoji: '🧙‍♂️' },
    { value: 'sci-fi', label: 'Science Fiction', emoji: '🚀' },
    { value: 'mystery', label: 'Mystery', emoji: '🔍' },
    { value: 'romance', label: 'Romance', emoji: '💕' },
    { value: 'horror', label: 'Horror', emoji: '👻' },
    { value: 'adventure', label: 'Adventure', emoji: '⚔️' },
    { value: 'drama', label: 'Drama', emoji: '🎭' },
    { value: 'comedy', label: 'Comedy', emoji: '😄' },
    { value: 'thriller', label: 'Thriller', emoji: '⚡' },
    { value: 'historical', label: 'Historical', emoji: '🏛️' },
  ],
  
  STORY_LENGTHS: [
    { value: 'short', label: 'Short (15-30 min)', scenes: '3-5' },
    { value: 'medium', label: 'Medium (30-60 min)', scenes: '6-12' },
    { value: 'long', label: 'Long (1-2 hours)', scenes: '13-20' },
  ],
  
  STORY_TONES: [
    { value: 'light', label: 'Light & Fun', description: 'Cheerful and optimistic' },
    { value: 'balanced', label: 'Balanced', description: 'Mix of emotions' },
    { value: 'dark', label: 'Dark & Serious', description: 'Intense and dramatic' },
    { value: 'mysterious', label: 'Mysterious', description: 'Enigmatic and suspenseful' },
  ],
  
  TARGET_AUDIENCES: [
    { value: 'teen', label: 'Teen (13-17)', description: 'Young adult themes' },
    { value: 'adult', label: 'Adult (18+)', description: 'Mature content' },
    { value: 'family', label: 'Family Friendly', description: 'All ages appropriate' },
  ],
  
  CHOICE_DIFFICULTIES: [
    { value: 'easy', label: 'Easy', description: 'Clear right/wrong choices' },
    { value: 'medium', label: 'Medium', description: 'Balanced trade-offs' },
    { value: 'hard', label: 'Hard', description: 'Complex moral dilemmas' },
  ],
  
  MAX_STORY_LENGTH: 5000,
  MAX_SCENES_PER_STORY: 20,
  DEFAULT_CHOICE_COUNT: 3,
  MAX_CHOICE_COUNT: 6,
};

// =============================================================================
// UI Configuration
// =============================================================================

export const UI_CONFIG = {
  // Animation Durations (milliseconds)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
  },
  
  // Breakpoints for responsive design
  BREAKPOINTS: {
    XS: '320px',
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    XXL: '1536px',
  },
  
  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    NOTIFICATION: 1080,
  },
  
  // Layout dimensions
  LAYOUT: {
    HEADER_HEIGHT: '64px',
    SIDEBAR_WIDTH: '256px',
    SIDEBAR_COLLAPSED_WIDTH: '64px',
    FOOTER_HEIGHT: '48px',
    CONTAINER_MAX_WIDTH: '1200px',
  },
  
  // Form validation
  VALIDATION: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 8,
    STORY_TITLE_MAX_LENGTH: 100,
    SCENE_MAX_LENGTH: 2000,
  },
};

// =============================================================================
// Application States
// =============================================================================

export const APP_STATES = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
  PENDING: 'pending',
};

export const STORY_STATES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
};

export const CHOICE_RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EXTREME: 'extreme',
};

// =============================================================================
// Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'verse_access_token',
  REFRESH_TOKEN: 'verse_refresh_token',
  USER_DATA: 'verse_user_data',
  THEME_PREFERENCE: 'verse_theme_preference',
  STORY_DRAFT: 'verse_story_draft',
  LAST_PLAYED_STORY: 'verse_last_played_story',
  TUTORIAL_COMPLETED: 'verse_tutorial_completed',
};

// =============================================================================
// Error Messages
// =============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  STORY_LOAD_ERROR: 'Failed to load story. Please try again.',
  CHOICE_SUBMIT_ERROR: 'Failed to submit choice. Please try again.',
  SAVE_ERROR: 'Failed to save. Please try again.',
};

// =============================================================================
// Success Messages
// =============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back! You have successfully logged in.',
  REGISTER_SUCCESS: 'Account created successfully! Welcome to VERSE.',
  STORY_CREATED: 'Your story has been created successfully!',
  STORY_SAVED: 'Story saved successfully.',
  CHOICE_SUBMITTED: 'Choice submitted successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
};

// =============================================================================
// Route Paths
// =============================================================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  STORY_CREATE: '/story/create',
  STORY_PLAY: '/story/play/:storyId',
  STORY_EDIT: '/story/edit/:storyId',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
  MY_STORIES: '/stories',
};

// =============================================================================
// Feature Flags (for MVP 0.5)
// =============================================================================

export const FEATURES = {
  AUTHENTICATION: true,
  STORY_CREATION: true,
  STORY_PLAYING: true,
  STORY_SHARING: false,      // MVP 1.0
  CHARACTER_MANAGEMENT: false, // MVP 1.0
  PROGRESS_TRACKING: false,   // MVP 1.0
  AI_GENERATION: false,       // MVP 1.0
  SOCIAL_FEATURES: false,     // MVP 2.0
  REAL_TIME_COLLABORATION: false, // MVP 2.0
};

// =============================================================================
// Magic Numbers and Limits
// =============================================================================

export const LIMITS = {
  MAX_STORIES_PER_USER: 50,
  MAX_ACTIVE_STORIES: 10,
  MAX_CHOICE_LENGTH: 200,
  MAX_SCENE_CONTENT_LENGTH: 3000,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  SESSION_TIMEOUT: 86400000, // 24 hours
  DEBOUNCE_DELAY: 300,       // 300ms
};

// =============================================================================
// Icons and Emojis
// =============================================================================

export const ICONS = {
  STORY: '📖',
  CHOICE: '🔀',
  SAVE: '💾',
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  CREATE: '✨',
  DELETE: '🗑️',
  EDIT: '✏️',
  SETTINGS: '⚙️',
  USER: '👤',
  LOGOUT: '🚪',
  HOME: '🏠',
  MAGIC: '🪄',
  CRYSTAL: '🔮',
  SCROLL: '📜',
  QUILL: '🪶',
  BOOK: '📚',
  STAR: '⭐',
  CROWN: '👑',
  GEM: '💎',
  SUN: '☀️',
  MOON: '🌙',
  AUTO: '🌀',
  BELL: '🔔',
  USERS: '👥',
  COMPASS: '🧭',
  DASHBOARD: '📊',
  BOOKMARK: '🔖',
  INFO: 'ℹ️',
  HELP: '❓',
  CHEVRON_RIGHT: '➡️',
  CHEVRON_LEFT: '⬅️',
  LOADING: '⌛',
  WAND: '🪄',
  WARNING: '⚠️',
};

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULTS = {
  STORY: {
    GENRE: 'fantasy',
    LENGTH: 'medium',
    TONE: 'balanced',
    TARGET_AUDIENCE: 'adult',
    CHOICE_DIFFICULTY: 'medium',
  },
  
  PAGINATION: {
    PAGE_SIZE: 12,
    INITIAL_PAGE: 1,
  },
  
  THEME: {
    MODE: 'dark', // Only dark mode for mystical theme
    ANIMATION_ENABLED: true,
    SOUND_ENABLED: false, // For future audio features
  },
};

// =============================================================================
// Development & Debug
// =============================================================================

export const DEV_CONFIG = {
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG_TOOLS: process.env.NODE_ENV === 'development',
  MOCK_API_DELAY: 1000, // Simulate API delay in development
  ENABLE_MOCK_DATA: false, // Use mock data instead of API
};

export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    FORBIDDEN_START: /^[0-9_-]/,
    RESERVED_WORDS: ['admin', 'verse', 'system', 'api', 'www', 'mail', 'support'],
  },
  
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    MAX_CONSECUTIVE: 3,
    MIN_UNIQUE_CHARS: 4,
  },
  
  EMAIL: {
    PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    MAX_LENGTH: 320,
    BLACKLIST_DOMAINS: ['tempmail.com', '10minutemail.com'],
  },
  
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  
  STORY: {
    TITLE: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
      PATTERN: /^[a-zA-Z0-9\s\-_.,!?'"()]+$/,
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 500,
    },
    CONTENT: {
      MIN_LENGTH: 50,
      MAX_LENGTH: 5000,
    },
    TAG: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 20,
      MAX_COUNT: 10,
      PATTERN: /^[a-zA-Z0-9\-_]+$/,
    },
  },
};

// =============================================================================
// AUTHENTICATION CONFIGURATION
// =============================================================================

export const AUTH_CONFIG = {
  TOKEN_REFRESH_BUFFER: 300000, // 5 minutes before expiry
  MAX_REFRESH_ATTEMPTS: 3,
  SESSION_TIMEOUT: 86400000, // 24 hours
  REMEMBER_ME_DURATION: 604800000, // 7 days
  PASSWORD_RESET_TIMEOUT: 3600000, // 1 hour
  EMAIL_VERIFICATION_TIMEOUT: 86400000, // 24 hours
  LOGIN_RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 900000, // 15 minutes
    LOCKOUT_DURATION: 1800000, // 30 minutes
  },
  REGISTRATION_RATE_LIMIT: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 3600000, // 1 hour
  },
  OAUTH_PROVIDERS: {
    GOOGLE: {
      ENABLED: false,
      CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    },
    DISCORD: {
      ENABLED: false,
      CLIENT_ID: process.env.REACT_APP_DISCORD_CLIENT_ID,
    },
  },
  SECURITY: {
    REQUIRE_EMAIL_VERIFICATION: true,
    REQUIRE_STRONG_PASSWORD: true,
    ENABLE_TWO_FACTOR: false, // Future feature
    ENABLE_LOGIN_NOTIFICATIONS: true,
  },
};

// =============================================================================
// RESPONSIVE BREAKPOINTS (Updated from UI_CONFIG for consistency)
// =============================================================================

export const BREAKPOINTS = {
  mobile: 768,     // Mobile devices
  tablet: 1024,    // Tablet devices  
  desktop: 1280,   // Desktop devices
  wide: 1536,      // Wide screens
  
  // String versions for media queries
  mobileStr: '768px',
  tabletStr: '1024px', 
  desktopStr: '1280px',
  wideStr: '1536px',
};

// =============================================================================
// DIFFICULTY LEVELS CONFIGURATION
// =============================================================================

export const DIFFICULTY_LEVELS = {
  easy: {
    label: 'Apprentice',
    icon: '🌟',
    color: '#10B981',
    description: 'Clear choices with obvious outcomes',
    complexity: 'low',
  },
  medium: {
    label: 'Adept', 
    icon: '⚡',
    color: '#F59E0B',
    description: 'Balanced decisions with meaningful trade-offs',
    complexity: 'medium',
  },
  hard: {
    label: 'Master',
    icon: '🔥',
    color: '#EF4444', 
    description: 'Complex moral dilemmas with far-reaching consequences',
    complexity: 'high',
  },
  mystical: {
    label: 'Mystical Sage',
    icon: '🌌',
    color: '#8B5CF6',
    description: 'Enigmatic choices that shape reality itself',
    complexity: 'extreme',
  },
};

// =============================================================================
// STORY GENRES CONFIGURATION  
// =============================================================================

export const STORY_GENRES = {
  Adventure: {
    label: 'Adventure',
    icon: '⚔️',
    color: '#F59E0B',
    description: 'Epic quests and thrilling journeys',
    tags: ['action', 'exploration', 'quest', 'journey'],
  },
  Fantasy: {
    label: 'Fantasy', 
    icon: '🐉',
    color: '#8B5CF6',
    description: 'Magical realms and mystical creatures',
    tags: ['magic', 'dragons', 'wizards', 'kingdoms'],
  },
  Mystery: {
    label: 'Mystery',
    icon: '🔍', 
    color: '#6366F1',
    description: 'Puzzles to solve and secrets to uncover',
    tags: ['detective', 'clues', 'investigation', 'secrets'],
  },
  Romance: {
    label: 'Romance',
    icon: '💖',
    color: '#EC4899',
    description: 'Tales of love and emotional connections',
    tags: ['love', 'relationships', 'emotion', 'passion'],
  },
  SciFi: {
    label: 'Science Fiction',
    icon: '🚀',
    color: '#06B6D4',
    description: 'Futuristic worlds and advanced technology',
    tags: ['space', 'technology', 'future', 'aliens'],
  },
  Horror: {
    label: 'Horror',
    icon: '👻',
    color: '#EF4444', 
    description: 'Spine-chilling tales of fear and suspense',
    tags: ['scary', 'supernatural', 'thriller', 'dark'],
  },
  Drama: {
    label: 'Drama',
    icon: '🎭',
    color: '#F59E0B',
    description: 'Emotional narratives about human experience',
    tags: ['emotion', 'conflict', 'character', 'life'],
  },
  Comedy: {
    label: 'Comedy',
    icon: '😄',
    color: '#84CC16',
    description: 'Light-hearted tales that bring joy and laughter',
    tags: ['funny', 'humor', 'comedy', 'lighthearted'],
  },
};

// Add these additional missing icons that are used in components
export const ADDITIONAL_ICONS = {
  // Add to existing ICONS object
  ARROW_LEFT: '←',
  ARROW_RIGHT: '→', 
  CHECK: '✓',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⌛',
  HEART: '♡',
  HEART_FILLED: '♥',
  EYE: '👁️',
  EYE_OFF: '🙈',
  LOCK: '🔒',
  MAIL: '✉️',
  MORE_VERTICAL: '⋮',
  SHARE: '📤',
  FLAG: '🚩',
  VERIFIED: '✓',
  CLOCK: '🕐',
  START: '▶️',
  MYSTICAL_BOOK: '📖',
  MAGIC_SPARKLE: '✨',
  MAGIC_WAND: '🪄',
  BOOK_OPEN: '📖',
  WAND: '🪄',
};

// Merge additional icons with existing ones
Object.assign(ICONS, ADDITIONAL_ICONS);

// Export default configuration object
export default {
  API_CONFIG,
  API_ENDPOINTS,
  THEME_COLORS,
  STORY_CONFIG,
  UI_CONFIG,
  APP_STATES,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  FEATURES,
  LIMITS,
  ICONS,
  DEFAULTS,
  DEV_CONFIG,
};

export const STORY_TYPES = {
  interactive: 'Interactive Story',
  linear: 'Linear Narrative',
  branching: 'Branching Adventure'
};
