/**
 * VERSE Mystical Dashboard
 * Main storyteller portal with stories, progress, and mystical insights
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useMysticalAPI as useApi } from '../hooks/useApi.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useTheme } from '../hooks/useTheme.js';

// Layout Components
import Layout from '../components/layout/Layout.jsx';

// Common Components
import MysticalButton from '../components/common/Button.jsx';
import MysticalInput from '../components/common/Input.jsx';
import MysticalModal from '../components/common/Modal.jsx';
import StoryModal from './StoryModal.jsx';
import MysticalLoading from '../components/common/Loading.jsx';

// Story Components
import StoryCard from '../components/story/StoryCard.jsx';

// User Components
import UserAvatar from '../components/user/Avatar.jsx';

// Notification Components
import NotificationPanel from '../components/notifications/NotificationPanel.jsx';

// Utils and Constants
import { ROUTES, STORY_GENRES, STORY_TYPES, ICONS, API_ENDPOINTS } from '../utils/constants.js';
import { ErrorSpells, DeviceSpells, DateSpells } from '../utils/helpers.js';

// Styles
import './Dashboard.css';
import '../pages/StoryCreate.css';

// =============================================================================
// DASHBOARD STATE MANAGEMENT
// =============================================================================

const createDashboardState = () => ({
  // Data states
  stories: [],
  recentStories: [],
  favoriteStories: [],
  userProgress: null,
  userStats: null,
  
  // UI states
  activeView: 'overview', // overview, stories, progress, settings
  activeFilter: 'all', // all, reading, completed, drafts
  searchQuery: '',
  sortBy: 'lastModified', // lastModified, title, genre, progress
  sortOrder: 'desc',
  
  // Modal states
  showCreateStoryModal: false,
  showStoryDetailsModal: false,
  showProgressModal: false,
  showSettingsModal: false,
  selectedStory: null,
  
  // Loading states
  isLoadingStories: false,
  isLoadingProgress: false,
  isLoadingStats: false,
  isCreatingStory: false,
  
  // Error states
  storiesError: null,
  progressError: null,
  statsError: null,
  createStoryError: null
});

const createNewStoryForm = () => ({
  title: '',
  description: '',
  genre: '',
  storyType: 'interactive',
  isPrivate: false,
  tags: [],
  difficulty: 'medium',
  estimatedLength: 'medium'
});

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

const MysticalDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, logout, listStories, deleteStories, authState } = useAuth();
  const { callApi } = useApi();
  const { addNotification } = useNotifications();
  const { theme } = useTheme();

  // State management
  const [dashboardState, setDashboardState] = useState(createDashboardState);
  const [newStoryForm, setNewStoryForm] = useState(createNewStoryForm);
  const [deviceInfo, setDeviceInfo] = useState('laptop');
  const [showStoryPreview, setShowStoryPreview] = useState(false);

  const [storyProgression, setStoryProgression] = useState([]);

  // =============================================================================
  // DATA FETCHING METHODS
  // =============================================================================

  const fetchUserStories = useCallback(async () => {
  try {
    console.log('Starting story listing process...');
    setDashboardState(prev => ({ 
      ...prev, 
      isLoadingStories: true, 
      storiesError: null 
    }));

    const currentUserInfo = authState.user || user || { username: 'default', userId: 0 };
    console.log("User info for story listing:", currentUserInfo);
    
    const userListData = {
      filter: dashboardState.activeFilter,
      sort: dashboardState.sortBy,
      order: dashboardState.sortOrder,
      search: dashboardState.searchQuery || undefined,
      user_id: currentUserInfo.userId || currentUserInfo.user_id,
      user_name: currentUserInfo.username,
      timestamp: new Date().toISOString()
    };

    console.log('Prepared user list data for API:', userListData);

    const response = await listStories(userListData);
    console.log('Received response from story listing API:', response);

    if (response && response.data) {
      const storiesData = response.data;
      
      // Map the API response to dashboard format
      const mappedStories = storiesData ? storiesData.map(story => ({
        id: story.story_id,
        title: story.title,
        description: story.description,
        genre: story.genre,
        opening_scene: story.opening_scene,
        mood: story.mood,
        initial_conflict: story.initial_conflict,
        suggested_next_scenes: story.suggested_next_scenes || [],
        characters: story.characters || [],
        status: 'published', // Default status
        progress: 0, // Default progress
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        author: currentUserInfo?.username || 'You',
        tags: [], // Default empty tags
        estimatedReadingTime: '5 min' // Default reading time
      })) : [];

      setDashboardState(prev => ({
        ...prev,
        stories: mappedStories,
        recentStories: mappedStories.slice(0, 3), // Get first 3 as recent
        favoriteStories: [], // Will be implemented later
        isLoadingStories: false,
        storiesError: null
      }));

      const currentStoryProgression = storiesData ? storiesData.map(story => ({
        currentStoryId: story.story_id,
        isProgressing: false,
        nextSceneInput: '',
        progressionHistory: story.progressions?.length > 0 ? [{
          scene_content: story.progressions.map(p => p.scene_content).join('\n---\n'),
        }] : []
      })) : [];
      console.log('Setting story progression state:', currentStoryProgression);

      setStoryProgression(currentStoryProgression);

      console.log('Stories loaded successfully:', mappedStories);

      if (mappedStories.length > 0) {
        addNotification({
          type: 'success',
          title: 'Stories Loaded',
          message: `Successfully loaded ${mappedStories.length} mystical ${mappedStories.length === 1 ? 'story' : 'stories'}!`
        });
      }

    } else {
      // Handle API success but story listing failure
      const errorMessage = response.data?.error_message || response.message || 'Story listing failed for unknown reason';
      setDashboardState(prev => ({
        ...prev,
        stories: [],
        recentStories: [], // Get first 3 as recent
        favoriteStories: [], // Will be implemented later
        isLoadingStories: false,
        storiesError: errorMessage
      }));
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('❌ Story listing failed:', error);
    
    // Enhanced error handling
    let errorMessage = 'Failed to load stories. Please try again.';
    
    if (error.response?.data?.error_message) {
      errorMessage = error.response.data.error_message;
    } else if (error.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        errorMessage = error.response.data.detail
          .map(err => `${err.loc?.join('.')}: ${err.msg}`)
          .join(', ');
      } else {
        errorMessage = error.response.data.detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    setDashboardState(prev => ({
      ...prev,
      isLoadingStories: false,
      storiesError: errorMessage
    }));
    
    addNotification({
      type: 'error',
      title: 'Stories Loading Failed',
      message: errorMessage
    });
  }
}, []);

const deleteUserStories = async (story_id) => {
  try {
    console.log('Starting story deletion process...');
    setDashboardState(prev => ({ 
      ...prev, 
      isLoadingStories: true, 
      storiesError: null 
    }));

    const currentUserInfo = authState.user || user || { username: 'default', userId: 0 };
    console.log("User info for story deletion:", currentUserInfo);

    console.log('Prepared story data for API:', story_id);

    const response = await deleteStories(story_id);
    console.log('Received response from story deletion API:', response);

    await fetchUserStories(); // Refresh stories after deletion

  } catch (error) {
    console.error('❌ Story listing failed:', error);
    }
  
}

  const fetchUserProgress = useCallback(async () => {
    try {
      setDashboardState(prev => ({ 
        ...prev, 
        isLoadingProgress: true, 
        progressError: null 
      }));

      const response = await callApi(API_ENDPOINTS.PROGRESS.GET_USER_PROGRESS, {
        method: 'GET'
      });

      if (response.success) {
        setDashboardState(prev => ({
          ...prev,
          userProgress: response.data.progress || null,
          isLoadingProgress: false
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch progress');
      }

    } catch (error) {
      console.error('❌ Error fetching progress:', error);
      setDashboardState(prev => ({
        ...prev,
        isLoadingProgress: false,
        progressError: error.message || 'Failed to load progress'
      }));
    }
  }, [callApi]);

  const fetchUserStats = useCallback(async () => {
    try {
      setDashboardState(prev => ({ 
        ...prev, 
        isLoadingStats: true, 
        statsError: null 
      }));

      const response = await callApi(API_ENDPOINTS.PROGRESS.GET_USER_STATS, {
        method: 'GET'
      });

      if (response.success) {
        setDashboardState(prev => ({
          ...prev,
          userStats: response.data.stats || null,
          isLoadingStats: false
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch stats');
      }

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setDashboardState(prev => ({
        ...prev,
        isLoadingStats: false,
        statsError: error.message || 'Failed to load stats'
      }));
    }
  }, [callApi]);

  // =============================================================================
  // STORY MANAGEMENT METHODS
  // =============================================================================

  const handleCreateStory = useCallback(async (e) => {
    e.preventDefault();

    // Validation
    if (!newStoryForm.title.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Story title is required'
      });
      return;
    }

    if (!newStoryForm.genre) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a genre for your story'
      });
      return;
    }

    try {
      setDashboardState(prev => ({ 
        ...prev, 
        isCreatingStory: true, 
        createStoryError: null 
      }));

      const storyData = {
        title: newStoryForm.title.trim(),
        description: newStoryForm.description.trim(),
        genre: newStoryForm.genre,
        storyType: newStoryForm.storyType,
        isPrivate: newStoryForm.isPrivate,
        tags: newStoryForm.tags.filter(tag => tag.trim()),
        difficulty: newStoryForm.difficulty,
        estimatedLength: newStoryForm.estimatedLength
      };

      const response = await callApi(API_ENDPOINTS.STORIES.CREATE, {
        method: 'POST',
        data: storyData
      });

      if (response.success) {
        setDashboardState(prev => ({
          ...prev,
          isCreatingStory: false,
          showCreateStoryModal: false
        }));

        setNewStoryForm(createNewStoryForm());

        addNotification({
          type: 'success',
          title: 'Story Created',
          message: `"${storyData.title}" has been added to your mystical collection!`
        });

        // Refresh stories list
        await fetchUserStories();

        // Navigate to the new story
        if (response.data.story?.id) {
          navigate(`${ROUTES.STORY}/${response.data.story.id}`);
        }

      } else {
        throw new Error(response.message || 'Failed to create story');
      }

    } catch (error) {
      console.error('❌ Error creating story:', error);
      setDashboardState(prev => ({
        ...prev,
        isCreatingStory: false,
        createStoryError: error.message || 'Failed to create story'
      }));
      
      addNotification({
        type: 'error',
        title: 'Story Creation Failed',
        message: 'Unable to create your story. Please try again.'
      });
    }
  }, [newStoryForm, callApi, addNotification, fetchUserStories, navigate]);

  const handleStoryAction = useCallback(async (storyId, action) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let successMessage = '';

      switch (action) {
        case 'continue':
          navigate(`${ROUTES.STORY}/${storyId}`);
          return;
        case 'favorite':
          endpoint = API_ENDPOINTS.STORIES.FAVORITE.replace(':id', storyId);
          successMessage = 'Added to favorites';
          break;
        case 'unfavorite':
          endpoint = API_ENDPOINTS.STORIES.UNFAVORITE.replace(':id', storyId);
          successMessage = 'Removed from favorites';
          break;
        case 'delete':
          endpoint = API_ENDPOINTS.STORIES.DELETE.replace(':id', storyId);
          method = 'DELETE';
          successMessage = 'Story deleted';
          break;
        default:
          throw new Error('Unknown action');
      }

      // const response = await callApi(endpoint, { method });
      const response = {}

      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Action Completed',
          message: successMessage
        });

        // await fetchUserStories();
      } else {
        throw new Error(response.message || 'Action failed');
      }

    } catch (error) {
      console.error(`❌ Error performing ${action}:`, error);
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: `Unable to ${action} story. Please try again.`
      });
    }
  }, [callApi, addNotification, fetchUserStories, navigate]);

  // =============================================================================
  // UI EVENT HANDLERS
  // =============================================================================

  const handleViewChange = useCallback((view) => {
  console.log('Changing dashboard view to:', view);
  
  setDashboardState(prev => ({ ...prev, activeView: view }));
  setSearchParams(params => {
    params.set('view', view);
    return params;
  });

  // Fetch stories when "stories" view is selected
  if (view === 'stories') {
    console.log('Stories view selected, fetching user stories...');
    fetchUserStories();
  }
}, [setSearchParams, fetchUserStories]);

  const handleFilterChange = useCallback((filter) => {
    setDashboardState(prev => ({ ...prev, activeFilter: filter }));
    setSearchParams(params => {
      params.set('filter', filter);
      return params;
    });
  }, [setSearchParams]);

  const handleSearchChange = useCallback((query) => {
    setDashboardState(prev => ({ ...prev, searchQuery: query }));
    if (query) {
      setSearchParams(params => {
        params.set('search', query);
        return params;
      });
    } else {
      setSearchParams(params => {
        params.delete('search');
        return params;
      });
    }
  }, [setSearchParams]);

  const handleSortChange = useCallback((sortBy, sortOrder = 'desc') => {
    setDashboardState(prev => ({ 
      ...prev, 
      sortBy, 
      sortOrder 
    }));
    setSearchParams(params => {
      params.set('sort', sortBy);
      params.set('order', sortOrder);
      return params;
    });
  }, [setSearchParams]);

  const handleNewStoryFormChange = useCallback((field, value) => {
    setNewStoryForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const computedValues = useMemo(() => {
    const filteredStories = dashboardState.stories.filter(story => {
      // Apply filter
      switch (dashboardState.activeFilter) {
        case 'reading':
          return story.status === 'in_progress';
        case 'completed':
          return story.status === 'completed';
        case 'drafts':
          return story.status === 'draft';
        default:
          return true;
      }
    }).filter(story => {
      // Apply search
      if (!dashboardState.searchQuery) return true;
      const query = dashboardState.searchQuery.toLowerCase();
      return story.title.toLowerCase().includes(query) ||
             story.description?.toLowerCase().includes(query) ||
             story.genre?.toLowerCase().includes(query) ||
             story.tags?.some(tag => tag.toLowerCase().includes(query));
    });

    const isLoading = dashboardState.isLoadingStories || 
                     dashboardState.isLoadingProgress || 
                     dashboardState.isLoadingStats;

    const hasError = dashboardState.storiesError || 
                    dashboardState.progressError || 
                    dashboardState.statsError;

    return {
      filteredStories,
      isLoading,
      hasError,
      isMobile: deviceInfo.isMobile,
      isTablet: deviceInfo.isTablet,
      hasStories: dashboardState.stories.length > 0,
      hasRecentStories: dashboardState.recentStories.length > 0,
      hasFavoriteStories: dashboardState.favoriteStories.length > 0
    };
  }, [dashboardState, deviceInfo]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize from URL params
  useEffect(() => {
    const view = searchParams.get('view') || 'overview';
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'lastModified';
    const order = searchParams.get('order') || 'desc';

    setDashboardState(prev => ({
      ...prev,
      activeView: view,
      activeFilter: filter,
      searchQuery: search,
      sortBy: sort,
      sortOrder: order
    }));
  }, [searchParams]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (isAuthenticated || authState.isAuthenticated) {
      fetchUserStories();
      fetchUserProgress();
      fetchUserStats();
    }
  }, []);

  // Device info updates
  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo('laptop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================================================
  // RENDER METHODS
  // =============================================================================

  const renderDashboardHeader = () => (
    <div className="verse-dashboard-header">
      <div className="verse-dashboard-header-content">
        <div className="verse-dashboard-welcome">
          <UserAvatar 
            user={authState.user} 
            size="lg" 
            showOnlineStatus={true}
          />
          <div className="verse-dashboard-welcome-text">
            <h1 className="verse-dashboard-title">
              Welcome back, {authState.user?.firstName || authState.user?.username}
            </h1>
            <p className="verse-dashboard-subtitle">
              Ready to continue your mystical storytelling journey?
            </p>
          </div>
        </div>

        <div className="verse-dashboard-header-actions">
          <MysticalButton
            variant="primary"
            size="md"
            icon={ICONS.PLUS}
            onClick={() => navigate('/stories')}
            disabled={computedValues.isLoading}
          >
            Create Story
          </MysticalButton>
        </div>
      </div>
    </div>
  );

  const renderNavigationTabs = () => (
    <div className="verse-dashboard-navigation">
      <div className="verse-dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: ICONS.HOME },
          { id: 'stories', label: 'My Stories', icon: ICONS.BOOK },
          // { id: 'progress', label: 'Progress', icon: ICONS.CHART },
          // { id: 'settings', label: 'Settings', icon: ICONS.SETTINGS }
        ].map(tab => (
          <button
            key={tab.id}
            className={`verse-dashboard-tab ${
              dashboardState.activeView === tab.id ? 'active' : ''
            }`}
            onClick={() => handleViewChange(tab.id)}
          >
            <span className="verse-dashboard-tab-icon">{tab.icon}</span>
            <span className="verse-dashboard-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStoryFilters = () => (
    <div className="verse-dashboard-filters">
      <div className="verse-dashboard-filter-group">
        <label className="verse-dashboard-filter-label">Filter:</label>
        <div className="verse-dashboard-filter-buttons">
          {[
            { id: 'all', label: 'All Stories' },
            { id: 'reading', label: 'Reading' },
            { id: 'completed', label: 'Completed' },
            { id: 'drafts', label: 'Drafts' }
          ].map(filter => (
            <button
              key={filter.id}
              className={`verse-dashboard-filter-button ${
                dashboardState.activeFilter === filter.id ? 'active' : ''
              }`}
              onClick={() => handleFilterChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="verse-dashboard-search-sort">
        <MysticalInput
          type="search"
          placeholder="Search your stories..."
          value={dashboardState.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          icon={ICONS.SEARCH}
          variant="mystical"
          size="sm"
        />

        <select
          className="verse-dashboard-sort-select"
          value={`${dashboardState.sortBy}_${dashboardState.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('_');
            handleSortChange(sortBy, sortOrder);
          }}
        >
          <option value="lastModified_desc">Recently Modified</option>
          <option value="title_asc">Title A-Z</option>
          <option value="title_desc">Title Z-A</option>
          <option value="genre_asc">Genre</option>
          <option value="progress_desc">Progress</option>
          <option value="createdAt_desc">Newest First</option>
          <option value="createdAt_asc">Oldest First</option>
        </select>
      </div>
    </div>
  );

  // Update the StoryCard props handling to work with the mapped story format
// In the renderStoryGrid function (around line 600), make sure StoryCard receives proper data:

const renderStoryGrid = () => {
  if (computedValues.isLoading) {
    return (
      <div className="verse-dashboard-loading">
        <MysticalLoading 
          size="lg" 
          message="Loading your mystical stories..." 
        />
      </div>
    );
  }

  if (dashboardState.storiesError) {
    return (
      <div className="verse-dashboard-error">
        <div className="verse-dashboard-error-content">
          <span className="verse-dashboard-error-icon">{ICONS.WARNING}</span>
          <h3 className="verse-dashboard-error-title">Loading Error</h3>
          <p className="verse-dashboard-error-message">
            {dashboardState.storiesError || 'Failed to load stories'}
          </p>
          <MysticalButton
            variant="secondary"
            size="sm"
            onClick={fetchUserStories}
          >
            Try Again
          </MysticalButton>
        </div>
      </div>
    );
  }

  if (dashboardState.stories.length === 0) {
    return (
      <div className="verse-dashboard-empty">
        <div className="verse-dashboard-empty-content">
          <span className="verse-dashboard-empty-icon">{ICONS.BOOK}</span>
          <h3 className="verse-dashboard-empty-title">No Stories Yet</h3>
          <p className="verse-dashboard-empty-message">
            Begin your mystical storytelling journey by creating your first story.
          </p>
          <MysticalButton
            variant="primary"
            size="md"
            icon={ICONS.PLUS}
            onClick={() => navigate('/stories')}
          >
            Create Your First Story
          </MysticalButton>
        </div>
      </div>
    );
  }

  if (computedValues.filteredStories.length === 0) {
    return (
      <div className="verse-dashboard-no-results">
        <div className="verse-dashboard-no-results-content">
          <span className="verse-dashboard-no-results-icon">{ICONS.SEARCH}</span>
          <h3 className="verse-dashboard-no-results-title">No Stories Found</h3>
          <p className="verse-dashboard-no-results-message">
            Try adjusting your filters or search terms.
          </p>
          <MysticalButton
            variant="ghost"
            size="sm"
            onClick={() => {
              handleFilterChange('all');
              handleSearchChange('');
            }}
          >
            Clear Filters
          </MysticalButton>
        </div>
      </div>
    );
  }

  return (
    <div className="verse-dashboard-story-grid">
      {computedValues.filteredStories.map(story => (
        <StoryCard
          key={story.id}
          story={{
            id: story.id,
            title: story.title,
            description: story.description,
            genre: story.genre,
            author: story.author,
            createdAt: story.createdAt,
            lastModified: story.lastModified,
            status: story.status,
            progress: story.progress,
            tags: story.tags,
            estimatedReadingTime: story.estimatedReadingTime,
            opening_scene: story.opening_scene,
            mood: story.mood,
            initial_conflict: story.initial_conflict,
            suggested_next_scenes: story.suggested_next_scenes,
            characters: story.characters
          }}
          onAction={(storyLocal) => {
                    // Show story details modal
                    setDashboardState(prev => ({
                      ...prev,
                      selectedStory: storyLocal
                    }));
                    setShowStoryPreview(true);
                  }}
          showProgress={true}
          showActions={true}
          variant="dashboard"
          onDelete={(storyId) => deleteUserStories(storyId)}
        />
      ))}
    </div>
  );
};

const renderStoryPreviewModal = async () => {
  const storyData = dashboardState.selectedStory || {};
  // console.log('Opening story preview modal for story:', storyData);

  const setStoryData = (data) => {
    storyData = { ...storyData, ...data };
    setDashboardState((prev) => ({
      ...prev,
      selectedStory: {
        ...prev.selectedStory,
        ...data,
      },
    }));
  };

  return (
    <StoryModal
      showStoryPreview={showStoryPreview}
      setShowStoryPreview={setShowStoryPreview}
      storyData={storyData}
      setStoryData={setStoryData}
      addNotification={addNotification}
    />
  )

};

  // Update the renderOverviewView function to show recent stories nicely (around line 700):
const renderOverviewView = () => (
  <div className="verse-dashboard-overview">
    {/* Quick Stats */}
    <div className="verse-dashboard-stats">
      <div className="verse-dashboard-stat-card">
        <div className="verse-dashboard-stat-icon">{ICONS.BOOK}</div>
        <div className="verse-dashboard-stat-content">
          <div className="verse-dashboard-stat-number">
            {dashboardState.stories?.length || 0}
          </div>
          <div className="verse-dashboard-stat-label">Total Stories</div>
        </div>
      </div>

      <div className="verse-dashboard-stat-card">
        <div className="verse-dashboard-stat-icon">{ICONS.CHART}</div>
        <div className="verse-dashboard-stat-content">
          <div className="verse-dashboard-stat-number">
            {dashboardState.stories?.filter(s => s.status === 'completed').length || 0}
          </div>
          <div className="verse-dashboard-stat-label">Completed</div>
        </div>
      </div>

      <div className="verse-dashboard-stat-card">
        <div className="verse-dashboard-stat-icon">{ICONS.CLOCK}</div>
        <div className="verse-dashboard-stat-content">
          <div className="verse-dashboard-stat-number">
            {dashboardState.userStats?.readingTime || '0h'}
          </div>
          <div className="verse-dashboard-stat-label">Reading Time</div>
        </div>
      </div>

      <div className="verse-dashboard-stat-card">
        <div className="verse-dashboard-stat-icon">{ICONS.STAR}</div>
        <div className="verse-dashboard-stat-content">
          <div className="verse-dashboard-stat-number">
            {dashboardState.favoriteStories?.length || 0}
          </div>
          <div className="verse-dashboard-stat-label">Favorites</div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="verse-dashboard-quick-actions">
      <MysticalButton
        variant="primary"
        size="lg"
        icon={ICONS.PLUS}
        onClick={() => navigate('/stories')}
        className="verse-quick-action-primary"
      >
        Create New Story
      </MysticalButton>
      
      <MysticalButton
        variant="secondary"
        size="lg"
        icon={ICONS.BOOK}
        onClick={() => handleViewChange('stories')}
        className="verse-quick-action-secondary"
      >
        View All Stories ({dashboardState.stories?.length || 0})
      </MysticalButton>
    </div>

    {/* Recent Stories */}
    {computedValues.hasRecentStories && (
      <div className="verse-dashboard-section">
        <div className="verse-dashboard-section-header">
          <h2 className="verse-dashboard-section-title">
            <span className="verse-section-icon">📖</span>
            Recent Stories
          </h2>
          <MysticalButton
            variant="ghost"
            size="sm"
            onClick={() => handleViewChange('stories')}
          >
            View All
          </MysticalButton>
        </div>
        <div className="verse-dashboard-recent-stories">
          {dashboardState.recentStories.slice(0, 3).map(story => (
            <div key={story.id} className="verse-recent-story-card">
              <div className="verse-recent-story-header">
                <h4 className="verse-recent-story-title">{story.title}</h4>
                <span className="verse-recent-story-genre">{story.genre.toUpperCase()}</span>
              </div>
              <p className="verse-recent-story-description">
                {story.opening_scene?.substring(0, 120)}
                {story.opening_scene?.length > 120 ? '...' : ''}
              </p>
              <div className="verse-recent-story-meta">
                <span className="verse-recent-story-mood">
                  <span className="verse-mood-icon">🌙</span>
                  {story.mood}
                </span>
                <span className="verse-recent-story-characters">
                  <span className="verse-characters-icon">👥 </span>
                  {story.characters?.length || 0} characters
                </span>
              </div>
              <div className="verse-recent-story-actions">
                <MysticalButton
                  variant="primary"
                  size="sm"
                  // onClick={() => handleStoryAction(story.id, 'continue')}
                  onClick={(e) => {
                    // Show story details modal
                    e.preventDefault();
                    setDashboardState(prev => ({
                      ...prev,
                      selectedStory: story
                    }));
                    setShowStoryPreview(true);
                  }}
                >
                  Continue Reading
                </MysticalButton>
                {/* <MysticalButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Show story details modal
                    setDashboardState(prev => ({
                      ...prev,
                      selectedStory: story,
                      showStoryDetailsModal: true
                    }));
                  }}
                >
                  Details
                </MysticalButton> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* No Stories Message */}
    {!computedValues.hasStories && !computedValues.isLoading && (
      <div className="verse-dashboard-empty-overview">
        <div className="verse-dashboard-empty-content">
          <span className="verse-dashboard-empty-icon">📚</span>
          <h3 className="verse-dashboard-empty-title">Welcome to Your Story Dashboard!</h3>
          <p className="verse-dashboard-empty-message">
            You haven't created any stories yet. Start your mystical storytelling journey today!
          </p>
          <MysticalButton
            variant="primary"
            size="lg"
            icon={ICONS.PLUS}
            onClick={() => navigate('/stories')}
          >
            Create Your First Story
          </MysticalButton>
        </div>
      </div>
    )}
  </div>
);

  const renderStoriesView = () => (
    <div className="verse-dashboard-stories">
      {renderStoryFilters()}
      {renderStoryGrid()}
    </div>
  );

  const renderProgressView = () => (
    <div className="verse-dashboard-progress">
      <div className="verse-dashboard-progress-header">
        <h2 className="verse-dashboard-progress-title">Your Progress</h2>
        <p className="verse-dashboard-progress-subtitle">
          Track your mystical storytelling journey
        </p>
      </div>

      {dashboardState.isLoadingProgress ? (
        <MysticalLoading size="md" message="Loading progress data..." />
      ) : dashboardState.progressError ? (
        <div className="verse-dashboard-error">
          <span className="verse-dashboard-error-icon">{ICONS.WARNING}</span>
          <p className="verse-dashboard-error-message">
            {dashboardState.progressError}
          </p>
          <MysticalButton
            variant="secondary"
            size="sm"
            onClick={fetchUserProgress}
          >
            Retry
          </MysticalButton>
        </div>
      ) : (
        <div className="verse-dashboard-progress-content">
          {/* Progress charts and details would go here */}
          <div className="verse-dashboard-progress-placeholder">
            <span className="verse-dashboard-progress-placeholder-icon">{ICONS.CHART}</span>
            <p>Progress tracking feature coming soon!</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsView = () => (
    <div className="verse-dashboard-settings">
      <div className="verse-dashboard-settings-header">
        <h2 className="verse-dashboard-settings-title">Settings</h2>
        <p className="verse-dashboard-settings-subtitle">
          Customize your mystical experience
        </p>
      </div>

      <div className="verse-dashboard-settings-content">
        <div className="verse-dashboard-settings-placeholder">
          <span className="verse-dashboard-settings-placeholder-icon">{ICONS.SETTINGS}</span>
          <p>Settings panel coming soon!</p>
        </div>
      </div>
    </div>
  );

  // Add this function after the renderCreateStoryModal function (around line 1000):
const renderStoryDetailsModal = () => (
  <MysticalModal
    isOpen={dashboardState.showStoryDetailsModal}
    onClose={() => setDashboardState(prev => ({ 
      ...prev, 
      showStoryDetailsModal: false,
      selectedStory: null
    }))}
    title="Story Details"
    size="lg"
  >
    {dashboardState.selectedStory && (
      <div className="verse-story-details-content">
        <div className="verse-story-details-header">
          <h3 className="verse-story-details-title">
            {dashboardState.selectedStory.title}
          </h3>
          <div className="verse-story-details-meta">
            <span className="verse-story-genre">
              <span className="verse-genre-icon">🏷️</span>
              {dashboardState.selectedStory.genre}
            </span>
            <span className="verse-story-mood">
              <span className="verse-mood-icon">🌙</span>
              {dashboardState.selectedStory.mood}
            </span>
          </div>
        </div>

        <div className="verse-story-details-body">
          <div className="verse-story-section">
            <h4 className="verse-section-title">Description</h4>
            <p className="verse-section-content">
              {dashboardState.selectedStory.description}
            </p>
          </div>

          <div className="verse-story-section">
            <h4 className="verse-section-title">Opening Scene</h4>
            <p className="verse-section-content">
              {dashboardState.selectedStory.opening_scene}
            </p>
          </div>

          <div className="verse-story-section">
            <h4 className="verse-section-title">Initial Conflict</h4>
            <p className="verse-section-content">
              {dashboardState.selectedStory.initial_conflict}
            </p>
          </div>

          {dashboardState.selectedStory.characters && dashboardState.selectedStory.characters.length > 0 && (
            <div className="verse-story-section">
              <h4 className="verse-section-title">Characters</h4>
              <div className="verse-characters-list">
                {dashboardState.selectedStory.characters.map((character, index) => (
                  <div key={character.id || index} className="verse-character-item">
                    <h5 className="verse-character-name">{character.name}</h5>
                    <p className="verse-character-description">{character.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboardState.selectedStory.suggested_next_scenes && dashboardState.selectedStory.suggested_next_scenes.length > 0 && (
            <div className="verse-story-section">
              <h4 className="verse-section-title">Story Paths</h4>
              <div className="verse-suggested-scenes">
                {dashboardState.selectedStory.suggested_next_scenes.map((scene, index) => (
                  <div key={index} className="verse-suggested-scene">
                    <span className="verse-scene-number">{index + 1}.</span>
                    <span className="verse-scene-text">{scene}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="verse-story-details-actions">
          <MysticalButton
            variant="primary"
            size="md"
            onClick={() => {
              handleStoryAction(dashboardState.selectedStory.id, 'continue');
              setDashboardState(prev => ({ 
                ...prev, 
                showStoryDetailsModal: false,
                selectedStory: null
              }));
            }}
          >
            <span className="verse-btn-icon">📚</span>
            Continue Reading
          </MysticalButton>
          
          <MysticalButton
            variant="secondary"
            size="md"
            onClick={() => setDashboardState(prev => ({ 
              ...prev, 
              showStoryDetailsModal: false,
              selectedStory: null
            }))}
          >
            Close
          </MysticalButton>
        </div>
      </div>
    )}
  </MysticalModal>
);

const setStoryProgressionCompleted = (progressionValue) => {
  console.log(storyProgression)
    let prevValue = storyProgression.find(sp => sp.currentStoryId === dashboardState.selectedStory?.id);
    console.log('Setting story progression completed. Previous value:', prevValue);
    if(prevValue){
      prevValue = { ...prevValue, ...progressionValue };
      console.log('Updated progression value:', prevValue);
      setStoryProgression(prev => prev.map(sp => sp.currentStoryId === dashboardState.selectedStory?.id ? prevValue : sp));
    }
    
};

// Add the modal to the main render function (around line 1200):
// In the return statement, add this after renderCreateStoryModal():
{renderStoryDetailsModal()}

  const renderActiveView = () => {
    switch (dashboardState.activeView) {
      case 'stories':
        return renderStoriesView();
      case 'progress':
        return renderProgressView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderOverviewView();
    }
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!isAuthenticated && !authState.isAuthenticated) {
    return (
      <div className="verse-dashboard-unauthorized">
        <MysticalLoading size="lg" message="Redirecting to login..." />
      </div>
    );
  }

  return (
    <Layout>
      <div className="verse-dashboard">
        {renderDashboardHeader()}
        {renderNavigationTabs()}
        
        <div className="verse-dashboard-content">
          {renderActiveView()}
        </div>

        {/* {renderCreateStoryModal()} */}
        {renderStoryDetailsModal()}
        {/* {showStoryPreview && renderStoryPreviewModal()} */}
        {showStoryPreview && (
          <StoryModal
            showStoryPreview={showStoryPreview}
            setShowStoryPreview={setShowStoryPreview}
            storyData={{
              generatedStory: {
                ...dashboardState.selectedStory,
                story_id: dashboardState.selectedStory?.id,
                created_at: dashboardState.selectedStory?.createdAt || new Date().toISOString(),
                session_id: dashboardState.selectedStory?.session_id || 'dashboard-session'
              }
            }}
            setStoryProgression={setStoryProgressionCompleted}
            storyProgression={storyProgression.find(sp => sp.currentStoryId === dashboardState.selectedStory?.id) || {}}
            setStoryData={(newData) => {
              if (typeof newData === 'function') {
                setDashboardState(prev => ({
                  ...prev,
                  selectedStory: {
                    ...prev.selectedStory,
                    ...newData(prev.selectedStory)
                  }
                }));
              } else {
                setDashboardState(prev => ({
                  ...prev,
                  selectedStory: {
                    ...prev.selectedStory,
                    ...newData.generatedStory
                  }
                }));
              }
            }}
            addNotification={addNotification}
          />
        )}
      </div>
    </Layout>
  );
};

export default MysticalDashboard;