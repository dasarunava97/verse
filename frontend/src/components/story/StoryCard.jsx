/**
 * VERSE Mystical Story Card Component
 * Interactive story display card with enchanted animations and comprehensive features
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import UserAvatar from '../user/Avatar.jsx';
import Button from '../common/Button.jsx';
import Dropdown from '../common/Dropdown.jsx';
import { toggleFavoriteStory, shareStory, reportStory } from '../../services/stories.js';
import { formatStoryDuration, generateStoryPreview, calculateCompletionPercentage } from '../../services/stories.js';
import { ICONS, STORY_GENRES, DIFFICULTY_LEVELS } from '../../utils/constants.js';
import { formatRelativeTime, truncateText } from '../../utils/helpers.js';
import './StoryCard.css';

// =============================================================================
// STORY CARD CONFIGURATION
// =============================================================================

const CARD_VARIANTS = {
  compact: {
    showDescription: false,
    showStats: false,
    showProgress: false,
    maxDescriptionLength: 0
  },
  default: {
    showDescription: true,
    showStats: true,
    showProgress: true,
    maxDescriptionLength: 120
  },
  detailed: {
    showDescription: true,
    showStats: true,
    showProgress: true,
    showTags: true,
    showCollaborators: true,
    maxDescriptionLength: 200
  },
  library: {
    showDescription: true,
    showStats: false,
    showProgress: true,
    showLastPlayed: true,
    maxDescriptionLength: 100
  }
};

const GENRE_THEMES = {
  Adventure: { color: '#10B981', icon: '🗺️' },
  Fantasy: { color: '#8B5CF6', icon: '🐉' },
  Mystery: { color: '#6366F1', icon: '🔍' },
  Romance: { color: '#EC4899', icon: '💖' },
  SciFi: { color: '#06B6D4', icon: '🚀' },
  Horror: { color: '#EF4444', icon: '👻' },
  Drama: { color: '#F59E0B', icon: '🎭' },
  Comedy: { color: '#84CC16', icon: '😄' }
};

// =============================================================================
// MYSTICAL STORY CARD COMPONENT
// =============================================================================

const MysticalStoryCard = ({
  story,
  variant = 'default',
  showActions = true,
  showAuthor = true,
  clickable = true,
  onStoryClick,
  onAuthorClick,
  onEdit,
  onDelete,
  onPlay,
  showProgress = false,
  className = '',
  onAction = () => {},
  ...props
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(story?.favorites || 0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const cardConfig = useMemo(() => 
    CARD_VARIANTS[variant] || CARD_VARIANTS.default, [variant]
  );

  const genreTheme = useMemo(() => 
    GENRE_THEMES[story?.genre] || GENRE_THEMES.Adventure, [story?.genre]
  );

  const isOwner = useMemo(() => 
    isAuthenticated && user?.id === story?.author?.id, [isAuthenticated, user?.id, story?.author?.id]
  );

  const canEdit = useMemo(() => 
    isOwner || story?.collaborators?.some(c => c.id === user?.id && c.permissions.includes('edit')), 
    [isOwner, story?.collaborators, user?.id]
  );

  const storyPreview = useMemo(() => {
    if (!cardConfig.showDescription || !story?.description) return '';
    return truncateText(story.description, cardConfig.maxDescriptionLength);
  }, [cardConfig.showDescription, story?.description, cardConfig.maxDescriptionLength]);

  const completionPercentage = useMemo(() => {
    if (!story?.progress) return 0;
    return story.progress.completionPercentage || 0;
  }, [story?.progress]);

  const difficultyInfo = useMemo(() => 
    DIFFICULTY_LEVELS[story?.difficulty] || DIFFICULTY_LEVELS.medium, [story?.difficulty]
  );

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleCardClick = useCallback((event) => {
    if (!clickable) return;
    
    // Don't trigger if clicking on interactive elements
    if (event.target.closest('.verse-story-card-actions') || 
        event.target.closest('.verse-story-card-button') ||
        event.target.closest('.verse-story-card-author')) {
      return;
    }

    if (onStoryClick) {
      onStoryClick(story);
    } else {
      navigate(`/story/${story.id}`);
    }
  }, [clickable, onStoryClick, story, navigate]);

  const handleAuthorClick = useCallback((event) => {
    event.stopPropagation();
    
    if (onAuthorClick) {
      onAuthorClick(story.author);
    } else {
      navigate(`/author/${story.author.id}`);
    }
  }, [onAuthorClick, story?.author, navigate]);

  const handlePlayClick = useCallback(async (event) => {
    event.stopPropagation();
    
    if (onPlay) {
      onPlay(story);
    } else {
      navigate(`/story/${story.id}/play`);
    }
  }, [onPlay, story, navigate]);

  const handleFavoriteToggle = async (event) => {
    event.stopPropagation();
    
    // if (!isAuthenticated) {
    //   navigate('/login');
    //   return;
    // }

    setIsFavorited(!isFavorited);
    // try {
    //   const result = await toggleFavoriteStory(story.id);
    //   setIsFavorited(result.isFavorited);
    //   setFavoriteCount(result.favoriteCount);
    // } catch (error) {
    //   console.error('Failed to toggle favorite:', error);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const handleShare = useCallback(async (platform = 'link') => {
    try {
      const result = await shareStory(story.id, platform);
      
      if (navigator.share && platform === 'native') {
        await navigator.share({
          title: story.title,
          text: story.description,
          url: result.shareUrl
        });
      } else {
        await navigator.clipboard.writeText(result.shareUrl);
        // You could show a toast notification here
        console.log('Share link copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to share story:', error);
    }
  }, [story]);

  const handleReport = useCallback(async (reason, details) => {
    try {
      await reportStory(story.id, reason, details);
      // You could show a success notification here
      console.log('Story reported successfully');
    } catch (error) {
      console.error('Failed to report story:', error);
    }
  }, [story?.id]);

  const handleActionsMenuToggle = (event) => {
    // event.stopPropagation();
    setShowActionsMenu(prev => !prev);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderStoryThumbnail = () => {
    return (
      <div className="verse-story-card-thumbnail">
        {story.thumbnail ? (
          <img 
            src={story.thumbnail} 
            alt={story.title}
            className="verse-story-card-image"
            loading="lazy"
          />
        ) : (
          <div className="verse-story-card-placeholder">
            <span className="verse-story-card-placeholder-icon">
              {genreTheme.icon}
            </span>
          </div>
        )}
        
        {/* Genre badge */}
        <div 
          className="verse-story-card-genre-badge"
          style={{ '--genre-color': genreTheme.color }}
        >
          <span className="verse-story-card-genre-icon">
            {genreTheme.icon}
          </span>
          <span className="verse-story-card-genre-text">
            {story.genre}
          </span>
        </div>

        {/* Status indicators */}
        <div className="verse-story-card-status-indicators">
          {story.isFeatured && (
            <span className="verse-story-card-status-badge featured">
              {ICONS.STAR} Featured
            </span>
          )}
          {story.status === 'draft' && (
            <span className="verse-story-card-status-badge draft">
              {ICONS.EDIT} Draft
            </span>
          )}
          {completionPercentage > 0 && (
            <span className="verse-story-card-status-badge progress">
              {Math.round(completionPercentage)}%
            </span>
          )}
        </div>

        {/* Play overlay */}
        {clickable && (
          <div className="verse-story-card-play-overlay">
            <button 
              className="verse-story-card-play-button"
              onClick={handlePlayClick}
              aria-label={`Play ${story.title}`}
            >
              <span className="verse-story-card-play-icon">
                {ICONS.PLAY}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderStoryHeader = () => {
    return (
      <div className="verse-story-card-header">
        <h3 className="verse-story-card-title">
          {story.title}
        </h3>
        
        {showActions && (
          <div className="verse-story-card-actions">
            <button
              className="verse-story-card-favorite-button"
              onClick={handleFavoriteToggle}
              disabled={isLoading}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className={`verse-story-card-favorite-icon ${isFavorited ? 'favorited' : ''}`}>
                {isFavorited ? ICONS.HEART_FILLED : ICONS.HEART}
              </span>
            </button>

            <Dropdown
              trigger={
                <button 
                  className="verse-story-card-menu-button"
                  aria-label="Story actions"
                >
                  {ICONS.MORE_VERTICAL}
                </button>
              }
              isOpen={showActionsMenu}
              onToggle={handleActionsMenuToggle}
              items={[
                {
                  label: 'Share',
                  icon: ICONS.SHARE,
                  onClick: () => handleShare('link')
                },
                {
                  label: 'Edit',
                  icon: ICONS.EDIT,
                  onClick: () => onEdit?.(story)
                },
                {
                  label: 'Delete',
                  icon: ICONS.DELETE,
                  action: () => onDelete(story.id),
                  variant: 'danger'
                }
              ]}
              variant="mystical"
            />
          </div>
        )}
      </div>
    );
  };

  const renderStoryMeta = () => {
    return (
      <div className="verse-story-card-meta">
        {showAuthor && (
          <button 
            className="verse-story-card-author"
            onClick={handleAuthorClick}
          >
            <UserAvatar
              user={story.author}
              size="sm"
              showOnlineStatus={false}
            />
            <span className="verse-story-card-author-name">
              {story.author.name}
            </span>
            {story.author.isVerified && (
              <span className="verse-story-card-verified-badge">
                {ICONS.VERIFIED}
              </span>
            )}
          </button>
        )}

        <div className="verse-story-card-meta-info">
          <span className="verse-story-card-duration">
            {ICONS.CLOCK} {formatStoryDuration(story.estimatedDuration)}
          </span>
          
          <span 
            className="verse-story-card-difficulty"
            style={{ '--difficulty-color': difficultyInfo.color }}
          >
            {difficultyInfo.icon}
          </span>

          {/* <span className="verse-story-card-updated">
            {formatRelativeTime(story.updatedAt)}
          </span> */}
        </div>
      </div>
    );
  };

  const renderStoryContent = () => {
    return (
      <div className="verse-story-card-content">
        {cardConfig.showDescription && storyPreview && (
          <p className="verse-story-card-description">
            {storyPreview}
          </p>
        )}

        {cardConfig.showTags && story.tags?.length > 0 && (
          <div className="verse-story-card-tags">
            {story.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="verse-story-card-tag">
                #{tag}
              </span>
            ))}
            {story.tags.length > 3 && (
              <span className="verse-story-card-tag-more">
                +{story.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {cardConfig.showProgress && completionPercentage > 0 && (
          <div className="verse-story-card-progress">
            <div className="verse-story-card-progress-header">
              <span className="verse-story-card-progress-label">
                Progress
              </span>
              <span className="verse-story-card-progress-percentage">
                {Math.round(completionPercentage)}%
              </span>
            </div>
            <div className="verse-story-card-progress-bar">
              <div 
                className="verse-story-card-progress-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {cardConfig.showLastPlayed && story.progress?.lastPlayedAt && (
          <div className="verse-story-card-last-played">
            <span className="verse-story-card-last-played-label">
              Last played: 
            </span>
            <span className="verse-story-card-last-played-time">
              {formatRelativeTime(story.progress.lastPlayedAt)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderStoryStats = () => {
    if (!cardConfig.showStats) return null;

    return (
      <div className="verse-story-card-stats">
        <div className="verse-story-card-stat">
          <span className="verse-story-card-stat-icon">
            {ICONS.EYE}
          </span>
          <span className="verse-story-card-stat-value">
            {story.views || 0}
          </span>
        </div>

        <div className="verse-story-card-stat">
          <span className="verse-story-card-stat-icon">
            {ICONS.PLAY}
          </span>
          <span className="verse-story-card-stat-value">
            {story.plays || 0}
          </span>
        </div>

        <div className="verse-story-card-stat">
          <span className="verse-story-card-stat-icon">
            {ICONS.HEART}
          </span>
          <span className="verse-story-card-stat-value">
            {favoriteCount}
          </span>
        </div>

        {story.rating?.average > 0 && (
          <div className="verse-story-card-stat">
            <span className="verse-story-card-stat-icon">
              {ICONS.STAR}
            </span>
            <span className="verse-story-card-stat-value">
              {story.rating.average.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderStoryActions = () => {
    if (!showActions) return null;

    return (
      <div className="verse-story-card-footer">
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAction(story);
          }}
          className="verse-story-card-play-action"
          icon={completionPercentage > 0 ? ICONS.PLAY : ICONS.START}
        >
          {completionPercentage > 0 ? 'Continue' : 'Start Reading'}
        </Button>

        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit?.(story)}
            className="verse-story-card-edit-action"
            icon={ICONS.EDIT}
          >
            Edit
          </Button>
        )}
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!story) {
    return (
      <div className="verse-story-card-skeleton">
        <div className="verse-story-card-skeleton-thumbnail" />
        <div className="verse-story-card-skeleton-content">
          <div className="verse-story-card-skeleton-title" />
          <div className="verse-story-card-skeleton-meta" />
          <div className="verse-story-card-skeleton-description" />
        </div>
      </div>
    );
  }

  const cardClasses = [
    'verse-story-card',
    `variant-${variant}`,
    `theme-${theme}`,
    clickable && 'clickable',
    isLoading && 'loading',
    story.isFeatured && 'featured',
    completionPercentage > 0 && 'in-progress',
    className
  ].filter(Boolean).join(' ');

  return (
    <article 
      className={cardClasses}
      onClick={(e) => {
            e.stopPropagation();
            onAction(story);
          }}
      style={{ '--genre-color': genreTheme.color }}
      role={clickable ? 'button' : 'article'}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAction(story);
        }
      } : undefined}
      {...props}
    >
      {renderStoryThumbnail()}
      
      <div className="verse-story-card-body">
        {renderStoryHeader()}
        {renderStoryMeta()}
        {renderStoryContent()}
        {renderStoryStats()}
        {renderStoryActions()}
      </div>

      {/* Mystical glow effect */}
      <div className="verse-story-card-mystical-glow" />
    </article>
  );
};

export default MysticalStoryCard;