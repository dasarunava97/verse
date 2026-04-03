/**
 * VERSE Mystical Registration Page
 * Enchanted portal for new storytellers to join the mystical realm
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useMysticalAPI } from '../hooks/useApi.js';
import MysticalInput from '../components/common/Input.jsx';
import MysticalButton from '../components/common/Button.jsx';
import MysticalModal, { AlertModal } from '../components/common/Modal.jsx';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator.jsx';
import UsernameAvailabilityChecker from '../components/auth/UsernameAvailabilityChecker.jsx';
import { ValidationSpells, PerformanceSpells, DeviceSpells } from '../utils/helpers.js';
import { UI_CONFIG, ROUTES, ICONS, VALIDATION_RULES } from '../utils/constants.js';
import './Register.css';

// =============================================================================
// MYSTICAL REGISTRATION COMPONENT
// =============================================================================

const MysticalRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    register, 
    isAuthenticated, 
    isLoading: authLoading,
    isRegistering, // Add this to track registration specifically
    error: authError,
    clearError,
    authState
  } = useAuth();

  // =============================================================================
  // COMPONENT STATE
  // =============================================================================

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToMarketing: false,
    profileType: 'writer' // writer, reader, both
  });

  const [formState, setFormState] = useState({
    isSubmitting: false,
    showPassword: false,
    showConfirmPassword: false,
    hasAttemptedSubmit: false,
    errors: {},
    validationTouched: {},
    isFormValid: false,
    currentStep: 1,
    totalSteps: 3
  });

  const [registrationFlow, setRegistrationFlow] = useState({
    isComplete: false,
    requiresVerification: false,
    autoLogin: false,
    successMessage: '',
    userProfileCreated: false
  });

  const [uiState, setUiState] = useState({
    showSuccessModal: false,
    showTermsModal: false,
    showPrivacyModal: false,
    focusedField: null,
    deviceType: 'laptop',
    isCheckingUsername: false,
    usernameAvailable: null
  });

  // =============================================================================
  // PROFILE TYPE CONFIGURATION
  // =============================================================================

  const profileTypes = useMemo(() => [
    {
      id: 'writer',
      title: 'Mystical Writer',
      description: 'Craft enchanted stories and weave magical tales',
      icon: ICONS.QUILL,
      features: ['Create unlimited stories', 'Advanced writing tools', 'Publishing options', 'Community feedback']
    },
    {
      id: 'reader',
      title: 'Story Seeker',
      description: 'Discover and enjoy mystical narratives',
      icon: ICONS.BOOK_OPEN,
      features: ['Access vast library', 'Personalized recommendations', 'Reading analytics', 'Author following']
    },
    {
      id: 'both',
      title: 'Mystical Scholar',
      description: 'Both create and consume magical stories',
      icon: ICONS.MAGIC_WAND,
      features: ['Full writer privileges', 'Complete reader access', 'Community leadership', 'Exclusive content']
    }
  ], []);

  // =============================================================================
  // USERNAME AVAILABILITY API
  // =============================================================================

  const {
    execute: checkUsernameAvailability,
    loading: isCheckingUsernameAPI,
    data: usernameCheckResult
  } = useMysticalAPI(
    (username) => fetch('/api/auth/check-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).then(res => res.json()),
    {
      debounceMs: 500,
      resetOnCall: true,
      onSuccess: (result) => {
        setUiState(prev => ({
          ...prev,
          usernameAvailable: result.available
        }));
      },
      onError: () => {
        setUiState(prev => ({
          ...prev,
          usernameAvailable: null
        }));
      }
    }
  );

  // =============================================================================
  // VALIDATION LOGIC
  // =============================================================================

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          return 'First name is required to begin your mystical journey';
        }
        if (value.length < 2) {
          return 'First name must be at least 2 characters';
        }
        if (!/^[a-zA-Z\s'-]+$/.test(value)) {
          return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        }
        return null;

      case 'lastName':
        if (!value.trim()) {
          return 'Last name is required to complete your mystical identity';
        }
        if (value.length < 2) {
          return 'Last name must be at least 2 characters';
        }
        if (!/^[a-zA-Z\s'-]+$/.test(value)) {
          return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        }
        return null;

      case 'username':
        if (!value.trim()) {
          return 'Username is required for your mystical identity';
        }
        if (value.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
          return `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`;
        }
        if (value.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
          return `Username must be no more than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return 'Username can only contain letters, numbers, underscores, and hyphens';
        }
        if (/^[0-9]/.test(value)) {
          return 'Username cannot start with a number';
        }
        if (uiState.usernameAvailable === false) {
          return 'This mystical username is already taken';
        }
        return null;

      case 'email':
        if (!value.trim()) {
          return 'Email is required to receive mystical communications';
        }
        const emailValidation = ValidationSpells.isValidEmail(value);
        if (!emailValidation.isValid) {
          return emailValidation.message;
        }
        return null;

      case 'password':
        const passwordValidation = ValidationSpells.validatePasswordStrength(value);
        if (!passwordValidation.isValid) {
          return passwordValidation.message;
        }
        return null;

      case 'confirmPassword':
        if (!value) {
          return 'Please confirm your mystical password';
        }
        if (value !== formData.password) {
          return 'Password confirmation does not match';
        }
        return null;

      case 'agreeToTerms':
        if (!value) {
          return 'You must agree to the Terms of Service to join the mystical realm';
        }
        return null;

      default:
        return null;
    }
  }, [formData.password, uiState.usernameAvailable]);

  const validateStep = useCallback((step) => {
    const errors = {};
    let isValid = true;

    const stepFields = {
      1: ['firstName', 'lastName', 'profileType'],
      2: ['username', 'email'],
      3: ['password', 'confirmPassword', 'agreeToTerms']
    };

    const fieldsToValidate = stepFields[step] || [];

    fieldsToValidate.forEach(field => {
      if (field === 'profileType') {
        if (!formData.profileType) {
          errors[field] = 'Please select your mystical profile type';
          isValid = false;
        }
      } else {
        const error = validateField(field, formData[field]);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      }
    });

    return { isValid, errors };
  }, [formData, validateField]);

  const validateForm = useCallback(() => {
    const allStepsValid = [];
    const allErrors = {};

    for (let step = 1; step <= formState.totalSteps; step++) {
      const { isValid, errors } = validateStep(step);
      allStepsValid.push(isValid);
      Object.assign(allErrors, errors);
    }

    const isFormValid = allStepsValid.every(Boolean);

    setFormState(prev => ({
      ...prev,
      errors: allErrors,
      isFormValid
    }));

    return isFormValid;
  }, [formState.totalSteps, validateStep]);

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

    // Mark field as touched for validation
    setFormState(prev => ({
      ...prev,
      validationTouched: {
        ...prev.validationTouched,
        [name]: true
      }
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

    // Special handling for username availability check
    if (name === 'username' && value.trim().length >= VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      setUiState(prev => ({ ...prev, isCheckingUsername: true }));
      checkUsernameAvailability(value.trim());
    }
  }, [formState.errors, authError, clearError, checkUsernameAvailability]);

  const handleProfileTypeSelect = useCallback((profileType) => {
    setFormData(prev => ({
      ...prev,
      profileType
    }));

    // Clear profile type error
    if (formState.errors.profileType) {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          profileType: null
        }
      }));
    }
  }, [formState.errors.profileType]);

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

    // Validate field on blur if it has been touched
    if (formState.validationTouched[fieldName]) {
      const validation = validateStep(formState.currentStep);
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          ...validation.errors
        }
      }));
    }
  }, [formState.validationTouched, formState.currentStep, validateStep]);

  const handleStepNavigation = useCallback((direction) => {
    const newStep = formState.currentStep + direction;
    
    if (direction > 0) {
      // Moving forward - validate current step
      const validation = validateStep(formState.currentStep);
      if (!validation.isValid) {
        setFormState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            ...validation.errors
          },
          hasAttemptedSubmit: true
        }));
        return;
      }
    }

    if (newStep >= 1 && newStep <= formState.totalSteps) {
      setFormState(prev => ({
        ...prev,
        currentStep: newStep,
        errors: direction < 0 ? {} : prev.errors // Clear errors when going back
      }));
    }
  }, [formState.currentStep, formState.totalSteps, validateStep]);

  const handleSubmit = useCallback(async (e) => {
  e.preventDefault();

  setFormState(prev => ({
    ...prev,
    hasAttemptedSubmit: true,
    isSubmitting: true,
    errors: {}
  }));

  // Final form validation
  if (!validateForm()) {
    setFormState(prev => ({
      ...prev,
      isSubmitting: false
    }));
    return;
  }

  // Check username availability one more time
  if (uiState.usernameAvailable === false) {
    setFormState(prev => ({
      ...prev,
      isSubmitting: false,
      errors: {
        username: 'This mystical username is already taken'
      }
    }));
    return;
  }

  try {
    const registrationData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      agreeToTerms: formData.agreeToTerms,
      marketingOptIn: formData.agreeToMarketing,
      profileType: formData.profileType
    };

    const result = await register(registrationData);
    console.log('Registration result:', result);

    // Always stop local submitting state
    setFormState(prev => ({
      ...prev,
      isSubmitting: false
    }));

    if(!result || !result.success) {
      setFormState(prev => ({
        ...prev,
        errors: {
          general: result?.message || 'Registration failed. Please try again.'
        }
      }));
      return;
    }

    setRegistrationFlow({
      isComplete: true,
      requiresVerification: result.requiresVerification || false,
      autoLogin: result.autoLogin || false,
      successMessage: result.message || 'Welcome to the mystical realm!',
      userProfileCreated: true
    });

    if (result.autoLogin && result.user) {
      // Navigate to dashboard after auto-login
      setTimeout(() => {
        const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;
        navigate(redirectTo, { replace: true });
      }, 2000);
    } else {
      // Show success modal for email verification
      setUiState(prev => ({
        ...prev,
        showSuccessModal: true
      }));
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    setFormState(prev => ({
      ...prev,
      isSubmitting: false,
      errors: {
        general: error.message || 'Registration failed. Please try again.'
      }
    }));
  }
}, [formData, register, navigate, location.state, validateForm, uiState.usernameAvailable]);

  const togglePasswordVisibility = useCallback((field) => {
    setFormState(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated || authState.isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Real-time form validation for current step
  useEffect(() => {
    if (formState.hasAttemptedSubmit) {
      const debounced = PerformanceSpells.castDebounce(() => {
        validateStep(formState.currentStep);
      }, 300);
      debounced();
    }
  }, [formData, formState.hasAttemptedSubmit, formState.currentStep, validateStep]);

  // Update username checking state
  useEffect(() => {
    setUiState(prev => ({
      ...prev,
      isCheckingUsername: isCheckingUsernameAPI
    }));
  }, [isCheckingUsernameAPI]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const computedValues = useMemo(() => {
  const isLoading = authLoading || formState.isSubmitting || isRegistering;
  const hasError = Object.keys(formState.errors).length > 0 || !!authError;
  const canProceed = !isLoading;
  const isLastStep = formState.currentStep === formState.totalSteps;
  const isFirstStep = formState.currentStep === 1;

  return {
    isLoading,
    hasError,
    canProceed,
    isLastStep,
    isFirstStep,
    isMobile: uiState.deviceType === 'mobile',
    showPasswordStrength: uiState.focusedField === 'password',
    stepProgress: (formState.currentStep / formState.totalSteps) * 100
  };
}, [
  authLoading,
  formState.isSubmitting,
  isRegistering, // Add this dependency
  formState.errors,
  authError,
  formState.currentStep,
  formState.totalSteps,
  uiState.deviceType,
  uiState.focusedField
]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderStepIndicator = () => (
    <div className="verse-register-progress">
      <div className="verse-progress-bar">
        <div 
          className="verse-progress-fill"
          style={{ width: `${computedValues.stepProgress}%` }}
        />
      </div>
      <div className="verse-progress-steps">
        {Array.from({ length: formState.totalSteps }, (_, index) => (
          <div
            key={index + 1}
            className={`verse-progress-step ${
              index + 1 <= formState.currentStep ? 'active' : ''
            } ${index + 1 < formState.currentStep ? 'completed' : ''}`}
          >
            <span className="verse-step-number">
              {index + 1 < formState.currentStep ? ICONS.CHECK : index + 1}
            </span>
            <span className="verse-step-label">
              {index === 0 && 'Identity'}
              {index === 1 && 'Credentials'}
              {index === 2 && 'Preferences'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfileTypeSelection = () => (
    <div className="verse-profile-types">
      <h3>Choose Your Mystical Path</h3>
      <p>Select the type of storyteller you wish to become in the VERSE realm</p>
      
      <div className="verse-profile-grid">
        {profileTypes.map((type) => (
          <div
            key={type.id}
            className={`verse-profile-card ${
              formData.profileType === type.id ? 'selected' : ''
            }`}
            onClick={() => handleProfileTypeSelect(type.id)}
          >
            <div className="verse-profile-icon">
              {type.icon}
            </div>
            <h4>{type.title}</h4>
            <p>{type.description}</p>
            <ul className="verse-profile-features">
              {type.features.map((feature, index) => (
                <li key={index}>
                  <span className="verse-feature-icon">{ICONS.CHECK}</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="verse-profile-selector">
              <div className="verse-radio-custom">
                {formData.profileType === type.id && (
                  <span className="verse-radio-dot" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {formState.errors.profileType && (
        <div className="verse-field-error">
          <span className="verse-error-icon">{ICONS.ERROR}</span>
          {formState.errors.profileType}
        </div>
      )}
    </div>
  );

  const renderFormError = () => {
    const error = formState.errors.general || authError;
    if (!error) return null;

    return (
      <div className="verse-register-error">
        <span className="verse-error-icon">{ICONS.ERROR}</span>
        <span className="verse-error-message">{error}</span>
      </div>
    );
  };

  const renderSuccessState = () => {
    if (!registrationFlow.isComplete) return null;

    return (
      <div className="verse-register-success">
        <div className="verse-success-animation">
          <span className="verse-success-icon">{ICONS.MAGIC_SPARKLE}</span>
        </div>
        
        <h2>Welcome to the Mystical Realm!</h2>
        <p>{registrationFlow.successMessage}</p>
        
        {registrationFlow.requiresVerification && (
          <div className="verse-verification-notice">
            <span className="verse-notice-icon">{ICONS.MAIL}</span>
            <div>
              <h4>Email Verification Required</h4>
              <p>We've sent a verification link to your email. Please check your inbox and click the link to activate your account.</p>
            </div>
          </div>
        )}
        
        {registrationFlow.autoLogin && (
          <div className="verse-auto-login-notice">
            <span className="verse-notice-icon">{ICONS.LOADING}</span>
            <p>Taking you to your mystical dashboard...</p>
          </div>
        )}
        
        <div className="verse-success-actions">
          {!registrationFlow.autoLogin && (
            <MysticalButton
              variant="primary"
              size="lg"
              onClick={() => navigate(ROUTES.LOGIN)}
              leftIcon={ICONS.WAND}
            >
              Continue to Login
            </MysticalButton>
          )}
        </div>
      </div>
    );
  };

  // =============================================================================
  // STEP CONTENT RENDERERS
  // =============================================================================

  const renderStep1 = () => (
    <div className="verse-register-step">
      <div className="verse-step-header">
        <h2>Your Mystical Identity</h2>
        <p>Tell us about yourself to begin your storytelling journey</p>
      </div>
      
      <div className="verse-register-fields">
        <div className="verse-name-fields">
          <MysticalInput
            name="firstName"
            type="text"
            label="First Name"
            placeholder="Your given name"
            value={formData.firstName}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus('firstName')}
            onBlur={() => handleInputBlur('firstName')}
            error={formState.errors.firstName}
            disabled={computedValues.isLoading}
            leftIcon={ICONS.USER}
            size={computedValues.isMobile ? 'lg' : 'md'}
            variant="mystical"
            autoComplete="given-name"
            autoFocus
            required
          />
          
          <MysticalInput
            name="lastName"
            type="text"
            label="Last Name"
            placeholder="Your family name"
            value={formData.lastName}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus('lastName')}
            onBlur={() => handleInputBlur('lastName')}
            error={formState.errors.lastName}
            disabled={computedValues.isLoading}
            leftIcon={ICONS.USER}
            size={computedValues.isMobile ? 'lg' : 'md'}
            variant="mystical"
            autoComplete="family-name"
            required
          />
        </div>
        
        {renderProfileTypeSelection()}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="verse-register-step">
      <div className="verse-step-header">
        <h2>Your Mystical Credentials</h2>
        <p>Choose your unique identifier and contact information</p>
      </div>
      
      <div className="verse-register-fields">
        <UsernameAvailabilityChecker
          username={formData.username}
          isChecking={uiState.isCheckingUsername}
          isAvailable={uiState.usernameAvailable}
          error={formState.errors.username}
          onUsernameChange={(username) => {
            setFormData(prev => ({ ...prev, username }));
            // if (username.trim().length >= VALIDATION_RULES.USERNAME.MIN_LENGTH) {
            //   checkUsernameAvailability(username.trim());
            // }
          }}
          onFocus={() => handleInputFocus('username')}
          onBlur={() => handleInputBlur('username')}
          disabled={computedValues.isLoading}
          size={computedValues.isMobile ? 'lg' : 'md'}
          required
        />
        
        <MysticalInput
          name="email"
          type="email"
          label="Email Address"
          placeholder="Your Email ID"
          value={formData.email}
          onChange={handleInputChange}
          onFocus={() => handleInputFocus('email')}
          onBlur={() => handleInputBlur('email')}
          error={formState.errors.email}
          disabled={computedValues.isLoading}
          leftIcon={ICONS.MAIL}
          size={computedValues.isMobile ? 'lg' : 'md'}
          variant="mystical"
          autoComplete="email"
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="verse-register-step">
      <div className="verse-step-header">
        <h2>Secure Your Mystical Powers</h2>
        <p>Create a strong password to protect your storytelling realm</p>
      </div>
      
      <div className="verse-register-fields">
        <div className="verse-password-field">
          <MysticalInput
            name="password"
            type={formState.showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus('password')}
            onBlur={() => handleInputBlur('password')}
            error={formState.errors.password}
            disabled={computedValues.isLoading}
            leftIcon={ICONS.LOCK}
            rightIcon={
              <button
                type="button"
                className="verse-password-toggle"
                onClick={() => togglePasswordVisibility('showPassword')}
                aria-label={formState.showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {formState.showPassword ? ICONS.EYE_OFF : ICONS.EYE}
              </button>
            }
            size={computedValues.isMobile ? 'lg' : 'md'}
            variant="mystical"
            autoComplete="new-password"
            required
          />
          
          {computedValues.showPasswordStrength && (
            <PasswordStrengthIndicator 
              password={formData.password}
              className="verse-password-strength"
            />
          )}
        </div>
        
        <MysticalInput
          name="confirmPassword"
          type={formState.showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          placeholder="Confirm your Password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          onFocus={() => handleInputFocus('confirmPassword')}
          onBlur={() => handleInputBlur('confirmPassword')}
          error={formState.errors.confirmPassword}
          disabled={computedValues.isLoading}
          leftIcon={ICONS.LOCK}
          rightIcon={
            <button
              type="button"
              className="verse-password-toggle"
              onClick={() => togglePasswordVisibility('showConfirmPassword')}
              aria-label={formState.showConfirmPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {formState.showConfirmPassword ? ICONS.EYE_OFF : ICONS.EYE}
            </button>
          }
          size={computedValues.isMobile ? 'lg' : 'md'}
          variant="mystical"
          autoComplete="new-password"
          required
        />
        
        <div className="verse-register-agreements">
          <label className="verse-agreement">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              disabled={computedValues.isLoading}
              required
            />
            <span className="verse-checkbox-custom"></span>
            <span className="verse-agreement-text">
              I agree to the{' '}
              <button
                type="button"
                className="verse-link-button"
                onClick={() => setUiState(prev => ({ ...prev, showTermsModal: true }))}
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                className="verse-link-button"
                onClick={() => setUiState(prev => ({ ...prev, showPrivacyModal: true }))}
              >
                Privacy Policy
              </button>
            </span>
          </label>
          
          {formState.errors.agreeToTerms && (
            <div className="verse-field-error">
              <span className="verse-error-icon">{ICONS.ERROR}</span>
              {formState.errors.agreeToTerms}
            </div>
          )}
          
          <label className="verse-agreement">
            <input
              type="checkbox"
              name="agreeToMarketing"
              checked={formData.agreeToMarketing}
              onChange={handleInputChange}
              disabled={computedValues.isLoading}
            />
            <span className="verse-checkbox-custom"></span>
            <span className="verse-agreement-text">
              I would like to receive mystical updates and storytelling inspiration via email
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (registrationFlow.isComplete) {
    return (
      <div className="verse-register-page">
        <div className="verse-register-container">
          {renderSuccessState()}
        </div>
      </div>
    );
  }

  return (
    <div className="verse-register-page">
      <div className="verse-register-container">
        <div className="verse-register-backdrop">
          <div className="verse-register-orb verse-register-orb-1"></div>
          <div className="verse-register-orb verse-register-orb-2"></div>
          <div className="verse-register-orb verse-register-orb-3"></div>
        </div>

        <div className="verse-register-card">
          <div className="verse-register-header">
            <div className="verse-register-logo">
              <span className="verse-logo-icon">{ICONS.MYSTICAL_BOOK}</span>
              <h1 className="verse-logo-text">VERSE</h1>
            </div>
            
            <div className="verse-register-title">
              <h2>Join the Mystical Realm</h2>
              <p>Begin your journey as a storyteller and discover infinite possibilities</p>
            </div>
          </div>

          {renderStepIndicator()}

          <form className="verse-register-form" onSubmit={handleSubmit} noValidate>
            {renderFormError()}

            {formState.currentStep === 1 && renderStep1()}
            {formState.currentStep === 2 && renderStep2()}
            {formState.currentStep === 3 && renderStep3()}

            <div className="verse-register-navigation">
              {!computedValues.isFirstStep && (
                <MysticalButton
                  type="button"
                  variant="secondary"
                  size={computedValues.isMobile ? 'lg' : 'md'}
                  onClick={() => handleStepNavigation(-1)}
                  disabled={computedValues.isLoading}
                  leftIcon={ICONS.ARROW_LEFT}
                >
                  Previous
                </MysticalButton>
              )}
              
              <div className="verse-nav-spacer" />
              
              {computedValues.isLastStep ? (
                <MysticalButton
                  type="submit"
                  variant="primary"
                  size={computedValues.isMobile ? 'lg' : 'md'}
                  loading={computedValues.isLoading}
                  disabled={!computedValues.canProceed || !formData.agreeToTerms}
                  leftIcon={computedValues.isLoading ? ICONS.LOADING : ICONS.MAGIC_WAND}
                >
                  {computedValues.isLoading ? 'Creating Your Realm...' : 'Join the Mystical Realm'}
                </MysticalButton>
              ) : (
                <MysticalButton
                  type="button"
                  variant="primary"
                  size={computedValues.isMobile ? 'lg' : 'md'}
                  onClick={() => handleStepNavigation(1)}
                  disabled={computedValues.isLoading}
                  rightIcon={ICONS.ARROW_RIGHT}
                >
                  Continue
                </MysticalButton>
              )}
            </div>
          </form>

          <div className="verse-register-login">
            <p>Already have a mystical account?</p>
            <Link 
              to={ROUTES.LOGIN} 
              className="verse-login-link"
              state={{ from: location.state?.from }}
            >
              Enter Your Realm
            </Link>
          </div>
        </div>

        <div className="verse-register-footer">
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

      {/* Terms Modal */}
      <MysticalModal
        isOpen={uiState.showTermsModal}
        onClose={() => setUiState(prev => ({ ...prev, showTermsModal: false }))}
        title="Terms of Service"
        subtitle="Guidelines for using the VERSE mystical realm"
        size="large"
        variant="mystical"
      >
        <div className="verse-terms-content">
          <p>By joining VERSE, you agree to create respectful and inspiring content...</p>
          {/* Terms content would be loaded here */}
        </div>
      </MysticalModal>

      {/* Privacy Modal */}
      <MysticalModal
        isOpen={uiState.showPrivacyModal}
        onClose={() => setUiState(prev => ({ ...prev, showPrivacyModal: false }))}
        title="Privacy Policy"
        subtitle="How we protect and use your mystical information"
        size="large"
        variant="mystical"
      >
        <div className="verse-privacy-content">
          <p>Your privacy is sacred to us. We protect your information...</p>
          {/* Privacy content would be loaded here */}
        </div>
      </MysticalModal>
    </div>
  );
};

export default MysticalRegister;