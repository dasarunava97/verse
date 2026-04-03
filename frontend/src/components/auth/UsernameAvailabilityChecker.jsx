/**
 * VERSE Mystical Username Availability Checker
 * Real-time username validation with enchanted feedback
 */

import React, { useMemo } from 'react';
import MysticalInput from '../common/Input.jsx';
import { VALIDATION_RULES, ICONS } from '../../utils/constants.js';
import './UsernameAvailabilityChecker.css';

// =============================================================================
// USERNAME AVAILABILITY CHECKER COMPONENT
// =============================================================================

const MysticalUsernameAvailabilityChecker = ({
  username = '',
  isChecking = false,
  isAvailable = null,
  error = null,
  onUsernameChange,
  onFocus,
  onBlur,
  disabled = false,
  size = 'md',
  required = false,
  className = '',
  ...props
}) => {

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const availabilityState = useMemo(() => {
    if (!username || username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      return {
        status: 'idle',
        message: '',
        icon: ICONS.USER,
        color: 'var(--verse-text-wisdom)'
      };
    }

    if (error) {
      return {
        status: 'error',
        message: error,
        icon: ICONS.ERROR,
        color: 'var(--verse-error-crimson)'
      };
    }

    if (isChecking) {
      return {
        status: 'checking',
        message: 'Consulting the mystical archives...',
        icon: ICONS.LOADING,
        color: 'var(--verse-purple-magic)'
      };
    }

    if (isAvailable === true) {
      return {
        status: 'available',
        message: 'This mystical name is available!',
        icon: ICONS.CHECK,
        color: 'var(--verse-success-emerald)'
      };
    }

    if (isAvailable === false) {
      return {
        status: 'unavailable',
        message: 'This mystical name is already claimed',
        icon: ICONS.ERROR,
        color: 'var(--verse-error-crimson)'
      };
    }

    return {
      status: 'idle',
      message: '',
      icon: ICONS.USER,
      color: 'var(--verse-text-wisdom)'
    };
  }, [username, isChecking, isAvailable, error]);

  const usernameValidation = useMemo(() => {
    if (!username) return { isValid: false, suggestions: [] };

    const suggestions = [];
    let isValid = true;

    // Length validation
    if (username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      isValid = false;
      suggestions.push(`Must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`);
    }

    if (username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      isValid = false;
      suggestions.push(`Must be no more than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`);
    }

    // Pattern validation
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      isValid = false;
      suggestions.push('Only letters, numbers, underscores, and hyphens allowed');
    }

    // Starting character validation
    if (/^[0-9_-]/.test(username)) {
      isValid = false;
      suggestions.push('Must start with a letter');
    }

    // Reserved words check
    if (VALIDATION_RULES.USERNAME.RESERVED_WORDS.some(word => 
      username.toLowerCase().includes(word.toLowerCase())
    )) {
      isValid = false;
      suggestions.push('Contains reserved words');
    }

    return { isValid, suggestions };
  }, [username]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleInputChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    onUsernameChange?.(value);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderAvailabilityIndicator = () => {
    if (availabilityState.status === 'idle') return null;

    return (
      <div className={`verse-username-availability ${availabilityState.status}`}>
        <div className="verse-availability-content">
          <span 
            className="verse-availability-icon"
            style={{ color: availabilityState.color }}
          >
            {availabilityState.icon}
          </span>
          <span 
            className="verse-availability-message"
            style={{ color: availabilityState.color }}
          >
            {availabilityState.message}
          </span>
        </div>

        {availabilityState.status === 'checking' && (
          <div className="verse-checking-animation">
            <div className="verse-mystical-particles">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUsernameSuggestions = () => {
    if (usernameValidation.isValid || usernameValidation.suggestions.length === 0) {
      return null;
    }

    return (
      <div className="verse-username-suggestions">
        <div className="verse-suggestions-header">
          <span className="verse-suggestions-icon">{ICONS.INFO}</span>
          <span className="verse-suggestions-title">Mystical Guidance</span>
        </div>
        <ul className="verse-suggestions-list">
          {usernameValidation.suggestions.map((suggestion, index) => (
            <li key={index} className="verse-suggestion-item">
              <span className="verse-suggestion-bullet">•</span>
              <span className="verse-suggestion-text">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderUsernamePreview = () => {
    if (!username || !usernameValidation.isValid || availabilityState.status !== 'available') {
      return null;
    }

    return (
      <div className="verse-username-preview">
        <div className="verse-preview-header">
          <span className="verse-preview-icon">{ICONS.MAGIC_SPARKLE}</span>
          <span className="verse-preview-title">Your Mystical Identity</span>
        </div>
        <div className="verse-preview-card">
          <div className="verse-preview-avatar">
            <span className="verse-avatar-placeholder">{username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="verse-preview-info">
            <div className="verse-preview-name">@{username}</div>
            <div className="verse-preview-subtitle">Mystical Storyteller</div>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const containerClasses = [
    'verse-username-availability-checker',
    `status-${availabilityState.status}`,
    className
  ].filter(Boolean).join(' ');

  const inputRightIcon = () => {
    if (isChecking) {
      return (
        <div className="verse-username-checking-icon">
          <span className="verse-checking-spinner">{ICONS.LOADING}</span>
        </div>
      );
    }

    if (availabilityState.status === 'available') {
      return (
        <div className="verse-username-success-icon">
          <span style={{ color: availabilityState.color }}>{ICONS.CHECK}</span>
        </div>
      );
    }

    if (availabilityState.status === 'unavailable' || availabilityState.status === 'error') {
      return (
        <div className="verse-username-error-icon">
          <span style={{ color: availabilityState.color }}>{ICONS.ERROR}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={containerClasses}>
      <MysticalInput
        name="username"
        type="text"
        label="Mystical Username"
        placeholder="Choose your unique identifier"
        value={username}
        onChange={handleInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
        error={error}
        disabled={disabled}
        leftIcon={ICONS.USER}
        rightIcon={inputRightIcon()}
        size={size}
        variant="mystical"
        autoComplete="username"
        required={required}
        maxLength={VALIDATION_RULES.USERNAME.MAX_LENGTH}
        {...props}
      />

      {renderAvailabilityIndicator()}
      {renderUsernameSuggestions()}
      {renderUsernamePreview()}
    </div>
  );
};

export default MysticalUsernameAvailabilityChecker;