/**
 * VERSE Story API Service
 * Comprehensive story management and API integration
 */

import { apiCall, handleApiError } from './api.js';
import { API_ENDPOINTS } from '../utils/constants.js';

// =============================================================================
// STORY API ENDPOINTS
// =============================================================================

const STORY_ENDPOINTS = {
  // Story CRUD operations
  getAllStories: '/stories',
  getStory: (id) => `/stories/${id}`,
  createStory: '/stories',
  updateStory: (id) => `/stories/${id}`,
  deleteStory: (id) => `/stories/${id}`,
  
  // Story interaction
  playStory: (id) => `/stories/${id}/play`,
  getStoryProgress: (id) => `/stories/${id}/progress`,
  saveStoryProgress: (id) => `/stories/${id}/progress`,
  resetStoryProgress: (id) => `/stories/${id}/progress/reset`,
  
  // Story discovery
  searchStories: '/stories/search',
  getStoriesByGenre: (genre) => `/stories/genre/${genre}`,
  getTrendingStories: '/stories/trending',
  getFeaturedStories: '/stories/featured',
  getRecentStories: '/stories/recent',
  
  // User story management
  getUserStories: (userId) => `/users/${userId}/stories`,
  getMyStories: '/stories/mine',
  getLibraryStories: '/stories/library',
  getFavoriteStories: '/stories/favorites',
  
  // Story interactions
  rateStory: (id) => `/stories/${id}/rate`,
  favoriteStory: (id) => `/stories/${id}/favorite`,
  shareStory: (id) => `/stories/${id}/share`,
  reportStory: (id) => `/stories/${id}/report`,
  
  // Story analytics
  getStoryStats: (id) => `/stories/${id}/stats`,
  getStoryAnalytics: (id) => `/stories/${id}/analytics`,
  
  // Story collaboration
  getStoryCollaborators: (id) => `/stories/${id}/collaborators`,
  addCollaborator: (id) => `/stories/${id}/collaborators`,
  removeCollaborator: (id, userId) => `/stories/${id}/collaborators/${userId}`,
  
  // Story versions
  getStoryVersions: (id) => `/stories/${id}/versions`,
  createStoryVersion: (id) => `/stories/${id}/versions`,
  publishStory: (id) => `/stories/${id}/publish`,
  unpublishStory: (id) => `/stories/${id}/unpublish`,
  
  // Story comments and reviews
  getStoryComments: (id) => `/stories/${id}/comments`,
  addStoryComment: (id) => `/stories/${id}/comments`,
  getStoryReviews: (id) => `/stories/${id}/reviews`,
  addStoryReview: (id) => `/stories/${id}/reviews`
};

// =============================================================================
// STORY DATA TRANSFORMATION
// =============================================================================

const transformStoryData = (rawStory) => {
  if (!rawStory) return null;

  return {
    id: rawStory.id || rawStory._id,
    title: rawStory.title || 'Untitled Story',
    description: rawStory.description || '',
    content: rawStory.content || rawStory.scenes || [],
    
    // Metadata
    author: {
      id: rawStory.author?.id || rawStory.authorId,
      name: rawStory.author?.name || rawStory.authorName || 'Unknown Author',
      avatar: rawStory.author?.avatar || rawStory.authorAvatar,
      isVerified: rawStory.author?.isVerified || false
    },
    
    // Story properties
    genre: rawStory.genre || 'Adventure',
    tags: Array.isArray(rawStory.tags) ? rawStory.tags : [],
    difficulty: rawStory.difficulty || 'medium',
    estimatedDuration: rawStory.estimatedDuration || rawStory.duration || 30,
    
    // Status and visibility
    status: rawStory.status || 'draft', // draft, published, archived
    visibility: rawStory.visibility || 'private', // private, public, unlisted
    isPublished: rawStory.isPublished || rawStory.status === 'published',
    isFeatured: rawStory.isFeatured || false,
    
    // Stats
    views: rawStory.views || rawStory.viewCount || 0,
    plays: rawStory.plays || rawStory.playCount || 0,
    likes: rawStory.likes || rawStory.likeCount || 0,
    favorites: rawStory.favorites || rawStory.favoriteCount || 0,
    rating: {
      average: rawStory.rating?.average || rawStory.averageRating || 0,
      count: rawStory.rating?.count || rawStory.ratingCount || 0,
      distribution: rawStory.rating?.distribution || {}
    },
    
    // User interaction flags
    isLiked: rawStory.isLiked || false,
    isFavorited: rawStory.isFavorited || false,
    userRating: rawStory.userRating || null,
    
    // Progress tracking
    progress: {
      currentScene: rawStory.progress?.currentScene || 0,
      completionPercentage: rawStory.progress?.completionPercentage || 0,
      lastPlayedAt: rawStory.progress?.lastPlayedAt ? new Date(rawStory.progress.lastPlayedAt) : null,
      isCompleted: rawStory.progress?.isCompleted || false,
      playTime: rawStory.progress?.playTime || 0
    },
    
    // Timestamps
    createdAt: rawStory.createdAt ? new Date(rawStory.createdAt) : new Date(),
    updatedAt: rawStory.updatedAt ? new Date(rawStory.updatedAt) : new Date(),
    publishedAt: rawStory.publishedAt ? new Date(rawStory.publishedAt) : null,
    
    // Additional metadata
    thumbnail: rawStory.thumbnail || rawStory.coverImage || null,
    language: rawStory.language || 'en',
    ageRating: rawStory.ageRating || 'general',
    contentWarnings: Array.isArray(rawStory.contentWarnings) ? rawStory.contentWarnings : [],
    
    // Collaboration
    collaborators: Array.isArray(rawStory.collaborators) ? rawStory.collaborators : [],
    isCollaborative: rawStory.isCollaborative || false,
    
    // Version control
    version: rawStory.version || '1.0.0',
    hasUnpublishedChanges: rawStory.hasUnpublishedChanges || false
  };
};

// =============================================================================
// STORY COLLECTION MANAGEMENT
// =============================================================================

/**
 * Get all stories with filtering and pagination
 */
export const getAllStories = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre = null,
      sortBy = 'recent',
      search = '',
      tags = [],
      difficulty = null,
      minRating = null,
      authorId = null,
      featured = null
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy
    });

    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    if (difficulty) params.append('difficulty', difficulty);
    if (minRating) params.append('minRating', minRating.toString());
    if (authorId) params.append('authorId', authorId);
    if (featured !== null) params.append('featured', featured.toString());
    
    tags.forEach(tag => params.append('tags', tag));

    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getAllStories}?${params.toString()}`,
      method: 'GET'
    });

    return {
      stories: response.data.stories?.map(transformStoryData) || [],
      pagination: {
        currentPage: response.data.currentPage || page,
        totalPages: response.data.totalPages || 1,
        totalCount: response.data.totalCount || 0,
        hasNext: response.data.hasNext || false,
        hasPrev: response.data.hasPrev || false
      },
      filters: response.data.filters || {}
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch stories');
  }
};

/**
 * Search stories with advanced filtering
 */
export const searchStories = async (query, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      filters = {}
    } = options;

    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.searchStories,
      method: 'POST',
      data: {
        query,
        page,
        limit,
        sortBy,
        filters
      }
    });

    return {
      stories: response.data.stories?.map(transformStoryData) || [],
      suggestions: response.data.suggestions || [],
      facets: response.data.facets || {},
      pagination: response.data.pagination || {}
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to search stories');
  }
};

/**
 * Get trending stories
 */
export const getTrendingStories = async (timeframe = 'week', limit = 10) => {
  try {
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getTrendingStories}?timeframe=${timeframe}&limit=${limit}`,
      method: 'GET'
    });

    return response.data.stories?.map(transformStoryData) || [];
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch trending stories');
  }
};

/**
 * Get featured stories
 */
export const getFeaturedStories = async (limit = 6) => {
  try {
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getFeaturedStories}?limit=${limit}`,
      method: 'GET'
    });

    return response.data.stories?.map(transformStoryData) || [];
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch featured stories');
  }
};

/**
 * Get stories by genre
 */
export const getStoriesByGenre = async (genre, options = {}) => {
  try {
    const { page = 1, limit = 20, sortBy = 'popular' } = options;
    
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getStoriesByGenre(genre)}?page=${page}&limit=${limit}&sortBy=${sortBy}`,
      method: 'GET'
    });

    return {
      stories: response.data.stories?.map(transformStoryData) || [],
      pagination: response.data.pagination || {}
    };
  } catch (error) {
    throw handleApiError(error, `Failed to fetch ${genre} stories`);
  }
};

// =============================================================================
// INDIVIDUAL STORY MANAGEMENT
// =============================================================================

/**
 * Get a single story by ID
 */
export const getStory = async (storyId, includeProgress = true) => {
  try {
    const params = includeProgress ? '?includeProgress=true' : '';
    
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getStory(storyId)}${params}`,
      method: 'GET'
    });

    return transformStoryData(response.data.story);
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch story');
  }
};

/**
 * Create a new story
 */
export const createStory = async (storyData) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.createStory,
      method: 'POST',
      data: {
        title: storyData.title,
        description: storyData.description || '',
        genre: storyData.genre || 'Adventure',
        tags: storyData.tags || [],
        difficulty: storyData.difficulty || 'medium',
        content: storyData.content || [],
        thumbnail: storyData.thumbnail || null,
        visibility: storyData.visibility || 'private',
        ageRating: storyData.ageRating || 'general',
        contentWarnings: storyData.contentWarnings || [],
        estimatedDuration: storyData.estimatedDuration || 30,
        isCollaborative: storyData.isCollaborative || false
      }
    });

    return transformStoryData(response.data.story);
  } catch (error) {
    throw handleApiError(error, 'Failed to create story');
  }
};

/**
 * Update an existing story
 */
export const updateStory = async (storyId, updates) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.updateStory(storyId),
      method: 'PATCH',
      data: updates
    });

    return transformStoryData(response.data.story);
  } catch (error) {
    throw handleApiError(error, 'Failed to update story');
  }
};

/**
 * Delete a story
 */
export const deleteStory = async (storyId) => {
  try {
    await apiCall({
      endpoint: STORY_ENDPOINTS.deleteStory(storyId),
      method: 'DELETE'
    });

    return { success: true };
  } catch (error) {
    throw handleApiError(error, 'Failed to delete story');
  }
};

// =============================================================================
// STORY GAMEPLAY
// =============================================================================

/**
 * Start or resume playing a story
 */
export const playStory = async (storyId, sceneId = null) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.playStory(storyId),
      method: 'POST',
      data: { sceneId }
    });

    return {
      story: transformStoryData(response.data.story),
      currentScene: response.data.currentScene,
      gameState: response.data.gameState || {}
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to start story');
  }
};

/**
 * Get story progress for current user
 */
export const getStoryProgress = async (storyId) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.getStoryProgress(storyId),
      method: 'GET'
    });

    return {
      currentScene: response.data.currentScene || 0,
      completionPercentage: response.data.completionPercentage || 0,
      lastPlayedAt: response.data.lastPlayedAt ? new Date(response.data.lastPlayedAt) : null,
      isCompleted: response.data.isCompleted || false,
      playTime: response.data.playTime || 0,
      gameState: response.data.gameState || {},
      achievements: response.data.achievements || []
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch story progress');
  }
};

/**
 * Save story progress
 */
export const saveStoryProgress = async (storyId, progressData) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.saveStoryProgress(storyId),
      method: 'POST',
      data: {
        currentScene: progressData.currentScene,
        gameState: progressData.gameState || {},
        playTime: progressData.playTime || 0,
        isCompleted: progressData.isCompleted || false,
        achievements: progressData.achievements || []
      }
    });

    return response.data.progress;
  } catch (error) {
    throw handleApiError(error, 'Failed to save story progress');
  }
};

/**
 * Reset story progress
 */
export const resetStoryProgress = async (storyId) => {
  try {
    await apiCall({
      endpoint: STORY_ENDPOINTS.resetStoryProgress(storyId),
      method: 'DELETE'
    });

    return { success: true };
  } catch (error) {
    throw handleApiError(error, 'Failed to reset story progress');
  }
};

// =============================================================================
// USER STORY COLLECTIONS
// =============================================================================

/**
 * Get current user's created stories
 */
export const getMyStories = async (options = {}) => {
  try {
    const { page = 1, limit = 20, status = 'all', sortBy = 'recent' } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy
    });

    if (status !== 'all') params.append('status', status);

    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getMyStories}?${params.toString()}`,
      method: 'GET'
    });

    return {
      stories: response.data.stories?.map(transformStoryData) || [],
      pagination: response.data.pagination || {}
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch your stories');
  }
};

/**
 * Get user's story library (saved/favorited stories)
 */
export const getLibraryStories = async (options = {}) => {
  try {
    const { page = 1, limit = 20, category = 'all' } = options;
    
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getLibraryStories}?page=${page}&limit=${limit}&category=${category}`,
      method: 'GET'
    });

    return {
      stories: response.data.stories?.map(transformStoryData) || [],
      pagination: response.data.pagination || {}
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch library stories');
  }
};

/**
 * Get user's favorite stories
 */
export const getFavoriteStories = async (options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;
    
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getFavoriteStories}?page=${page}&limit=${limit}`,
      method: 'GET'
    });

    return {
      stories: response.data.stories?.map(transformStoryData) || [],
      pagination: response.data.pagination || {}
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch favorite stories');
  }
};

// =============================================================================
// STORY INTERACTIONS
// =============================================================================

/**
 * Rate a story
 */
export const rateStory = async (storyId, rating, review = '') => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.rateStory(storyId),
      method: 'POST',
      data: { rating, review }
    });

    return response.data.rating;
  } catch (error) {
    throw handleApiError(error, 'Failed to rate story');
  }
};

/**
 * Toggle story favorite status
 */
export const toggleFavoriteStory = async (storyId) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.favoriteStory(storyId),
      method: 'POST'
    });

    return {
      isFavorited: response.data.isFavorited,
      favoriteCount: response.data.favoriteCount
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to update favorite status');
  }
};

/**
 * Share a story
 */
export const shareStory = async (storyId, platform = 'link') => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.shareStory(storyId),
      method: 'POST',
      data: { platform }
    });

    return {
      shareUrl: response.data.shareUrl,
      shareCode: response.data.shareCode
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to generate share link');
  }
};

/**
 * Report a story
 */
export const reportStory = async (storyId, reason, details = '') => {
  try {
    await apiCall({
      endpoint: STORY_ENDPOINTS.reportStory(storyId),
      method: 'POST',
      data: { reason, details }
    });

    return { success: true };
  } catch (error) {
    throw handleApiError(error, 'Failed to report story');
  }
};

// =============================================================================
// STORY ANALYTICS
// =============================================================================

/**
 * Get story statistics
 */
export const getStoryStats = async (storyId) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.getStoryStats(storyId),
      method: 'GET'
    });

    return {
      views: response.data.views || 0,
      uniqueViews: response.data.uniqueViews || 0,
      plays: response.data.plays || 0,
      completions: response.data.completions || 0,
      averagePlayTime: response.data.averagePlayTime || 0,
      rating: response.data.rating || { average: 0, count: 0 },
      demographics: response.data.demographics || {},
      trendData: response.data.trendData || []
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch story statistics');
  }
};

// =============================================================================
// STORY PUBLISHING
// =============================================================================

/**
 * Publish a story
 */
export const publishStory = async (storyId, publishOptions = {}) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.publishStory(storyId),
      method: 'POST',
      data: {
        visibility: publishOptions.visibility || 'public',
        featuredRequest: publishOptions.featuredRequest || false,
        publishNotes: publishOptions.publishNotes || ''
      }
    });

    return transformStoryData(response.data.story);
  } catch (error) {
    throw handleApiError(error, 'Failed to publish story');
  }
};

/**
 * Unpublish a story
 */
export const unpublishStory = async (storyId, reason = '') => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.unpublishStory(storyId),
      method: 'POST',
      data: { reason }
    });

    return transformStoryData(response.data.story);
  } catch (error) {
    throw handleApiError(error, 'Failed to unpublish story');
  }
};

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Get multiple stories by IDs
 */
export const getStoriesByIds = async (storyIds) => {
  try {
    const response = await apiCall({
      endpoint: STORY_ENDPOINTS.getAllStories,
      method: 'POST',
      data: { storyIds }
    });

    return response.data.stories?.map(transformStoryData) || [];
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch stories');
  }
};

/**
 * Bulk update stories
 */
export const bulkUpdateStories = async (updates) => {
  try {
    const response = await apiCall({
      endpoint: `${STORY_ENDPOINTS.getAllStories}/bulk`,
      method: 'PATCH',
      data: { updates }
    });

    return {
      updated: response.data.updated || 0,
      failed: response.data.failed || 0,
      stories: response.data.stories?.map(transformStoryData) || []
    };
  } catch (error) {
    throw handleApiError(error, 'Failed to bulk update stories');
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user can edit story
 */
export const canEditStory = (story, currentUser) => {
  if (!story || !currentUser) return false;
  
  return (
    story.author.id === currentUser.id ||
    story.collaborators?.some(c => c.id === currentUser.id && c.permissions.includes('edit')) ||
    currentUser.role === 'admin'
  );
};

/**
 * Check if story is accessible to user
 */
export const canAccessStory = (story, currentUser) => {
  if (!story) return false;
  
  if (story.visibility === 'public') return true;
  if (!currentUser) return false;
  
  return (
    story.author.id === currentUser.id ||
    story.collaborators?.some(c => c.id === currentUser.id) ||
    currentUser.role === 'admin'
  );
};

/**
 * Calculate story completion percentage
 */
export const calculateCompletionPercentage = (currentScene, totalScenes) => {
  if (!totalScenes || totalScenes === 0) return 0;
  return Math.round((currentScene / totalScenes) * 100);
};

/**
 * Format story duration
 */
export const formatStoryDuration = (minutes) => {
  minutes = 1;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Generate story preview text
 */
export const generateStoryPreview = (content, maxLength = 150) => {
  if (!content || content.length === 0) return '';
  
  const firstScene = content[0];
  const text = firstScene?.text || firstScene?.content || '';
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Story collections
  getAllStories,
  searchStories,
  getTrendingStories,
  getFeaturedStories,
  getStoriesByGenre,
  
  // Individual stories
  getStory,
  createStory,
  updateStory,
  deleteStory,
  
  // Gameplay
  playStory,
  getStoryProgress,
  saveStoryProgress,
  resetStoryProgress,
  
  // User collections
  getMyStories,
  getLibraryStories,
  getFavoriteStories,
  
  // Interactions
  rateStory,
  toggleFavoriteStory,
  shareStory,
  reportStory,
  
  // Analytics
  getStoryStats,
  
  // Publishing
  publishStory,
  unpublishStory,
  
  // Batch operations
  getStoriesByIds,
  bulkUpdateStories,
  
  // Utilities
  canEditStory,
  canAccessStory,
  calculateCompletionPercentage,
  formatStoryDuration,
  generateStoryPreview,
  transformStoryData
};