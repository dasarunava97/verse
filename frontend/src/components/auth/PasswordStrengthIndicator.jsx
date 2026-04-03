/**
 * VERSE Mystical Password Strength Indicator
 * Enchanted password security visualization with mystical theming
 */

import React, { useMemo } from 'react';
import { VALIDATION_RULES, ICONS } from '../../utils/constants.js';
import './PasswordStrengthIndicator.css';

// =============================================================================
// PASSWORD STRENGTH CONFIGURATION
// =============================================================================

const STRENGTH_LEVELS = {
  WEAK: {
    score: 0,
    label: 'Fragile Spell',
    color: '#EF4444',
    icon: '🔓',
    description: 'Your incantation lacks mystical power'
  },
  FAIR: {
    score: 1,
    label: 'Novice Magic',
    color: '#F59E0B',
    icon: '🔶',
    description: 'A basic spell, but more power is needed'
  },
  GOOD: {
    score: 2,
    label: 'Adept Ward',
    color: '#10B981',
    icon: '🔸',
    description: 'A solid protective enchantment'
  },
  STRONG: {
    score: 3,
    label: 'Master Shield',
    color: '#06B6D4',
    icon: '🔹',
    description: 'A powerful mystical barrier'
  },
  MYSTICAL: {
    score: 4,
    label: 'Legendary Aegis',
    color: '#8B5CF6',
    icon: '🔮',
    description: 'An impenetrable mystical fortress'
  }
};

const MYSTICAL_CRITERIA = [
  {
    id: 'length',
    label: 'Ancient Knowledge',
    description: `At least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
    icon: '📜',
    check: (password) => password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH
  },
  {
    id: 'uppercase',
    label: 'Celestial Runes',
    description: 'Contains uppercase letters',
    icon: '✨',
    check: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'Earthen Symbols',
    description: 'Contains lowercase letters',
    icon: '🌱',
    check: (password) => /[a-z]/.test(password)
  },
  {
    id: 'numbers',
    label: 'Arcane Numbers',
    description: 'Contains numerical digits',
    icon: '🔢',
    check: (password) => /[0-9]/.test(password)
  },
  {
    id: 'special',
    label: 'Mystical Sigils',
    description: 'Contains special characters',
    icon: '⚡',
    check: (password) => new RegExp(`[${VALIDATION_RULES.PASSWORD.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)
  },
  {
    id: 'entropy',
    label: 'Chaos Essence',
    description: 'Sufficient randomness and variety',
    icon: '🌀',
    check: (password) => {
      const uniqueChars = new Set(password).size;
      return uniqueChars >= VALIDATION_RULES.PASSWORD.MIN_UNIQUE_CHARS;
    }
  }
];

// =============================================================================
// PASSWORD STRENGTH INDICATOR COMPONENT
// =============================================================================

const MysticalPasswordStrengthIndicator = ({
  password = '',
  showCriteria = true,
  showLabel = true,
  showProgress = true,
  compact = false,
  className = '',
  ...props
}) => {

  // =============================================================================
  // STRENGTH CALCULATION
  // =============================================================================

  const strengthAnalysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        level: STRENGTH_LEVELS.WEAK,
        criteriaResults: MYSTICAL_CRITERIA.map(criteria => ({
          ...criteria,
          passed: false
        })),
        percentage: 0,
        passedCount: 0
      };
    }

    // Check each criterion
    const criteriaResults = MYSTICAL_CRITERIA.map(criteria => ({
      ...criteria,
      passed: criteria.check(password)
    }));

    const passedCount = criteriaResults.filter(result => result.passed).length;
    const percentage = (passedCount / MYSTICAL_CRITERIA.length) * 100;

    // Calculate strength score based on criteria and additional factors
    let score = Math.floor(passedCount / 2); // Base score from criteria

    // Bonus points for exceptional length
    if (password.length >= 16) score++;
    if (password.length >= 24) score++;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
    if (/123|abc|qwe|password|admin/i.test(password)) score--; // Common patterns

    // Ensure score is within bounds
    score = Math.max(0, Math.min(4, score));

    // Determine strength level
    const strengthLevels = Object.values(STRENGTH_LEVELS);
    const level = strengthLevels.find(level => level.score === score) || STRENGTH_LEVELS.WEAK;

    return {
      score,
      level,
      criteriaResults,
      percentage,
      passedCount
    };
  }, [password]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderStrengthBar = () => {
    if (!showProgress) return null;

    return (
      <div className="verse-password-strength-bar">
        <div className="verse-strength-progress">
          <div 
            className="verse-strength-fill"
            style={{ 
              width: `${strengthAnalysis.percentage}%`,
              backgroundColor: strengthAnalysis.level.color
            }}
          />
        </div>
        
        <div className="verse-strength-segments">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className={`verse-strength-segment ${
                index < strengthAnalysis.score ? 'active' : ''
              }`}
              style={{
                backgroundColor: index < strengthAnalysis.score 
                  ? strengthAnalysis.level.color 
                  : 'transparent'
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderStrengthLabel = () => {
    if (!showLabel) return null;

    return (
      <div className="verse-password-strength-label">
        <div className="verse-strength-info">
          <span 
            className="verse-strength-icon"
            style={{ color: strengthAnalysis.level.color }}
          >
            {strengthAnalysis.level.icon}
          </span>
          <span 
            className="verse-strength-text"
            style={{ color: strengthAnalysis.level.color }}
          >
            {strengthAnalysis.level.label}
          </span>
        </div>
        
        <div className="verse-strength-description">
          {strengthAnalysis.level.description}
        </div>
      </div>
    );
  };

  const renderCriteria = () => {
    if (!showCriteria || compact) return null;

    return (
      <div className="verse-password-criteria">
        <div className="verse-criteria-header">
          <span className="verse-criteria-title">Mystical Requirements</span>
          <span className="verse-criteria-count">
            {strengthAnalysis.passedCount} of {MYSTICAL_CRITERIA.length}
          </span>
        </div>
        
        <div className="verse-criteria-list">
          {strengthAnalysis.criteriaResults.map((criterion) => (
            <div
              key={criterion.id}
              className={`verse-criterion ${criterion.passed ? 'passed' : 'pending'}`}
            >
              <span className="verse-criterion-icon">
                {criterion.passed ? ICONS.CHECK : criterion.icon}
              </span>
              <div className="verse-criterion-content">
                <span className="verse-criterion-label">
                  {criterion.label}
                </span>
                <span className="verse-criterion-description">
                  {criterion.description}
                </span>
              </div>
              <span className="verse-criterion-status">
                {criterion.passed ? (
                  <span className="verse-status-check">{ICONS.CHECK}</span>
                ) : (
                  <span className="verse-status-pending">○</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const containerClasses = [
    'verse-password-strength-indicator',
    compact && 'compact',
    !password && 'empty',
    `strength-${strengthAnalysis.level.label.toLowerCase().replace(/\s+/g, '-')}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      style={{ '--strength-color': strengthAnalysis.level.color }}
      {...props}
    >
      {renderStrengthBar()}
      {renderStrengthLabel()}
      {renderCriteria()}
    </div>
  );
};

export default MysticalPasswordStrengthIndicator;