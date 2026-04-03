/**
 * VERSE Mystical Login Page
 * Enchanted authentication portal for storytellers
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useMysticalAPI } from '../hooks/useApi.js';
import MysticalInput from '../components/common/Input.jsx';
import MysticalButton from '../components/common/Button.jsx';
import MysticalModal, { AlertModal } from '../components/common/Modal.jsx';
import { ValidationSpells, PerformanceSpells, DeviceSpells } from '../utils/helpers.js';
import { UI_CONFIG, ROUTES, ICONS, VALIDATION_RULES } from '../utils/constants.js';
import './Login.css';

// =============================================================================
// MYSTICAL LOGIN COMPONENT
// =============================================================================

const MysticalLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    login, 
    isAuthenticated, 
    isLoading: authLoading,
    error: authError,
    clearError,
    authState
  } = useAuth();

  // =============================================================================
  // COMPONENT STATE
  // =============================================================================

  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: '',
    rememberMe: false
  });

  const [formState, setFormState] = useState({
    isSubmitting: false,
    showPassword: false,
    hasAttemptedSubmit: false,
    errors: {},
    successMessage: '',
    isFormValid: false
  });

  const [securityState, setSecurityState] = useState({
    loginAttempts: 0,
    isLocked: false,
    lockoutEndTime: null,
    requiresCaptcha: false,
    captchaToken: null
  });

  const [uiState, setUiState] = useState({
    showForgotPasswordModal: false,
    forgotPasswordEmail: '',
    isSendingReset: false,
    showSuccessModal: false,
    focusedField: null,
    deviceType: 'laptop'
  });

  // =============================================================================
  // PASSWORD RESET API HOOK
  // =============================================================================

  const {
    execute: sendPasswordReset,
    loading: isResetLoading,
    error: resetError,
    success: resetSuccess
  } = useMysticalAPI(
    (email) => fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(res => res.json()),
    {
      resetOnCall: true,
      onSuccess: () => {
        setUiState(prev => ({
          ...prev,
          showForgotPasswordModal: false,
          showSuccessModal: true,
          forgotPasswordEmail: ''
        }));
      }
    }
  );

  // =============================================================================
  // FORM VALIDATION
  // =============================================================================

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'identifier':
        if (!value.trim()) {
          return 'Username or email is required to enter the mystical realm';
        }
        if (value.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
          return `Identifier must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`;
        }
        return null;

      case 'password':
        if (!value) {
          return 'Password is required to unlock your mystical powers';
        }
        if (value.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
          return `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`;
        }
        return null;

      default:
        return null;
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;

    // Validate each field
    Object.keys(formData).forEach(field => {
      if (field !== 'rememberMe') {
        const error = validateField(field, formData[field]);
        if (error) {
          //console.log(`Validation error for ${field}:`, error);
          errors[field] = error;
          isValid = false;
        }
      }
    });

    // Additional cross-field validation
    if (formData.identifier && formData.password) {
      // Check if identifier looks like email for additional validation
      if (formData.identifier.includes('@')) {
        const emailValidation = ValidationSpells.isValidEmail(formData.identifier);
        //console.log('Email Validation:', emailValidation);
        if (!emailValidation) {
          errors.identifier = emailValidation.message;
          isValid = false;
        }
      }
    }
    //console.log('Validation Errors:', errors);

    setFormState(prev => ({
      ...prev,
      errors,
      isFormValid: isValid && !securityState.isLocked
    }));
    console.log('Form is valid:', isValid);

    return isValid;
  }, [formData, validateField, securityState.isLocked]);

  // =============================================================================
  // SECURITY MANAGEMENT
  // =============================================================================

  const checkSecurityLockout = useCallback(() => {
    const now = Date.now();
    
    if (securityState.lockoutEndTime && now < securityState.lockoutEndTime) {
      return true; // Still locked
    }
    
    if (securityState.lockoutEndTime && now >= securityState.lockoutEndTime) {
      // Lockout expired, reset security state
      setSecurityState(prev => ({
        ...prev,
        isLocked: false,
        lockoutEndTime: null,
        loginAttempts: 0,
        requiresCaptcha: false
      }));
      return false;
    }
    
    return securityState.isLocked;
  }, [securityState]);

  const handleLoginFailure = useCallback(() => {
    const attempts = securityState.loginAttempts + 1;
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    
    let newSecurityState = {
      loginAttempts: attempts,
      requiresCaptcha: attempts >= 3
    };

    if (attempts >= maxAttempts) {
      newSecurityState = {
        ...newSecurityState,
        isLocked: true,
        lockoutEndTime: Date.now() + lockoutDuration
      };
    }

    setSecurityState(prev => ({ ...prev, ...newSecurityState }));
  }, [securityState.loginAttempts]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear field error when user starts typing
    if (formState.errors[name]) {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: null
        }
      }));
    }

    // Clear auth error when user modifies form
    if (authError) {
      clearError();
    }
  }, [formState.errors, authError, clearError]);

  const handleInputFocus = useCallback((fieldName) => {
    setUiState(prev => ({
      ...prev,
      focusedField: fieldName
    }));
  }, []);

  const handleInputBlur = useCallback((fieldName) => {
    setUiState(prev => ({
      ...prev,
      focusedField: null
    }));

    // Validate field on blur if form has been submitted
    if (formState.hasAttemptedSubmit) {
      validateForm();
    }
  }, [formState.hasAttemptedSubmit, validateForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.log('Attempting to log in with:');

    // Check security lockout
    // if (checkSecurityLockout()) {
    //   const timeRemaining = securityState.lockoutEndTime - Date.now();
    //   const minutes = Math.ceil(timeRemaining / 60000);
      
    //   setFormState(prev => ({
    //     ...prev,
    //     errors: {
    //       general: `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    //     }
    //   }));
    //   return;
    // }

    setFormState(prev => ({
      ...prev,
      hasAttemptedSubmit: true,
      isSubmitting: true,
      errors: {}
    }));
    console.log('Form Data:', formData);

    // Validate form
    if (!validateForm()) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }));
      return;
    }

    try {
      const loginCredentials = {
        username: formData.identifier.includes('@') ? undefined : formData.identifier,
        email: formData.identifier.includes('@') ? formData.identifier : undefined,
        password: formData.password,
        rememberMe: formData.rememberMe
      };

      console.log('Before login API call with:', loginCredentials);

      await login(loginCredentials);

      // Reset security state on successful login
      setSecurityState({
        loginAttempts: 0,
        isLocked: false,
        lockoutEndTime: null,
        requiresCaptcha: false,
        captchaToken: null
      });

      // Navigate to intended destination or dashboard
      const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(redirectTo, { replace: true });

    } catch (error) {
      console.error('Login error:', error);
      handleLoginFailure();
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: {
          general: error.message || 'Login failed. Please check your credentials and try again.'
        }
      }));
    }
  }, [
    formData, 
    login, 
    navigate, 
    location.state, 
    validateForm, 
    checkSecurityLockout, 
    securityState.lockoutEndTime,
    handleLoginFailure
  ]);

  const handleForgotPassword = useCallback(async () => {
    if (!uiState.forgotPasswordEmail) {
      return;
    }

    const emailValidation = ValidationSpells.isValidEmail(uiState.forgotPasswordEmail);
    if (!emailValidation.isValid) {
      setFormState(prev => ({
        ...prev,
        errors: {
          forgotPassword: emailValidation.message
        }
      }));
      return;
    }

    try {
      await sendPasswordReset(uiState.forgotPasswordEmail);
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        errors: {
          forgotPassword: error.message || 'Failed to send reset email'
        }
      }));
    }
  }, [uiState.forgotPasswordEmail, sendPasswordReset]);

  const togglePasswordVisibility = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Redirect if already authenticated
  useEffect(() => {
    if ((isAuthenticated || authState.isAuthenticated) && authState.user) {
      console.log("Current User:", authState.user);
      const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Real-time form validation
  useEffect(() => {
    if (formState.hasAttemptedSubmit) {
      const debounced = PerformanceSpells.castDebounce(validateForm, 300);
      debounced();
    }
  }, [formData, formState.hasAttemptedSubmit, validateForm]);

  // Security lockout timer
  useEffect(() => {
    if (securityState.lockoutEndTime) {
      const interval = setInterval(() => {
        checkSecurityLockout();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [securityState.lockoutEndTime, checkSecurityLockout]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const computedValues = useMemo(() => {
    const isLoading = authLoading || formState.isSubmitting ||  authState.isLoading ;
    const hasError = Object.keys(formState.errors).length > 0 || !!authError;
    const lockoutTimeRemaining = securityState.lockoutEndTime ? 
      Math.max(0, securityState.lockoutEndTime - Date.now()) : 0;

    return {
      isLoading,
      hasError,
      lockoutTimeRemaining,
      canSubmit: true,
      showPasswordStrength: uiState.focusedField === 'password',
      isMobile: uiState.deviceType === 'mobile'
    };
  }, [
    authLoading,
    formState.isSubmitting,
    formState.isFormValid,
    formState.errors,
    authError,
    securityState.isLocked,
    securityState.lockoutEndTime,
    uiState.focusedField,
    uiState.deviceType
  ]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderSecurityAlert = () => {
    if (!securityState.isLocked && !securityState.requiresCaptcha) return null;

    return (
      <div className="verse-login-security-alert">
        {securityState.isLocked && (
          <div className="verse-security-lockout">
            <span className="verse-security-icon">{ICONS.WARNING}</span>
            <div className="verse-security-message">
              <h4>Account Temporarily Locked</h4>
              <p>
                Too many failed login attempts. Please try again in{' '}
                {Math.ceil(computedValues.lockoutTimeRemaining / 60000)} minute(s).
              </p>
            </div>
          </div>
        )}
        
        {securityState.requiresCaptcha && !securityState.isLocked && (
          <div className="verse-security-captcha">
            <span className="verse-security-icon">{ICONS.SHIELD}</span>
            <p>Additional verification required after multiple attempts</p>
          </div>
        )}
      </div>
    );
  };

  const renderFormError = () => {
    const error = formState.errors.general || authError;
    if (!error) return null;

    return (
      <div className="verse-login-error">
        <span className="verse-error-icon">{ICONS.ERROR}</span>
        <span className="verse-error-message">{error}</span>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="verse-login-page">
      <div className="verse-login-container">
        <div className="verse-login-backdrop">
          <div className="verse-login-orb verse-login-orb-1"></div>
          <div className="verse-login-orb verse-login-orb-2"></div>
          <div className="verse-login-orb verse-login-orb-3"></div>
        </div>

        <div className="verse-login-card">
          <div className="verse-login-header">
            <div className="verse-login-logo">
              <span className="verse-logo-icon">{ICONS.MYSTICAL_BOOK}</span>
              <h1 className="verse-logo-text">VERSE</h1>
            </div>
            
            <div className="verse-login-title">
              <h2>Enter the Mystical Realm</h2>
              <p>Unlock your storytelling powers and join the enchanted world of infinite tales</p>
            </div>
          </div>

          <form className="verse-login-form" onSubmit={handleSubmit} noValidate>
            {renderSecurityAlert()}
            {renderFormError()}

            <div className="verse-login-fields">
              <MysticalInput
                name="identifier"
                type="text"
                label="Username or Email"
                placeholder="Enter your Username or Email"
                value={formData.identifier}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('identifier')}
                onBlur={() => handleInputBlur('identifier')}
                error={formState.errors.identifier}
                disabled={computedValues.isLoading || securityState.isLocked ||  authState.isLoading }
                leftIcon={ICONS.USER}
                size={computedValues.isMobile ? 'lg' : 'md'}
                variant="mystical"
                autoComplete="username"
                autoFocus
                required
              />

              <MysticalInput
                name="password"
                type={formState.showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your Password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('password')}
                onBlur={() => handleInputBlur('password')}
                error={formState.errors.password}
                disabled={computedValues.isLoading || securityState.isLocked || authState.isLoading }
                leftIcon={ICONS.LOCK}
                rightIcon={
                  <button
                    type="button"
                    className="verse-password-toggle"
                    onClick={togglePasswordVisibility}
                    aria-label={formState.showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {formState.showPassword ? ICONS.EYE_OFF : ICONS.EYE}
                  </button>
                }
                size={computedValues.isMobile ? 'lg' : 'md'}
                variant="mystical"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="verse-login-options">
              <label className="verse-remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={computedValues.isLoading || securityState.isLocked}
                />
                <span className="verse-checkbox-custom"></span>
                <span className="verse-checkbox-label">Remember me</span>
              </label>

              <button
                type="button"
                className="verse-forgot-password"
                onClick={() => setUiState(prev => ({ ...prev, showForgotPasswordModal: true }))}
                disabled={computedValues.isLoading || securityState.isLocked}
              >
                Forgotten your password?
              </button>
            </div>

            <MysticalButton
              type="submit"
              variant="primary"
              size={computedValues.isMobile ? 'lg' : 'md'}
              fullWidth
              loading={computedValues.isLoading}
              disabled={!computedValues.canSubmit}
              leftIcon={computedValues.isLoading ? ICONS.LOADING : ICONS.WAND}
            >
              {computedValues.isLoading ? 'Casting Login Spell...' : 'Enter the Realm'}
            </MysticalButton>

            <div className="verse-login-divider">
              <span>or</span>
            </div>

            <div className="verse-login-signup">
              <p>New to the mystical realm?</p>
              <Link 
                to={ROUTES.REGISTER} 
                className="verse-signup-link"
                state={{ from: location.state?.from }}
              >
                Begin Your Journey
              </Link>
            </div>
          </form>
        </div>

        <div className="verse-login-footer">
          <div className="verse-footer-links">
            <Link to={ROUTES.PRIVACY} className="verse-footer-link">Privacy Policy</Link>
            <Link to={ROUTES.TERMS} className="verse-footer-link">Terms of Service</Link>
            <Link to={ROUTES.HELP} className="verse-footer-link">Help Center</Link>
          </div>
          
          <p className="verse-footer-copyright">
            © 2024 VERSE. Crafting mystical stories since the dawn of imagination.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <MysticalModal
        isOpen={uiState.showForgotPasswordModal}
        onClose={() => setUiState(prev => ({ 
          ...prev, 
          showForgotPasswordModal: false,
          forgotPasswordEmail: ''
        }))}
        title="Reset Your Mystical Password"
        subtitle="Enter your email to receive password reset instructions"
        size="small"
        variant="mystical"
      >
        <div className="verse-forgot-password-modal">
          <MysticalInput
            type="email"
            label="Email Address"
            placeholder="Enter your mystical email"
            value={uiState.forgotPasswordEmail}
            onChange={(e) => setUiState(prev => ({ 
              ...prev, 
              forgotPasswordEmail: e.target.value 
            }))}
            error={formState.errors.forgotPassword}
            leftIcon={ICONS.MAIL}
            autoFocus
            required
          />
          
          <div className="verse-modal-actions">
            <MysticalButton
              variant="secondary"
              onClick={() => setUiState(prev => ({ 
                ...prev, 
                showForgotPasswordModal: false,
                forgotPasswordEmail: ''
              }))}
              disabled={isResetLoading}
            >
              Cancel
            </MysticalButton>
            
            <MysticalButton
              variant="primary"
              onClick={handleForgotPassword}
              loading={isResetLoading}
              disabled={!uiState.forgotPasswordEmail || isResetLoading}
            >
              Send Reset Link
            </MysticalButton>
          </div>
        </div>
      </MysticalModal>

      {/* Success Modal */}
      <AlertModal
        isOpen={uiState.showSuccessModal}
        onClose={() => setUiState(prev => ({ ...prev, showSuccessModal: false }))}
        title="Reset Link Sent"
        message="Check your email for password reset instructions. The link will expire in 1 hour."
        variant="success"
        icon={ICONS.SUCCESS}
      />
    </div>
  );
};

export default MysticalLogin;