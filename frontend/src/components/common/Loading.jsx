/**
 * VERSE Mystical Loading Component
 * Enchanted spinner with mystical animations and responsive design
 */

import React from 'react';
import './Loading.css';

/**
 * Mystical Loading Spinner Component
 * @param {object} props - Component properties
 * @param {string} props.variant - Spinner variant ('orb', 'spell', 'runes', 'portal')
 * @param {string} props.size - Size ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {string} props.message - Loading message
 * @param {boolean} props.overlay - Show as overlay
 * @param {string} props.color - Color theme ('primary', 'secondary', 'accent')
 * @param {boolean} props.pulsing - Enable pulsing effect
 * @param {string} props.className - Additional CSS classes
 */
const MysticalLoading = ({
  variant = 'orb',
  size = 'md',
  message = '',
  overlay = false,
  color = 'primary',
  pulsing = true,
  className = '',
  ...props
}) => {
  const spinnerClasses = [
    'verse-loading-spinner',
    `verse-loading-${variant}`,
    `verse-loading-${size}`,
    `verse-loading-${color}`,
    pulsing && 'verse-loading-pulsing',
    className
  ].filter(Boolean).join(' ');

  const renderSpinnerContent = () => {
    switch (variant) {
      case 'orb':
        return (
          <div className="verse-orb-container">
            <div className="verse-orb-core"></div>
            <div className="verse-orb-ring verse-orb-ring-1"></div>
            <div className="verse-orb-ring verse-orb-ring-2"></div>
            <div className="verse-orb-ring verse-orb-ring-3"></div>
            <div className="verse-orb-particles">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`verse-orb-particle verse-orb-particle-${i + 1}`}></div>
              ))}
            </div>
          </div>
        );

      case 'spell':
        return (
          <div className="verse-spell-container">
            <div className="verse-spell-circle">
              <div className="verse-spell-inner"></div>
              <div className="verse-spell-symbols">
                {['✦', '✧', '✩', '✪', '✫', '✬'].map((symbol, i) => (
                  <span key={i} className={`verse-spell-symbol verse-spell-symbol-${i + 1}`}>
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'runes':
        return (
          <div className="verse-runes-container">
            {['ᚱ', 'ᚢ', 'ᚾ', 'ᛖ', 'ᛋ'].map((rune, i) => (
              <div key={i} className={`verse-rune verse-rune-${i + 1}`}>
                {rune}
              </div>
            ))}
          </div>
        );

      case 'portal':
        return (
          <div className="verse-portal-container">
            <div className="verse-portal-outer"></div>
            <div className="verse-portal-middle"></div>
            <div className="verse-portal-inner"></div>
            <div className="verse-portal-core"></div>
            <div className="verse-portal-energy">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`verse-portal-spark verse-portal-spark-${i + 1}`}></div>
              ))}
            </div>
          </div>
        );

      default:
        return <div className="verse-simple-spinner"></div>;
    }
  };

  const LoadingSpinner = () => (
    <div className={spinnerClasses} {...props}>
      {renderSpinnerContent()}
      {message && (
        <div className="verse-loading-message">
          <span className="verse-loading-text">{message}</span>
          <div className="verse-loading-dots">
            <span className="verse-dot verse-dot-1">.</span>
            <span className="verse-dot verse-dot-2">.</span>
            <span className="verse-dot verse-dot-3">.</span>
          </div>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="verse-loading-overlay">
        <div className="verse-loading-backdrop"></div>
        <LoadingSpinner />
      </div>
    );
  }

  return <LoadingSpinner />;
};

export default MysticalLoading;

// Export specific loading variants for convenience
export const OrbLoader = (props) => <MysticalLoading variant="orb" {...props} />;
export const SpellLoader = (props) => <MysticalLoading variant="spell" {...props} />;
export const RuneLoader = (props) => <MysticalLoading variant="runes" {...props} />;
export const PortalLoader = (props) => <MysticalLoading variant="portal" {...props} />;

// Export overlay versions
export const OverlayLoader = (props) => <MysticalLoading overlay {...props} />;