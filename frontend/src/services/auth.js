/**
 * VERSE Mystical Authentication Service
 * Enchanted authentication spells and token conjuration
 */

import { APISpells } from './api.js';
import { MysticalVault, ErrorSpells, TemporalMagic } from '../utils/helpers.js';
import { STORAGE_KEYS, API_ENDPOINTS, AUTH_CONFIG, DEV_CONFIG } from '../utils/constants.js';

// =============================================================================
// MYSTICAL TOKEN MANAGEMENT
// =============================================================================

/**
 * Enchanted token keeper for mystical authentication artifacts
 */
class MysticalTokenKeeper {
  constructor() {
    this.refreshPromise = null;
    this.refreshTimeoutId = null;
    this.tokenExpirationBuffer = AUTH_CONFIG.TOKEN_REFRESH_BUFFER || 60000; // 1 minute
    this.maxRefreshAttempts = AUTH_CONFIG.MAX_REFRESH_ATTEMPTS || 3;
    this.refreshAttempts = 0;
  }

  /**
   * Store authentication tokens in mystical vault
   * @param {Object} tokenEssence - Token data from authentication
   */
  storeTokens(tokenEssence) {
    const {
      access_token,
      refresh_token,
      expires_in,
      token_type = 'Bearer',
      scope,
      user_data
    } = tokenEssence;

    if (!access_token) {
      throw ErrorSpells.forgeError(
        'Invalid token essence - missing access token',
        'INVALID_TOKEN_ESSENCE'
      );
    }

    const tokenArtifact = {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenType: token_type,
      expiresIn: expires_in,
      scope: scope,
      issuedAt: Date.now(),
      expiresAt: expires_in ? Date.now() + (expires_in * 1000) : null
    };

    // Store tokens with mystical protection
    MysticalVault.storeEssence(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    MysticalVault.storeEssence(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    MysticalVault.storeEssence(STORAGE_KEYS.TOKEN_METADATA, tokenArtifact);
    
    if (user_data) {
      MysticalVault.storeEssence(STORAGE_KEYS.USER_DATA, user_data);
    }

    // Schedule automatic token refresh
    this.scheduleTokenRefresh(tokenArtifact);

    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log('🔐 Mystical tokens stored successfully');
    }

    return tokenArtifact;
  }

  /**
   * Retrieve current access token with validation
   * @returns {string|null} Valid access token or null
   */
  getAccessToken() {
    const token = MysticalVault.retrieveEssence(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (!token) return null;

    const metadata = MysticalVault.retrieveEssence(STORAGE_KEYS.TOKEN_METADATA);
    
    // Check if token is expired
    if (metadata?.expiresAt && Date.now() >= metadata.expiresAt) {
      this.clearTokens();
      return null;
    }

    return token;
  }

  /**
   * Get refresh token from mystical vault
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return MysticalVault.retrieveEssence(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get token metadata with expiration info
   * @returns {Object|null} Token metadata
   */
  getTokenMetadata() {
    return MysticalVault.retrieveEssence(STORAGE_KEYS.TOKEN_METADATA);
  }

  /**
   * Check if token needs refresh
   * @returns {boolean} True if token should be refreshed
   */
  shouldRefreshToken() {
    const metadata = this.getTokenMetadata();
    
    if (!metadata?.expiresAt) return false;
    
    const timeToExpiry = metadata.expiresAt - Date.now();
    return timeToExpiry <= this.tokenExpirationBuffer;
  }

  /**
   * Schedule automatic token refresh
   * @param {Object} tokenArtifact - Token metadata
   */
  scheduleTokenRefresh(tokenArtifact) {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }

    if (!tokenArtifact.expiresAt) return;

    const refreshTime = tokenArtifact.expiresAt - Date.now() - this.tokenExpirationBuffer;
    
    if (refreshTime > 0) {
      this.refreshTimeoutId = setTimeout(() => {
        this.attemptTokenRefresh();
      }, refreshTime);

      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log(`⏰ Token refresh scheduled in ${TemporalMagic.formatMysticalDuration(refreshTime)}`);
      }
    }
  }

  /**
   * Attempt to refresh tokens automatically
   */
  async attemptTokenRefresh() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return;

      await AuthSpells.refreshTokens();
      this.refreshAttempts = 0;
      
      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('🔄 Automatic token refresh successful');
      }
    } catch (error) {
      this.refreshAttempts++;
      
      if (this.refreshAttempts < this.maxRefreshAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, this.refreshAttempts) * 1000;
        setTimeout(() => this.attemptTokenRefresh(), delay);
        
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.warn(`🔄 Token refresh failed, retrying in ${delay}ms (attempt ${this.refreshAttempts})`);
        }
      } else {
        // Max attempts reached, clear tokens and emit event
        this.clearTokens();
        this.emitAuthEvent('auth:token:refresh:failed', { error });
        
        if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
          console.error('💀 Token refresh failed permanently, clearing session');
        }
      }
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    MysticalVault.banishEssence(STORAGE_KEYS.ACCESS_TOKEN);
    MysticalVault.banishEssence(STORAGE_KEYS.REFRESH_TOKEN);
    MysticalVault.banishEssence(STORAGE_KEYS.TOKEN_METADATA);
    MysticalVault.banishEssence(STORAGE_KEYS.USER_DATA);
    
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }

    this.refreshAttempts = 0;
    this.refreshPromise = null;

    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.log('🧹 Mystical tokens cleared');
    }
  }

  /**
   * Emit authentication events
   * @param {string} eventType - Event type
   * @param {Object} detail - Event detail
   */
  emitAuthEvent(eventType, detail = {}) {
    window.dispatchEvent(new CustomEvent(`verse:${eventType}`, {
      detail: {
        timestamp: Date.now(),
        ...detail
      }
    }));
  }
}

// Create singleton token keeper
const tokenKeeper = new MysticalTokenKeeper();

// =============================================================================
// MYSTICAL AUTHENTICATION SPELLS
// =============================================================================

/**
 * Collection of mystical authentication spells
 */
export const AuthSpells = {
  /**
   * Cast login spell with credentials
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Authentication result
   */
  async castLoginSpell(credentials) {
    try {
      const { username, email, password, rememberMe = false } = credentials;
      
      if (!password) {
        throw ErrorSpells.forgeError('Password essence is required', 'MISSING_PASSWORD');
      }

      if (!username && !email) {
        throw ErrorSpells.forgeError('Username or email essence is required', 'MISSING_IDENTIFIER');
      }

      const loginPayload = {
        username: username || email,
        password,
        remember_me: rememberMe,
        client_info: {
          user_agent: navigator.userAgent,
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const response = await APISpells.auth.login(loginPayload);
      
      if (!response.success || !response.data) {
        throw ErrorSpells.forgeError(
          response.message || 'Login spell failed',
          'LOGIN_FAILED'
        );
      }

      const tokenArtifact = tokenKeeper.storeTokens({...response.data,
         user_data: { username: response.data.username, userId: response.data.user_id,
          email: response.data.email, firstName: response.data.first_name, lastName: response.data.last_name,
          fullName: response.data.full_name
         } });
      
      // Store additional user preferences
      if (response.data.user_preferences) {
        MysticalVault.storeEssence(STORAGE_KEYS.USER_PREFERENCES, response.data.user_preferences);
      }

      tokenKeeper.emitAuthEvent('auth:login:success', {
        user: { username: response.data.username, userId: response.data.user_id,
          email: response.data.email, firstName: response.data.first_name, lastName: response.data.last_name,
          fullName: response.data.full_name
         },
        tokenMetadata: tokenArtifact
      });

      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('✨ Login spell cast successfully');
      }

      return {
        success: true,
        user: { username: response.data.username, userId: response.data.user_id,
          email: response.data.email, firstName: response.data.first_name, lastName: response.data.last_name,
          fullName: response.data.full_name
         },
        tokenMetadata: tokenArtifact,
        message: 'Welcome back, Storyteller!'
      };

    } catch (error) {
      tokenKeeper.emitAuthEvent('auth:login:failed', { error });
      ErrorSpells.logMysticalError(error, 'AuthSpells.castLoginSpell');
      throw error;
    }
  },

  /**
   * Cast registration spell for new users
   * @param {Object} userEssence - Registration data
   * @returns {Promise<Object>} Registration result
   */
  async castRegistrationSpell(userEssence) {
    try {
      const {
        username,
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        agreeToTerms = false,
        marketingOptIn = false
      } = userEssence;

      // Validate registration essence
      if (!username || !email || !password) {
        throw ErrorSpells.forgeError(
          'Username, email, and password essences are required',
          'MISSING_REGISTRATION_DATA'
        );
      }

      if (password !== confirmPassword) {
        throw ErrorSpells.forgeError(
          'Password confirmation does not match',
          'PASSWORD_MISMATCH'
        );
      }

      if (!agreeToTerms) {
        throw ErrorSpells.forgeError(
          'Agreement to terms is required to join the mystical realm',
          'TERMS_NOT_ACCEPTED'
        );
      }

      const registrationPayload = {
        username,
        email: email.toLowerCase(),
        password,
        first_name: firstName,
        last_name: lastName,
        marketing_opt_in: marketingOptIn,
        registration_source: 'web_app',
        client_info: {
          user_agent: navigator.userAgent,
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        }
      };

      const response = await APISpells.auth.register(registrationPayload);
      
      if (!response.success) {
        throw ErrorSpells.forgeError(
          response.message || 'Registration spell failed',
          'REGISTRATION_FAILED'
        );
      }

      // If auto-login is enabled, store tokens
      if (response.data.access_token) {
        const tokenArtifact = tokenKeeper.storeTokens(response.data);
        
        tokenKeeper.emitAuthEvent('auth:register:success', {
          user: { username: response.data.username, userId: response.data.user_id,
          email: response.data.email, firstName: response.data.first_name, lastName: response.data.last_name,
          fullName: response.data.full_name
         },
          autoLogin: true
        });

        return {
          success: true,
          user: { username: response.data.username, userId: response.data.user_id,
          email: response.data.email, firstName: response.data.first_name, lastName: response.data.last_name,
          fullName: response.data.full_name
         },
          tokenMetadata: tokenArtifact,
          autoLogin: true,
          message: 'Welcome to the mystical realm of stories!'
        };
      }

      tokenKeeper.emitAuthEvent('auth:register:success', {
        requiresVerification: true
      });

      return {
        success: true,
        requiresVerification: true,
        message: 'Registration successful! Please check your email to verify your account.'
      };

    } catch (error) {
      tokenKeeper.emitAuthEvent('auth:register:failed', { error });
      ErrorSpells.logMysticalError(error, 'AuthSpells.castRegistrationSpell');
      throw error;
    }
  },

  /**
   * Cast logout spell to end session
   * @param {boolean} allDevices - Logout from all devices
   * @returns {Promise<Object>} Logout result
   */
  async castLogoutSpell(allDevices = false) {
    try {
      const refreshToken = tokenKeeper.getRefreshToken();
      
      if (refreshToken) {
        try {
          await APISpells.auth.logout({
            refresh_token: refreshToken,
            all_devices: allDevices
          });
        } catch (error) {
          // Don't fail logout if API call fails
          if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
            console.warn('⚠️ Logout API call failed, but clearing local tokens anyway');
          }
        }
      }

      // Clear local tokens regardless of API response
      tokenKeeper.clearTokens();
      
      tokenKeeper.emitAuthEvent('auth:logout:success', { allDevices });

      if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('👋 Logout spell cast successfully');
      }

      return {
        success: true,
        message: 'Farewell, Storyteller. Your mystical session has ended.'
      };

    } catch (error) {
      // Always clear tokens even if logout fails
      tokenKeeper.clearTokens();
      tokenKeeper.emitAuthEvent('auth:logout:failed', { error });
      ErrorSpells.logMysticalError(error, 'AuthSpells.castLogoutSpell');
      
      return {
        success: true,
        message: 'Session cleared locally'
      };
    }
  },

  /**
   * Refresh authentication tokens
   * @returns {Promise<Object>} New token data
   */
  async refreshTokens() {
    // Prevent multiple simultaneous refresh attempts
    if (tokenKeeper.refreshPromise) {
      return await tokenKeeper.refreshPromise;
    }

    tokenKeeper.refreshPromise = (async () => {
      try {
        const refreshToken = tokenKeeper.getRefreshToken();
        
        if (!refreshToken) {
          throw ErrorSpells.forgeError(
            'No refresh token available',
            'MISSING_REFRESH_TOKEN'
          );
        }

        const response = await APISpells.auth.refreshToken({
          refresh_token: refreshToken
        });

        if (!response.success || !response.data) {
          throw ErrorSpells.forgeError(
            response.message || 'Token refresh failed',
            'TOKEN_REFRESH_FAILED'
          );
        }

        const tokenArtifact = tokenKeeper.storeTokens(response.data);
        
        tokenKeeper.emitAuthEvent('auth:token:refreshed', {
          tokenMetadata: tokenArtifact
        });

        return {
          success: true,
          tokenMetadata: tokenArtifact
        };

      } catch (error) {
        tokenKeeper.clearTokens();
        tokenKeeper.emitAuthEvent('auth:token:refresh:failed', { error });
        throw error;
      } finally {
        tokenKeeper.refreshPromise = null;
      }
    })();

    return await tokenKeeper.refreshPromise;
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentUser() {
    try {
      const cachedUser = MysticalVault.retrieveEssence(STORAGE_KEYS.USER_DATA);
      
      if (cachedUser) {
        // Return cached data immediately, but refresh in background
        this.refreshUserProfile().catch(() => {
          // Ignore background refresh errors
        });
        
        return {
          success: true,
          user: cachedUser,
          fromCache: true
        };
      }

      return await this.refreshUserProfile();

    } catch (error) {
      ErrorSpells.logMysticalError(error, 'AuthSpells.getCurrentUser');
      throw error;
    }
  },

  /**
   * Refresh user profile from server
   * @returns {Promise<Object>} Fresh user profile data
   */
  async refreshUserProfile() {
    try {
      const response = await APISpells.auth.getProfile();
      
      if (!response.success || !response.data) {
        throw ErrorSpells.forgeError(
          'Failed to fetch user profile',
          'PROFILE_FETCH_FAILED'
        );
      }

      // Update cached user data
      MysticalVault.storeEssence(STORAGE_KEYS.USER_DATA, response.data);
      
      tokenKeeper.emitAuthEvent('auth:profile:updated', {
        user: response.data
      });

      return {
        success: true,
        user: response.data,
        fromCache: false
      };

    } catch (error) {
      ErrorSpells.logMysticalError(error, 'AuthSpells.refreshUserProfile');
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} profileUpdates - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileUpdates) {
    try {
      const response = await APISpells.auth.updateProfile(profileUpdates);
      
      if (!response.success) {
        throw ErrorSpells.forgeError(
          response.message || 'Profile update failed',
          'PROFILE_UPDATE_FAILED'
        );
      }

      // Update cached user data
      const currentUser = MysticalVault.retrieveEssence(STORAGE_KEYS.USER_DATA) || {};
      const updatedUser = { ...currentUser, ...response.data };
      MysticalVault.storeEssence(STORAGE_KEYS.USER_DATA, updatedUser);
      
      tokenKeeper.emitAuthEvent('auth:profile:updated', {
        user: updatedUser,
        changes: profileUpdates
      });

      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      ErrorSpells.logMysticalError(error, 'AuthSpells.updateProfile');
      throw error;
    }
  },

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Password change result
   */
  async changePassword(passwordData) {
    try {
      const { currentPassword, newPassword, confirmPassword } = passwordData;
      
      if (!currentPassword || !newPassword) {
        throw ErrorSpells.forgeError(
          'Current and new password are required',
          'MISSING_PASSWORD_DATA'
        );
      }

      if (newPassword !== confirmPassword) {
        throw ErrorSpells.forgeError(
          'New password confirmation does not match',
          'PASSWORD_MISMATCH'
        );
      }

      const response = await APISpells.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      if (!response.success) {
        throw ErrorSpells.forgeError(
          response.message || 'Password change failed',
          'PASSWORD_CHANGE_FAILED'
        );
      }

      // If new tokens are provided, update them
      if (response.data?.access_token) {
        tokenKeeper.storeTokens(response.data);
      }

      tokenKeeper.emitAuthEvent('auth:password:changed');

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      ErrorSpells.logMysticalError(error, 'AuthSpells.changePassword');
      throw error;
    }
  },

  /**
   * Request password reset
   * @param {string} email - Email for password reset
   * @returns {Promise<Object>} Reset request result
   */
  async requestPasswordReset(email) {
    try {
      if (!email) {
        throw ErrorSpells.forgeError(
          'Email is required for password reset',
          'MISSING_EMAIL'
        );
      }

      const response = await APISpells.auth.requestPasswordReset({
        email: email.toLowerCase()
      });

      return {
        success: true,
        message: 'Password reset instructions have been sent to your email'
      };

    } catch (error) {
      ErrorSpells.logMysticalError(error, 'AuthSpells.requestPasswordReset');
      throw error;
    }
  },

  /**
   * Verify email address
   * @param {string} verificationToken - Email verification token
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(verificationToken) {
    try {
      if (!verificationToken) {
        throw ErrorSpells.forgeError(
          'Verification token is required',
          'MISSING_VERIFICATION_TOKEN'
        );
      }

      const response = await APISpells.auth.verifyEmail({
        token: verificationToken
      });

      if (!response.success) {
        throw ErrorSpells.forgeError(
          response.message || 'Email verification failed',
          'EMAIL_VERIFICATION_FAILED'
        );
      }

      tokenKeeper.emitAuthEvent('auth:email:verified');

      return {
        success: true,
        message: 'Email verified successfully'
      };

    } catch (error) {
      ErrorSpells.logMysticalError(error, 'AuthSpells.verifyEmail');
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = tokenKeeper.getAccessToken();
    return !!token;
  },

  /**
   * Get current authentication state
   * @returns {Object} Current auth state
   */
  getAuthState() {
    const token = tokenKeeper.getAccessToken();
    const tokenMetadata = tokenKeeper.getTokenMetadata();
    const userData = MysticalVault.retrieveEssence(STORAGE_KEYS.USER_DATA);
    
    return {
      isAuthenticated: !!token,
      hasValidToken: !!token,
      user: userData,
      tokenMetadata,
      needsRefresh: tokenKeeper.shouldRefreshToken()
    };
  }
};

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Check for existing tokens on service load
if (typeof window !== 'undefined') {
  const existingMetadata = tokenKeeper.getTokenMetadata();
  if (existingMetadata) {
    // Schedule refresh for existing tokens
    tokenKeeper.scheduleTokenRefresh(existingMetadata);
    
    // Check if immediate refresh is needed
    if (tokenKeeper.shouldRefreshToken()) {
      AuthSpells.refreshTokens().catch(() => {
        // Ignore automatic refresh errors on startup
      });
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AuthSpells;
export { tokenKeeper as TokenKeeper };