/**
 * VERSE Mystical Button Component
 * Enchanted buttons with magical interactions and responsive design
 */

import React, { forwardRef } from 'react';
import './Button.css';

/**
 * Mystical Button Component
 * @param {object} props - Component properties
 * @param {string} props.variant - Button variant ('primary', 'secondary', 'accent', 'ghost', 'outline')
 * @param {string} props.size - Button size ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {string} props.shape - Button shape ('rounded', 'pill', 'square', 'circle')
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {string} props.loadingText - Text to show during loading
 * @param {React.ReactNode} props.leftIcon - Icon on the left
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 * @param {boolean} props.fullWidth - Make button full width
 * @param {string} props.href - Make button a link
 * @param {string} props.target - Link target
 * @param {boolean} props.glowing - Enable mystical glow effect
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const MysticalButton = forwardRef(({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  loading = false,
  disabled = false,
  loadingText = 'Casting...',
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  href = null,
  target = null,
  glowing = false,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  const buttonClasses = [
    'verse-button',
    `verse-button-${variant}`,
    `verse-button-${size}`,
    `verse-button-${shape}`,
    loading && 'verse-button-loading',
    disabled && 'verse-button-disabled',
    fullWidth && 'verse-button-full-width',
    glowing && 'verse-button-glowing',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const renderLoadingSpinner = () => (
    <div className="verse-button-spinner">
      <div className="verse-button-spinner-orb"></div>
      <div className="verse-button-spinner-ring"></div>
    </div>
  );

  const renderButtonContent = () => (
    <>
      {loading && renderLoadingSpinner()}
      {!loading && leftIcon && (
        <span className="verse-button-icon verse-button-icon-left">
          {leftIcon}
        </span>
      )}
      <span className={`verse-button-text ${loading ? 'verse-button-text-loading' : ''}`}>
        {loading ? loadingText : children}
      </span>
      {!loading && rightIcon && (
        <span className="verse-button-icon verse-button-icon-right">
          {rightIcon}
        </span>
      )}
      <div className="verse-button-ripple"></div>
      <div className="verse-button-glow-effect"></div>
    </>
  );

  // Render as link if href is provided
  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        target={target}
        className={buttonClasses}
        onClick={handleClick}
        {...props}
      >
        {renderButtonContent()}
      </a>
    );
  }

  // Render as button
  return (
    <button
      ref={ref}
      type="button"
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {renderButtonContent()}
    </button>
  );
});

MysticalButton.displayName = 'MysticalButton';

export default MysticalButton;

// Export convenience components for common button types
export const PrimaryButton = (props) => <MysticalButton variant="primary" {...props} />;
export const SecondaryButton = (props) => <MysticalButton variant="secondary" {...props} />;
export const AccentButton = (props) => <MysticalButton variant="accent" {...props} />;
export const GhostButton = (props) => <MysticalButton variant="ghost" {...props} />;
export const OutlineButton = (props) => <MysticalButton variant="outline" {...props} />;

// Export specialized buttons
export const GlowingButton = (props) => <MysticalButton glowing {...props} />;
export const CircleButton = (props) => <MysticalButton shape="circle" {...props} />;
export const PillButton = (props) => <MysticalButton shape="pill" {...props} />;
export const LoadingButton = (props) => <MysticalButton loading {...props} />;