/**
 * VERSE Mystical Input Component
 * Enchanted form inputs with magical interactions and validation
 */

import React, { forwardRef, useState, useCallback } from 'react';
import './Input.css';

/**
 * Mystical Input Component
 * @param {object} props - Component properties
 * @param {string} props.variant - Input variant ('default', 'enchanted', 'mystical', 'ethereal')
 * @param {string} props.size - Input size ('sm', 'md', 'lg')
 * @param {string} props.type - Input type
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Input value
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.required - Required field
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.readOnly - Read only state
 * @param {React.ReactNode} props.leftIcon - Icon on the left
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 * @param {boolean} props.fullWidth - Full width input
 * @param {boolean} props.autoFocus - Auto focus on mount
 * @param {number} props.maxLength - Maximum character length
 * @param {function} props.onChange - Change handler
 * @param {function} props.onFocus - Focus handler
 * @param {function} props.onBlur - Blur handler
 * @param {string} props.className - Additional CSS classes
 */
const MysticalInput = forwardRef(({
  variant = 'default',
  size = 'md',
  type = 'text',
  label = '',
  placeholder = '',
  value = '',
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  readOnly = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  autoFocus = false,
  maxLength = null,
  onChange,
  onFocus,
  onBlur,
  className = '',
  id,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  const inputId = id || `verse-input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    'verse-input-container',
    `verse-input-${variant}`,
    `verse-input-${size}`,
    focused && 'verse-input-focused',
    hasValue && 'verse-input-has-value',
    error && 'verse-input-error',
    disabled && 'verse-input-disabled',
    readOnly && 'verse-input-readonly',
    fullWidth && 'verse-input-full-width',
    leftIcon && 'verse-input-has-left-icon',
    rightIcon && 'verse-input-has-right-icon',
    className
  ].filter(Boolean).join(' ');

  const handleFocus = useCallback((event) => {
    setFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = useCallback((event) => {
    setFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const handleChange = useCallback((event) => {
    const newValue = event.target.value;
    setHasValue(Boolean(newValue));
    onChange?.(event);
  }, [onChange]);

  const renderCharacterCount = () => {
    if (!maxLength) return null;
    
    const currentLength = value ? value.length : 0;
    const isNearLimit = currentLength > maxLength * 0.8;
    const isOverLimit = currentLength > maxLength;
    
    return (
      <div className={`verse-input-char-count ${isNearLimit ? 'verse-input-char-count-warning' : ''} ${isOverLimit ? 'verse-input-char-count-error' : ''}`}>
        {currentLength}/{maxLength}
      </div>
    );
  };

  const renderFloatingLabel = () => {
    if (!label) return null;
    
    return (
      <label 
        htmlFor={inputId} 
        className="verse-input-label"
      >
        {label}
        {required && <span className="verse-input-required">*</span>}
      </label>
    );
  };

  return (
    <div className={containerClasses}>
      <div className="verse-input-field-container">
        {leftIcon && (
          <div className="verse-input-icon verse-input-icon-left">
            {leftIcon}
          </div>
        )}
        
        <div className="verse-input-field-wrapper">
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            maxLength={maxLength}
            className="verse-input-field"
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {renderFloatingLabel()}
          
          <div className="verse-input-border-glow"></div>
          <div className="verse-input-focus-indicator"></div>
        </div>
        
        {rightIcon && (
          <div className="verse-input-icon verse-input-icon-right">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText || maxLength) && (
        <div className="verse-input-footer">
          <div className="verse-input-messages">
            {error && (
              <div className="verse-input-error-message">
                <span className="verse-input-error-icon">⚠</span>
                {error}
              </div>
            )}
            {!error && helperText && (
              <div className="verse-input-helper-text">
                {helperText}
              </div>
            )}
          </div>
          {renderCharacterCount()}
        </div>
      )}
    </div>
  );
});

MysticalInput.displayName = 'MysticalInput';

export default MysticalInput;

// Export convenience components for different input types
export const TextInput = (props) => <MysticalInput type="text" {...props} />;
export const EmailInput = (props) => <MysticalInput type="email" {...props} />;
export const PasswordInput = (props) => <MysticalInput type="password" {...props} />;
export const NumberInput = (props) => <MysticalInput type="number" {...props} />;
export const SearchInput = (props) => <MysticalInput type="search" {...props} />;
export const TelInput = (props) => <MysticalInput type="tel" {...props} />;
export const UrlInput = (props) => <MysticalInput type="url" {...props} />;

// Export themed variants
export const EnchantedInput = (props) => <MysticalInput variant="enchanted" {...props} />;
export const EtherealInput = (props) => <MysticalInput variant="ethereal" {...props} />;
export const MysticalInputField = (props) => <MysticalInput variant="mystical" {...props} />;