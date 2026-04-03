/**
 * VERSE Mystical Search Bar Component
 * Enchanted search interface with real-time results and mystical animations
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ICONS } from '../../utils/constants.js';
import { PerformanceSpells } from '../../utils/helpers.js';
import MysticalButton from '../common/Button.jsx';
import Loading from '../common/Loading.jsx';
import './SearchBar.css';

// =============================================================================
// SEARCH BAR COMPONENT
// =============================================================================

const SearchBar = ({
  value = '',
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  onClear,
  results = [],
  recentSearches = [],
  isSearching = false,
  placeholder = 'Search...',
  variant = 'default',
  size = 'medium',
  showResults = false,
  showRecentSearches = true,
  maxResults = 10,
  debounceMs = 300,
  autoFocus = false,
  disabled = false,
  className = '',
  resultRenderer,
  emptyStateRenderer,
  ...props
}) => {
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState(value);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const displayResults = useMemo(() => {
    if (isSearching) return [];
    
    const filtered = results.slice(0, maxResults);
    return filtered.map(result => ({
      ...result,
      highlightedTitle: highlightSearchTerm(result.title || '', searchQuery),
      highlightedDescription: result.description 
        ? highlightSearchTerm(result.description, searchQuery)
        : null
    }));
  }, [results, maxResults, searchQuery, isSearching]);

  const showRecentSearchesSection = useMemo(() => {
    return showRecentSearches && 
           recentSearches.length > 0 && 
           searchQuery.length === 0 && 
           !isSearching;
  }, [showRecentSearches, recentSearches.length, searchQuery.length, isSearching]);

  const shouldShowDropdown = useMemo(() => {
    return isOpen && (
      showRecentSearchesSection || 
      displayResults.length > 0 || 
      isSearching ||
      (searchQuery.length > 0 && !isSearching)
    );
  }, [isOpen, showRecentSearchesSection, displayResults.length, isSearching, searchQuery.length]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const highlightSearchTerm = useCallback((text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  const getResultIcon = useCallback((result) => {
    switch (result.type) {
      case 'story':
        return ICONS.BOOK;
      case 'author':
      case 'user':
        return ICONS.USER;
      case 'collection':
        return ICONS.BOOKMARK;
      case 'genre':
        return ICONS.TAG;
      case 'guide':
        return ICONS.INFO_CIRCLE;
      default:
        return ICONS.SEARCH;
    }
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const debouncedOnChange = useCallback(
    PerformanceSpells.castDebounce((query) => {
      if (onChange) {
        onChange(query);
      }
    }, debounceMs),
    [onChange, debounceMs]
  );

  const handleInputChange = useCallback((event) => {
    const newValue = event.target.value;
    setSearchQuery(newValue);
    setFocusedIndex(-1);
    
    if (newValue !== value) {
      debouncedOnChange(newValue);
    }
  }, [value, debouncedOnChange]);

  const handleInputFocus = useCallback((event) => {
    setIsOpen(true);
    setFocusedIndex(-1);
    
    if (onFocus) {
      onFocus(event);
    }
  }, [onFocus]);

  const handleInputBlur = useCallback((event) => {
    // Delay closing to allow clicks on results
    setTimeout(() => {
      setIsOpen(false);
      setFocusedIndex(-1);
    }, 150);
    
    if (onBlur) {
      onBlur(event);
    }
  }, [onBlur]);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    
    if (focusedIndex >= 0 && displayResults[focusedIndex]) {
      handleResultClick(displayResults[focusedIndex]);
    } else if (searchQuery.trim() && onSubmit) {
      onSubmit(searchQuery.trim());
      setIsOpen(false);
    }
  }, [focusedIndex, displayResults, searchQuery, onSubmit]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setFocusedIndex(-1);
    
    if (onClear) {
      onClear();
    }
    
    if (onChange) {
      onChange('');
    }
    
    inputRef.current?.focus();
  }, [onClear, onChange]);

  const handleResultClick = useCallback((result) => {
    if (result.action) {
      result.action(result);
    } else if (onSubmit) {
      onSubmit(result.query || result.title || '');
    }
    
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onSubmit]);

  const handleRecentSearchClick = useCallback((recentSearch) => {
    setSearchQuery(recentSearch);
    
    if (onChange) {
      onChange(recentSearch);
    }
    
    if (onSubmit) {
      onSubmit(recentSearch);
    }
    
    setIsOpen(false);
  }, [onChange, onSubmit]);

  const handleKeyDown = useCallback((event) => {
    if (!shouldShowDropdown) return;

    const totalItems = showRecentSearchesSection 
      ? recentSearches.length + displayResults.length
      : displayResults.length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        event.preventDefault();
        handleSubmit(event);
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
        
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [shouldShowDropdown, showRecentSearchesSection, recentSearches.length, 
      displayResults.length, handleSubmit]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderSearchIcon = () => (
    <div className="verse-search-icon">
      {isSearching ? (
        <Loading size="sm" variant="minimal" />
      ) : (
        ICONS.SEARCH
      )}
    </div>
  );

  const renderClearButton = () => {
    if (!searchQuery || disabled) return null;

    return (
      <button
        type="button"
        className="verse-search-clear"
        onClick={handleClear}
        aria-label="Clear search"
        tabIndex={-1}
      >
        {ICONS.X}
      </button>
    );
  };

  const renderSubmitButton = () => {
    if (variant === 'minimal' || variant === 'header') return null;

    return (
      <MysticalButton
        type="submit"
        variant="primary"
        size={size === 'large' ? 'md' : 'sm'}
        disabled={!searchQuery.trim() || disabled}
        className="verse-search-submit"
      >
        Search
      </MysticalButton>
    );
  };

  const renderRecentSearches = () => {
    if (!showRecentSearchesSection) return null;

    return (
      <div className="verse-search-section">
        <div className="verse-search-section-header">
          <span className="verse-search-section-title">Recent Searches</span>
        </div>
        
        <div className="verse-search-section-items">
          {recentSearches.slice(0, 5).map((recentSearch, index) => (
            <button
              key={`recent-${index}`}
              className={`verse-search-recent-item ${
                focusedIndex === index ? 'focused' : ''
              }`}
              onClick={() => handleRecentSearchClick(recentSearch)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <span className="verse-search-recent-icon">
                {ICONS.CLOCK}
              </span>
              <span className="verse-search-recent-text">
                {recentSearch}
              </span>
              <span className="verse-search-recent-action">
                {ICONS.ARROW_UP_RIGHT}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (displayResults.length === 0 && !isSearching) {
      return renderEmptyState();
    }

    const resultsStartIndex = showRecentSearchesSection ? recentSearches.length : 0;

    return (
      <div className="verse-search-section">
        {displayResults.length > 0 && (
          <div className="verse-search-section-header">
            <span className="verse-search-section-title">Results</span>
            <span className="verse-search-section-count">
              {displayResults.length}
            </span>
          </div>
        )}
        
        <div className="verse-search-section-items">
          {displayResults.map((result, index) => (
            <div
              key={result.id || index}
              className={`verse-search-result-item ${
                focusedIndex === resultsStartIndex + index ? 'focused' : ''
              }`}
              onClick={() => handleResultClick(result)}
              onMouseEnter={() => setFocusedIndex(resultsStartIndex + index)}
              role="button"
              tabIndex={-1}
            >
              {resultRenderer ? (
                resultRenderer(result, searchQuery)
              ) : (
                <>
                  <div className="verse-search-result-icon">
                    {getResultIcon(result)}
                  </div>
                  
                  <div className="verse-search-result-content">
                    <div className="verse-search-result-title"
                         dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
                    />
                    
                    {result.description && (
                      <div className="verse-search-result-description"
                           dangerouslySetInnerHTML={{ __html: result.highlightedDescription }}
                      />
                    )}
                    
                    {result.metadata && (
                      <div className="verse-search-result-metadata">
                        {result.type && (
                          <span className="verse-search-result-type">
                            {result.type}
                          </span>
                        )}
                        {result.author && (
                          <span className="verse-search-result-author">
                            by {result.author}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="verse-search-result-action">
                    {ICONS.ARROW_UP_RIGHT}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (emptyStateRenderer) {
      return emptyStateRenderer(searchQuery);
    }

    if (searchQuery.length === 0) return null;

    return (
      <div className="verse-search-empty">
        <div className="verse-search-empty-icon">
          {ICONS.SEARCH}
        </div>
        <div className="verse-search-empty-title">
          No results found
        </div>
        <div className="verse-search-empty-message">
          Try searching for something else or check your spelling.
        </div>
      </div>
    );
  };

  const renderDropdown = () => {
    if (!shouldShowDropdown) return null;

    return (
      <div 
        ref={resultsRef}
        className="verse-search-dropdown"
        role="listbox"
        aria-label="Search results"
      >
        <div className="verse-search-dropdown-content">
          {isSearching ? (
            <div className="verse-search-loading">
              <Loading size="sm" />
              <span>Searching the mystical realm...</span>
            </div>
          ) : (
            <>
              {renderRecentSearches()}
              {(displayResults.length > 0 || searchQuery.length > 0) && renderResults()}
            </>
          )}
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const searchBarClasses = [
    'verse-search-bar',
    `variant-${variant}`,
    `size-${size}`,
    isOpen && 'open',
    disabled && 'disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={searchBarClasses} {...props}>
      <form onSubmit={handleSubmit} className="verse-search-form">
        <div className="verse-search-input-container">
          {renderSearchIcon()}
          
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="verse-search-input"
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded={shouldShowDropdown}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />
          
          {renderClearButton()}
          {renderSubmitButton()}
        </div>
      </form>
      
      {renderDropdown()}
    </div>
  );
};

export default SearchBar;