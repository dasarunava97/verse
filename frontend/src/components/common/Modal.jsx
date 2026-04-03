/**
 * VERSE Mystical Modal Component
 * Enchanted dialog system with portal magic and dimensional transitions
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  forwardRef,
  useImperativeHandle 
} from 'react';
import { createPortal } from 'react-dom';
import { THEME_COLORS, UI_CONFIG, ICONS } from '../../utils/constants.js';
import { DeviceSpells, PerformanceSpells } from '../../utils/helpers.js';
import './Modal.css';

// =============================================================================
// MYSTICAL MODAL HOOK
// =============================================================================

/**
 * Custom hook for mystical modal management
 */
const useMysticalModal = (isOpen, onClose, options = {}) => {
  const {
    closeOnEscape = true,
    closeOnBackdrop = true,
    preventScroll = true,
    autoFocus = true,
    restoreFocus = true,
    trapFocus = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousActiveElement = useRef(null);
  const modalRef = useRef(null);
  const firstFocusableElement = useRef(null);
  const lastFocusableElement = useRef(null);

  // Store the element that was focused before opening modal
  useEffect(() => {
    if (isOpen && restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }
  }, [isOpen, restoreFocus]);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = getScrollbarWidth() + 'px';
      }

      setTimeout(() => {
        setIsAnimating(false);
        if (autoFocus && modalRef.current) {
          const focusableElement = findFirstFocusableElement(modalRef.current);
          if (focusableElement) {
            focusableElement.focus();
          }
        }
      }, UI_CONFIG.ANIMATIONS.NORMAL);
    } else {
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        
        if (preventScroll) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }

        if (restoreFocus && previousActiveElement.current) {
          previousActiveElement.current.focus();
          previousActiveElement.current = null;
        }
      }, UI_CONFIG.ANIMATIONS.NORMAL);
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [isOpen, preventScroll, autoFocus, restoreFocus]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isVisible) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isVisible, closeOnEscape, onClose]);

  // Handle focus trap
  useEffect(() => {
    if (!trapFocus || !isVisible || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = findFocusableElements(modal);
    
    if (focusableElements.length === 0) return;

    firstFocusableElement.current = focusableElements[0];
    lastFocusableElement.current = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusableElement.current) {
          event.preventDefault();
          lastFocusableElement.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableElement.current) {
          event.preventDefault();
          firstFocusableElement.current?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isVisible, trapFocus]);

  const handleBackdropClick = useCallback((event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose?.();
    }
  }, [closeOnBackdrop, onClose]);

  return {
    isVisible,
    isAnimating,
    modalRef,
    handleBackdropClick
  };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getScrollbarWidth = () => {
  const scrollDiv = document.createElement('div');
  scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
  document.body.appendChild(scrollDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return scrollbarWidth;
};

const findFocusableElements = (container) => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
};

const findFirstFocusableElement = (container) => {
  const elements = findFocusableElements(container);
  return elements[0] || null;
};

// =============================================================================
// MYSTICAL MODAL COMPONENT
// =============================================================================

const MysticalModal = forwardRef(({
  isOpen = false,
  onClose,
  children,
  title,
  subtitle,
  size = 'medium',
  variant = 'default',
  showCloseButton = true,
  showHeader = true,
  headerActions,
  footer,
  className = '',
  style = {},
  backdropClassName = '',
  contentClassName = '',
  closeOnEscape = true,
  closeOnBackdrop = true,
  preventScroll = true,
  autoFocus = true,
  restoreFocus = true,
  trapFocus = true,
  zIndex = UI_CONFIG.Z_INDEX.MODAL,
  maxWidth,
  maxHeight,
  fullScreen = false,
  centered = true,
  overlay = true,
  portal = true,
  portalTarget,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  role = 'dialog',
  onAfterOpen,
  onAfterClose,
  onBeforeClose,
  ...restProps
}, ref) => {
  const {
    isVisible,
    isAnimating,
    modalRef,
    handleBackdropClick
  } = useMysticalModal(isOpen, onClose, {
    closeOnEscape,
    closeOnBackdrop,
    preventScroll,
    autoFocus,
    restoreFocus,
    trapFocus
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const contentRef = useRef(null);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    focus: () => {
      const focusableElement = findFirstFocusableElement(modalRef.current);
      if (focusableElement) focusableElement.focus();
    },
    close: () => onClose?.(),
    getElement: () => modalRef.current,
    isAnimating,
    isVisible
  }), [isAnimating, isVisible, onClose]);

  // Track content dimensions for responsive behavior
  useEffect(() => {
    if (!contentRef.current) return;

    const updateDimensions = PerformanceSpells.castThrottle(() => {
      if(contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    }, 100);

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(contentRef.current);

    return () => resizeObserver.disconnect();
  }, [isVisible]);

  // Lifecycle callbacks
  useEffect(() => {
    if (isOpen && !isAnimating && isVisible) {
      onAfterOpen?.();
    } else if (!isOpen && !isAnimating && !isVisible) {
      onAfterClose?.();
    }
  }, [isOpen, isAnimating, isVisible, onAfterOpen, onAfterClose]);

  const handleCloseClick = useCallback(async () => {
    try {
      await onBeforeClose?.();
      onClose?.();
    } catch (error) {
      console.warn('Modal close prevented by onBeforeClose callback:', error);
    }
  }, [onBeforeClose, onClose]);

  // Generate mystical classes
  const modalClasses = useMemo(() => {
    const classes = ['verse-modal'];
    
    if (isOpen) classes.push('verse-modal-open');
    if (isAnimating) classes.push('verse-modal-animating');
    if (fullScreen) classes.push('verse-modal-fullscreen');
    if (centered) classes.push('verse-modal-centered');
    if (!overlay) classes.push('verse-modal-no-overlay');
    
    classes.push(`verse-modal-${size}`);
    classes.push(`verse-modal-${variant}`);
    
    if (className) classes.push(className);
    
    return classes.join(' ');
  }, [isOpen, isAnimating, fullScreen, centered, overlay, size, variant, className]);

  const backdropClasses = useMemo(() => {
    const classes = ['verse-modal-backdrop'];
    
    if (isOpen) classes.push('verse-modal-backdrop-open');
    if (isAnimating) classes.push('verse-modal-backdrop-animating');
    if (backdropClassName) classes.push(backdropClassName);
    
    return classes.join(' ');
  }, [isOpen, isAnimating, backdropClassName]);

  const contentClasses = useMemo(() => {
    const classes = ['verse-modal-content'];
    
    if (contentClassName) classes.push(contentClassName);
    
    return classes.join(' ');
  }, [contentClassName]);

  // Build modal content
  const modalContent = (
    <div
      className={modalClasses}
      style={{ 
        zIndex,
        '--modal-max-width': maxWidth,
        '--modal-max-height': maxHeight,
        ...style 
      }}
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      {...restProps}
    >
      {overlay && (
        <div
          className={backdropClasses}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      
      <div
        ref={modalRef}
        className="verse-modal-container"
        role="document"
      >
        <div
          ref={contentRef}
          className={contentClasses}
        >
          {showHeader && (title || subtitle || showCloseButton || headerActions) && (
            <div className="verse-modal-header">
              <div className="verse-modal-header-content">
                {title && (
                  <h2 
                    className="verse-modal-title"
                    id={ariaLabelledBy || 'modal-title'}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="verse-modal-subtitle">
                    {subtitle}
                  </p>
                )}
              </div>
              
              <div className="verse-modal-header-actions">
                {headerActions}
                {showCloseButton && (
                  <button
                    type="button"
                    className="verse-modal-close-button"
                    onClick={handleCloseClick}
                    aria-label="Close modal"
                    title="Close"
                  >
                    <span className="verse-modal-close-icon">
                      {ICONS.CLOSE || '✕'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div 
            className="verse-modal-body"
            id={ariaDescribedBy || 'modal-body'}
          >
            {children}
          </div>
          
          {footer && (
            <div className="verse-modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render with or without portal
  if (!isVisible) return null;

  if (portal) {
    const target = portalTarget || document.body;
    return createPortal(modalContent, target);
  }

  return modalContent;
});

MysticalModal.displayName = 'MysticalModal';

// =============================================================================
// MODAL PRESET COMPONENTS
// =============================================================================

/**
 * Confirmation Modal Preset
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  icon,
  ...props
}) => {
  const handleConfirm = useCallback(async () => {
    try {
      await onConfirm?.();
      onClose?.();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  }, [onConfirm, onClose]);

  return (
    <MysticalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      variant={variant}
      centered
      {...props}
    >
      <div className="verse-confirmation-modal">
        {icon && (
          <div className="verse-confirmation-icon">
            {icon}
          </div>
        )}
        <div className="verse-confirmation-message">
          {message}
        </div>
        <div className="verse-confirmation-actions">
          <button
            type="button"
            className="verse-button verse-button-secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`verse-button verse-button-${variant}`}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </MysticalModal>
  );
};

/**
 * Alert Modal Preset
 */
const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  buttonText = 'OK',
  variant = 'info',
  icon,
  ...props
}) => {
  return (
    <MysticalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      variant={variant}
      centered
      closeOnBackdrop={false}
      {...props}
    >
      <div className="verse-alert-modal">
        {icon && (
          <div className="verse-alert-icon">
            {icon}
          </div>
        )}
        <div className="verse-alert-message">
          {message}
        </div>
        <div className="verse-alert-actions">
          <button
            type="button"
            className={`verse-button verse-button-${variant}`}
            onClick={onClose}
            autoFocus
          >
            {buttonText}
          </button>
        </div>
      </div>
    </MysticalModal>
  );
};

/**
 * Loading Modal Preset
 */
const LoadingModal = ({
  isOpen,
  message = 'Loading...',
  progress,
  showProgress = false,
  variant = 'mystical',
  ...props
}) => {
  return (
    <MysticalModal
      isOpen={isOpen}
      size="small"
      variant={variant}
      centered
      showHeader={false}
      showCloseButton={false}
      closeOnEscape={false}
      closeOnBackdrop={false}
      {...props}
    >
      <div className="verse-loading-modal">
        <div className="verse-loading-spinner">
          <div className="verse-loading-orb"></div>
          <div className="verse-loading-rings">
            <div className="verse-loading-ring"></div>
            <div className="verse-loading-ring"></div>
            <div className="verse-loading-ring"></div>
          </div>
        </div>
        <div className="verse-loading-message">
          {message}
        </div>
        {showProgress && progress !== undefined && (
          <div className="verse-loading-progress">
            <div className="verse-progress-bar">
              <div 
                className="verse-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="verse-progress-text">
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>
    </MysticalModal>
  );
};

// =============================================================================
// MODAL CONTEXT PROVIDER
// =============================================================================

const ModalContext = React.createContext({});

const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  const openModal = useCallback((modalComponent, props = {}) => {
    const id = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setModals(current => [
      ...current,
      {
        id,
        component: modalComponent,
        props: {
          ...props,
          isOpen: true,
          onClose: () => closeModal(id)
        }
      }
    ]);

    return id;
  }, []);

  const closeModal = useCallback((id) => {
    setModals(current => 
      current.map(modal => 
        modal.id === id 
          ? { ...modal, props: { ...modal.props, isOpen: false } }
          : modal
      )
    );

    // Remove modal after animation
    setTimeout(() => {
      setModals(current => current.filter(modal => modal.id !== id));
    }, UI_CONFIG.ANIMATIONS.NORMAL);
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(current => 
      current.map(modal => ({ 
        ...modal, 
        props: { ...modal.props, isOpen: false } 
      }))
    );

    setTimeout(() => {
      setModals([]);
    }, UI_CONFIG.ANIMATIONS.NORMAL);
  }, []);

  const contextValue = useMemo(() => ({
    openModal,
    closeModal,
    closeAllModals,
    modals
  }), [openModal, closeModal, closeAllModals, modals]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {modals.map(({ id, component: ModalComponent, props }) => (
        <ModalComponent key={id} {...props} />
      ))}
    </ModalContext.Provider>
  );
};

// =============================================================================
// MODAL HOOK
// =============================================================================

export const useModal = () => {
  const context = React.useContext(ModalContext);
  
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  
  return context;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default MysticalModal;
export { 
  useMysticalModal,
  ConfirmationModal,
  AlertModal,
  LoadingModal,
  ModalProvider
};