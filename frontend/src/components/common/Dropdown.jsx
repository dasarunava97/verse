/**
 * VERSE Mystical Dropdown Component
 * Enchanted dropdown with flexible positioning and mystical animations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../../utils/constants.js';
import './Dropdown.css';

// =============================================================================
// MYSTICAL DROPDOWN COMPONENT
// =============================================================================

const MysticalDropdown = ({
  trigger,
  children,
  items = [],
  isOpen = false,
  onToggle,
  onClose,
  placement = 'bottom-start',
  variant = 'default',
  size = 'medium',
  showShortcuts = false,
  disabled = false,
  closeOnSelect = true,
  offset = 8,
  className = '',
  portalContainer = null,
  ...props
}) => {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [isAnimating, setIsAnimating] = useState(false);

  // =============================================================================
  // POSITION CALCULATION
  // =============================================================================

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = 0;
    let left = 0;
    let finalPlacement = placement;

    // Calculate base position based on placement
    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        top = triggerRect.top - dropdownRect.height - offset;
        break;
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
      default:
        top = triggerRect.bottom + offset;
        break;
      case 'left':
      case 'left-start':
      case 'left-end':
        left = triggerRect.left - dropdownRect.width - offset;
        break;
      case 'right':
      case 'right-start':
      case 'right-end':
        left = triggerRect.right + offset;
        break;
    }

    // Calculate horizontal alignment
    if (placement.includes('start')) {
      left = triggerRect.left;
    } else if (placement.includes('end')) {
      left = triggerRect.right - dropdownRect.width;
    } else if (placement === 'top' || placement === 'bottom') {
      left = triggerRect.left + (triggerRect.width - dropdownRect.width) / 2;
    }

    // Calculate vertical alignment for side placements
    if (placement.includes('left') || placement.includes('right')) {
      if (placement.includes('start')) {
        top = triggerRect.top;
      } else if (placement.includes('end')) {
        top = triggerRect.bottom - dropdownRect.height;
      } else {
        top = triggerRect.top + (triggerRect.height - dropdownRect.height) / 2;
      }
    }

    // Viewport boundary checks and adjustments
    if (top < 0) {
      top = triggerRect.bottom + offset;
      finalPlacement = finalPlacement.replace('top', 'bottom');
    } else if (top + dropdownRect.height > viewport.height) {
      top = triggerRect.top - dropdownRect.height - offset;
      finalPlacement = finalPlacement.replace('bottom', 'top');
    }

    if (left < 0) {
      left = offset;
    } else if (left + dropdownRect.width > viewport.width) {
      left = viewport.width - dropdownRect.width - offset;
    }

    setPosition({ top, left });
    setActualPlacement(finalPlacement);
  }, [placement, offset]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTriggerClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    if (onToggle) {
      onToggle(!isOpen);
    }
  }, [disabled, isOpen, onToggle]);

  const handleItemClick = useCallback((item, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (item.disabled) return;

    if (item.action) {
      item.action(item, event);
    }

    if (closeOnSelect && onClose) {
      onClose();
    } else if (closeOnSelect && onToggle) {
      onToggle(false);
    }
  }, [closeOnSelect, onClose, onToggle]);

  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        if (onClose) onClose();
        else if (onToggle) onToggle(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        // Focus next item logic would go here
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Focus previous item logic would go here
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Activate focused item logic would go here
        break;
    }
  }, [isOpen, onClose, onToggle]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Position calculation when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef.current && dropdownRef.current) {
      calculatePosition();
      setIsAnimating(true);
      
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, calculatePosition]);

  // Window resize handler
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isOpen, calculatePosition]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        if (onClose) onClose();
        else if (onToggle) onToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, onToggle]);

  // Keyboard handler
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderTrigger = () => {
    const triggerElement = React.cloneElement(trigger, {
      ref: triggerRef,
      onClick: handleTriggerClick,
      'aria-expanded': isOpen,
      'aria-haspopup': true,
      className: `${trigger.props.className || ''} verse-dropdown-trigger ${
        isOpen ? 'active' : ''
      } ${disabled ? 'disabled' : ''}`.trim()
    });

    return triggerElement;
  };

  const renderDivider = () => (
    <div className="verse-dropdown-divider" role="separator" />
  );

  const renderItem = (item, index) => {
    if (item.type === 'divider') {
      return <div key={`divider-${index}`}>{renderDivider()}</div>;
    }

    const itemClasses = [
      'verse-dropdown-item',
      item.variant && `variant-${item.variant}`,
      item.disabled && 'disabled',
      item.active && 'active'
    ].filter(Boolean).join(' ');

    return (
      <button
        key={item.id || index}
        className={itemClasses}
        onClick={(event) => handleItemClick(item, event)}
        disabled={item.disabled}
        role="menuitem"
        tabIndex={item.disabled ? -1 : 0}
      >
        {item.icon && (
          <span className="verse-dropdown-item-icon">
            {item.icon}
          </span>
        )}
        
        <span className="verse-dropdown-item-content">
          <span className="verse-dropdown-item-label">
            {item.label}
          </span>
          {item.description && (
            <span className="verse-dropdown-item-description">
              {item.description}
            </span>
          )}
        </span>

        {showShortcuts && item.shortcut && (
          <span className="verse-dropdown-item-shortcut">
            {item.shortcut}
          </span>
        )}

        {item.badge && (
          <span className={`verse-dropdown-item-badge ${item.badge.variant || ''}`}>
            {item.badge.text}
          </span>
        )}
      </button>
    );
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownClasses = [
      'verse-dropdown',
      `variant-${variant}`,
      `size-${size}`,
      `placement-${actualPlacement}`,
      isAnimating && 'animating',
      className
    ].filter(Boolean).join(' ');

    const dropdownContent = (
      <div
        ref={dropdownRef}
        className={dropdownClasses}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 9999
        }}
        role="menu"
        aria-orientation="vertical"
        {...props}
      >
        <div className="verse-dropdown-content">
          {children || (
            <div className="verse-dropdown-items">
              {items.map((item, index) => renderItem(item, index))}
            </div>
          )}
        </div>
      </div>
    );

    // Use portal if container specified or if we need to escape positioning context
    const container = portalContainer || document.body;
    return createPortal(dropdownContent, container);
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="verse-dropdown-container">
      {renderTrigger()}
      {renderDropdown()}
    </div>
  );
};

export default MysticalDropdown;