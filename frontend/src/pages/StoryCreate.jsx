/**
 * VERSE Mystical Story Creation Portal
 * Enchanted story crafting interface with AI-assisted generation
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useMysticalAPI as useApi } from '../hooks/useApi.js';
import { useNotifications } from '../hooks/useNotifications.js';
import MysticalButton from '../components/common/Button.jsx';
import MysticalInput from '../components/common/Input.jsx';
import { MysticalDropdown } from '../components/common/Dropdown.jsx';
import MysticalModal from '../components/common/Modal.jsx';
import StoryModal from './StoryModal.jsx';
import MysticalLoading from '../components/common/Loading.jsx';
import StoryCard from '../components/story/StoryCard.jsx';
import { DeviceSpells, TextSpells, ValidationSpells } from '../utils/helpers.js';
import { STORY_GENRES, STORY_TYPES, ROUTES, API_ENDPOINTS } from '../utils/constants.js';
import MysticalLayout from '../components/layout/Layout.jsx';
import './StoryCreate.css';

// =============================================================================
// STORY CREATION CONSTANTS
// =============================================================================

const CREATION_STEPS = {
  CONCEPT: 'concept',
  // DETAILS: 'details', 
  CHARACTERS: 'characters',
  SETTING: 'setting',
  GENERATION: 'generation',
  REVIEW: 'review'
};

const STEP_LABELS = {
  [CREATION_STEPS.CONCEPT]: 'Story Concept',
  [CREATION_STEPS.DETAILS]: 'Story Details',
  [CREATION_STEPS.CHARACTERS]: 'Characters',
  [CREATION_STEPS.SETTING]: 'World & Setting',
  [CREATION_STEPS.GENERATION]: 'AI Generation',
  [CREATION_STEPS.REVIEW]: 'Review & Publish'
};

const TONE_OPTIONS = [
  { value: 'adventurous', label: 'Adventurous', icon: '⚔️' },
  { value: 'mysterious', label: 'Mysterious', icon: '🔮' },
  { value: 'romantic', label: 'Romantic', icon: '💖' },
  { value: 'dark', label: 'Dark & Gritty', icon: '🌙' },
  { value: 'humorous', label: 'Humorous', icon: '😄' },
  { value: 'epic', label: 'Epic Fantasy', icon: '🏰' },
  { value: 'intimate', label: 'Intimate & Personal', icon: '🤲' },
  { value: 'suspenseful', label: 'Suspenseful', icon: '😱' }
];

const PERSPECTIVE_OPTIONS = [
  { value: 'first', label: 'First Person (I/me)', description: 'Personal and immersive' },
  { value: 'second', label: 'Second Person (You)', description: 'Interactive and engaging' },
  { value: 'third_limited', label: 'Third Person Limited', description: 'Following one character' },
  { value: 'third_omniscient', label: 'Third Person Omniscient', description: 'All-knowing narrator' }
];

const TARGET_AUDIENCE = [
  { value: 'children', label: 'Children (6-12)', icon: '🧒' },
  { value: 'teen', label: 'Teen (13-17)', icon: '🧑‍🎓' },
  { value: 'young_adult', label: 'Young Adult (18-25)', icon: '🌟' },
  { value: 'adult', label: 'Adult (25+)', icon: '👥' },
  { value: 'all_ages', label: 'All Ages', icon: '🌍' }
];

// =============================================================================
// STORY CREATION COMPONENT
// =============================================================================

const MysticalStoryCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, generateBasicStory, authState, progressStories } = useAuth();
  const { callApi, isLoading: apiLoading } = useApi();
  const { addNotification } = useNotifications();
  
  // Refs for form elements
  const conceptRef = useRef(null);
  const titleRef = useRef(null);
  const formRef = useRef(null);
  
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [currentStep, setCurrentStep] = useState(CREATION_STEPS.CONCEPT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  
  // Form data state
  const [storyData, setStoryData] = useState({
    // Concept step
    title: '',
    concept: '',
    genre: '',
    type: 'interactive',
    
    // Details step
    description: '',
    tone: '',
    perspective: 'second',
    targetAudience: 'young_adult',
    estimatedLength: 'medium',
    
    // Characters step
    mainCharacter: {
      name: '',
      description: '',
      personality: '',
      background: ''
    },
    supportingCharacters: [],
    
    // Setting step
    setting: {
      timeframe: '',
      location: '',
      worldDescription: '',
      atmosphere: ''
    },
    
    // Generation preferences
    generationSettings: {
      creativity: 70,
      complexity: 50,
      interactivity: 80,
      aiAssistance: true,
      generateOutline: true,
      generateFirstChapter: false
    },
    
    // Metadata
    tags: [],
    isPublic: true,
    allowCollaboration: false,
    contentWarnings: []
  });
  
  // UI state
  const [uiState, setUiState] = useState({
    errors: {},
    warnings: {},
    hasUnsavedChanges: false,
    showAdvancedOptions: false,
    selectedTemplate: null,
    generationProgress: 0,
    generationStatus: ''
  });
  
  // Device info for responsive behavior
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [storyProgression, setStoryProgression] = useState({
            nextSceneInput: '',
            isProgressing: false,
            progressionHistory: [], // Will store new scene parts as they're added
            currentStoryId: null
        });
  
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  useEffect(() => {
    if (!isAuthenticated && !authState.isAuthenticated) {
      navigate(ROUTES.LOGIN, { 
        state: { from: location, message: 'Please log in to create stories' }
      });
      return;
    }
    
    // Get device info
    setDeviceInfo('webOS');
    
    // Focus on first input
    if (conceptRef.current) {
      conceptRef.current.focus();
    }
    setCurrentUser(user);

  }, [isAuthenticated, navigate, location, user]);
  
  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (uiState.hasUnsavedChanges && storyData.title.trim()) {
        saveAsDraft();
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearTimeout(autoSaveTimer);
  }, [storyData, uiState.hasUnsavedChanges]);
  
  // =============================================================================
  // FORM HANDLERS
  // =============================================================================
  
  const handleInputChange = useCallback((field, value) => {
    setStoryData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    setUiState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
      errors: {
        ...prev.errors,
        [field]: null
      }
    }));
  }, []);
  
  const handleCharacterChange = useCallback((index, field, value) => {
    if (index === 'main') {
      setStoryData(prev => ({
        ...prev,
        mainCharacter: {
          ...prev.mainCharacter,
          [field]: value
        }
      }));
    } else {
      setStoryData(prev => ({
        ...prev,
        supportingCharacters: prev.supportingCharacters.map((char, i) => 
          i === index ? { ...char, [field]: value } : char
        )
      }));
    }
    
    setUiState(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, []);
  
  const addSupportingCharacter = useCallback(() => {
    setStoryData(prev => ({
      ...prev,
      supportingCharacters: [
        ...prev.supportingCharacters,
        { name: '', description: '', role: '' }
      ]
    }));
  }, []);
  
  const removeSupportingCharacter = useCallback((index) => {
    setStoryData(prev => ({
      ...prev,
      supportingCharacters: prev.supportingCharacters.filter((_, i) => i !== index)
    }));
  }, []);
  
  const handleTagAdd = useCallback((tag) => {
    if (tag && !storyData.tags.includes(tag)) {
      setStoryData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  }, [storyData.tags]);
  
  const handleTagRemove = useCallback((tagToRemove) => {
    setStoryData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);
  
  // =============================================================================
  // VALIDATION
  // =============================================================================
  
  const validateStep = useCallback((step) => {
    const errors = {};
    
    switch (step) {
      case CREATION_STEPS.CONCEPT:
        if (!storyData.title.trim()) {
          errors.title = 'Story title is required';
        } else if (storyData.title.length < 3) {
          errors.title = 'Title must be at least 3 characters';
        } else if (storyData.title.length > 1000) {
          errors.title = 'Title must be less than 1000 characters';
        }
        
        if (!storyData.concept.trim()) {
          errors.concept = 'Story concept is required';
        } else if (storyData.concept.length < 50) {
          errors.concept = 'Concept should be at least 50 characters';
        }
        
        if (!storyData.genre) {
          errors.genre = 'Please select a genre';
        }
        break;
        
      case CREATION_STEPS.DETAILS:
        if (!storyData.description.trim()) {
          errors.description = 'Story description is required';
        } else if (storyData.description.length < 5) {
          errors.description = 'Description should be at least 100 characters';
        }
        
        if (!storyData.tone) {
          errors.tone = 'Please select a tone';
        }
        break;
        
      case CREATION_STEPS.CHARACTERS:
        if (!storyData.mainCharacter.name.trim()) {
          errors['mainCharacter.name'] = 'Main character name is required';
        }
        
        if (!storyData.mainCharacter.description.trim()) {
          errors['mainCharacter.description'] = 'Main character description is required';
        }
        break;
        
      case CREATION_STEPS.SETTING:
        if (!storyData.setting.location.trim()) {
          errors['setting.location'] = 'Setting location is required';
        }
        
        if (!storyData.setting.timeframe.trim()) {
          errors['setting.timeframe'] = 'Time frame is required';
        }
        break;
    }
    
    setUiState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [storyData]);
  
  // =============================================================================
  // STEP NAVIGATION
  // =============================================================================
  
const nextStep = useCallback(() => {
  if (!validateStep(currentStep)) {
    addNotification({
      type: 'error',
      title: 'Validation Error',
      message: 'Please fix the errors before continuing'
    });
    return;
  }
  
  // For now, only allow step 1 (CONCEPT)
  if (currentStep === CREATION_STEPS.CONCEPT) {
    addNotification({
      type: 'info',
      title: 'More Steps Coming Soon!',
      message: 'Additional story creation steps will be available in the next update. For now, you can generate a story with your current inputs!'
    });
    return;
  }
  
  const steps = Object.values(CREATION_STEPS);
  const currentIndex = steps.indexOf(currentStep);
  
  if (currentIndex < steps.length - 1) {
    setCurrentStep(steps[currentIndex + 1]);
  }
}, [currentStep, validateStep, addNotification]);
  
  const previousStep = useCallback(() => {
    const steps = Object.values(CREATION_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);
  
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);
  
  // =============================================================================
  // API CALLS
  // =============================================================================
  
  const saveAsDraft = useCallback(async () => {
    try {
      const draftData = {
        ...storyData,
        status: 'draft',
        lastModified: new Date().toISOString()
      };
      
      // await callApi({
      //   endpoint: API_ENDPOINTS.STORIES.CREATE,
      //   method: 'POST',
      //   data: draftData
      // });
      
      setUiState(prev => ({ ...prev, hasUnsavedChanges: false }));
      
      addNotification({
        type: 'success',
        title: 'Draft Saved',
        message: 'Your story has been saved as a draft'
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save draft. Please try again.'
      });
    }
  }, [storyData, callApi, addNotification]);
  
  const generateStoryOutline = useCallback(async () => {
    try {
      setIsGenerating(true);
      setUiState(prev => ({ 
        ...prev, 
        generationProgress: 0, 
        generationStatus: 'Initializing AI generation...' 
      }));
      
      const generationData = {
        title: storyData.title,
        concept: storyData.concept,
        genre: storyData.genre,
        tone: storyData.tone,
        mainCharacter: storyData.mainCharacter,
        setting: storyData.setting,
        generationSettings: storyData.generationSettings
      };
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUiState(prev => {
          const newProgress = Math.min(prev.generationProgress + 10, 90);
          const statusMessages = [
            'Analyzing story concept...',
            'Generating character arcs...',
            'Building story structure...',
            'Creating plot points...',
            'Refining narrative flow...',
            'Finalizing story outline...'
          ];
          
          return {
            ...prev,
            generationProgress: newProgress,
            generationStatus: statusMessages[Math.floor(newProgress / 15)] || 'Generating...'
          };
        });
      }, 1000);
      
      const response = await callApi({
        endpoint: '/api/generate/story-outline',
        method: 'POST',
        data: generationData
      });
      
      clearInterval(progressInterval);
      
      setUiState(prev => ({ 
        ...prev, 
        generationProgress: 100, 
        generationStatus: 'Generation complete!' 
      }));
      
      // Update story data with generated content
      setStoryData(prev => ({
        ...prev,
        generatedOutline: response.data.outline,
        generatedChapters: response.data.chapters || [],
        aiSuggestions: response.data.suggestions || []
      }));
      
      setTimeout(() => setCurrentStep(CREATION_STEPS.REVIEW), 1500);
      
      addNotification({
        type: 'success',
        title: 'Story Generated!',
        message: 'Your story outline has been generated successfully'
      });
      
    } catch (error) {
      console.error('Generation failed:', error);
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: error.message || 'Failed to generate story. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [storyData, callApi, addNotification]);
  
  const publishStory = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      const publishData = {
        ...storyData,
        status: 'published',
        publishedAt: new Date().toISOString(),
        createdBy: user.id
      };
      
      const response = await callApi({
        endpoint: API_ENDPOINTS.STORIES.CREATE,
        method: 'POST',
        data: publishData
      });
      
      addNotification({
        type: 'success',
        title: 'Story Published!',
        message: 'Your story has been published successfully'
      });
      
      // Navigate to the published story
      navigate(`/stories/${response.data.id}`);
      
    } catch (error) {
      console.error('Publication failed:', error);
      addNotification({
        type: 'error',
        title: 'Publication Failed',
        message: error.message || 'Failed to publish story. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [storyData, user, callApi, addNotification, navigate]);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const computedValues = useMemo(() => {
    const steps = Object.values(CREATION_STEPS);
    const currentStepIndex = steps.indexOf(currentStep);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;
    
    const canProceed = !isSubmitting && !isGenerating && !apiLoading;
    const canGoNext = currentStep !== CREATION_STEPS.REVIEW && canProceed;
    const canGoBack = currentStep !== CREATION_STEPS.CONCEPT && canProceed;
    const canGenerate = currentStep === CREATION_STEPS.GENERATION && canProceed;
    const canPublish = currentStep === CREATION_STEPS.REVIEW && canProceed;
    
    const estimatedReadingTime = TextSpells.estimateReadingTime(
      storyData.description + storyData.concept
    );
    
    return {
      progress,
      currentStepIndex,
      totalSteps: steps.length,
      canProceed,
      canGoNext,
      canGoBack,
      canGenerate,
      canPublish,
      estimatedReadingTime,
      hasErrors: Object.keys(uiState.errors).length > 0,
      isMobile: deviceInfo?.isMobile || false
    };
  }, [currentStep, isSubmitting, isGenerating, apiLoading, storyData, uiState.errors, deviceInfo]);
  
const renderProgressSteps = () => (
  <div className="verse-creation-progress">
    <div className="verse-progress-bar">
      <div 
        className="verse-progress-fill"
        style={{ width: `${computedValues.progress}%` }}
      />
    </div>
    
    <div className="verse-progress-steps">
      {Object.values(CREATION_STEPS).map((step, index) => {
        const isCurrentStep = step === currentStep;
        const isCompleted = index < computedValues.currentStepIndex;
        const isDisabled = index > 0; // Disable steps 2-6
        
        return (
          <div key={step} className="verse-progress-step-wrapper">
            <button
              className={`verse-progress-step ${
                isCurrentStep ? 'active' : ''
              } ${
                isCompleted ? 'completed' : ''
              } ${
                isDisabled ? 'disabled coming-soon' : ''
              }`}
              onClick={() => !isDisabled && goToStep(step)}
              disabled={!computedValues.canProceed || isDisabled}
              title={isDisabled ? 'Coming Soon! This feature will be available in the next update.' : ''}
            >
              <span className="verse-step-number">{index + 1} -</span>
              <span className="verse-step-label"> {STEP_LABELS[step]}</span>
              {isDisabled && (
                <span className="verse-coming-soon-badge">Soon</span>
              )}
            </button>
            
            {isDisabled && (
              <div className="verse-tooltip">
                <div className="verse-tooltip-content">
                  🚀 Coming Soon!
                  <br />
                  <small>This feature will be available in the next update</small>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case CREATION_STEPS.CONCEPT:
        return renderConceptStep();
      case CREATION_STEPS.DETAILS:
        return renderDetailsStep();
      case CREATION_STEPS.CHARACTERS:
        return renderCharactersStep();
      case CREATION_STEPS.SETTING:
        return renderSettingStep();
      case CREATION_STEPS.GENERATION:
        return renderGenerationStep();
      case CREATION_STEPS.REVIEW:
        return renderReviewStep();
      default:
        return null;
    }
  };

// Add these functions after the existing API calls section (around line 580)

// Function to check if basic story generation is possible
const canGenerateBasicStory = useCallback(() => {
  return storyData.title.trim() && 
         storyData.description.trim() && 
         storyData.genre && 
         storyData.title.length >= 3 &&
         storyData.description.length >= 3;
}, [storyData.title, storyData.description, storyData.genre]);

// Basic story generation function
const handleGenerateBasicStory = useCallback(async () => {
  try {
    console.log('Starting basic story generation with data:', storyData);
    setIsGenerating(true);
    setUiState(prev => ({ 
      ...prev, 
      generationProgress: 0, 
      generationStatus: 'Initializing basic story generation...' 
    }));
    const currentUserInfo = authState.user || {username: 'default', userId: 0};
    console.log("User info:", currentUserInfo);
    
    const basicStoryData = {
      title: storyData.title,
      description: storyData.description,
      genre: storyData.genre,
      type: storyData.type,
      concept: storyData.concept || storyData.description, // Use description if no concept
      generationType: 'basic', // Flag for backend to know this is basic generation
      timestamp: new Date().toISOString(),
      user_id: currentUserInfo?.userId || null,
      user_name: currentUserInfo?.username || currentUser
    };

    console.log('Prepared basic story data for API:');
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUiState(prev => {
        const newProgress = Math.min(prev.generationProgress + 15, 90);
        const statusMessages = [
          'Analyzing your story concept...',
          'Creating story structure...',
          'Generating characters...',
          'Building plot progression...',
          'Adding narrative details...',
          'Finalizing your story...'
        ];
        
        return {
          ...prev,
          generationProgress: newProgress,
          generationStatus: statusMessages[Math.floor(newProgress / 15)] || 'Generating...'
        };
      });
    }, 800);

    console.log('After basic story data for API:');
    
    const response = await generateBasicStory(basicStoryData);

    console.log('Received response from basic story generation API:', response);
    
    clearInterval(progressInterval);
    
    setUiState(prev => ({ 
      ...prev, 
      generationProgress: 100, 
      generationStatus: 'Story generation complete!' 
    }));
    
    // Handle successful generation
    if (response && response.data && response.data.success) {
      const generatedStory = response.data;
      generatedStory.characters = [{
        name: storyData.protagonist_name || 'Hero',
        role: 'Protagonist',
        description: storyData.protagonist_description || 'The main character of the story.'
      }]
      
      addNotification({
        type: 'success',
        title: 'Story Created Successfully!',
        message: `"${generatedStory.title}" has been created. Review your mystical tale!`
      });
      
      // Store generated story data
      setStoryData(prev => ({
        ...prev,
        generatedStory: generatedStory,
        generatedAt: new Date().toISOString(),
        storyId: generatedStory.story_id,
        sessionId: generatedStory.session_id
      }));
      
      // Show story preview modal
      setShowStoryPreview(true);
      
    } else {
      // Handle API success but story creation failure
      const errorMessage = response.data?.error_message || 'Story creation failed for unknown reason';
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('Story creation failed:', error);
    
    // Enhanced error handling
    let errorMessage = 'Failed to create story. Please try again.';
    
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
    
    addNotification({
      type: 'error',
      title: 'Story Creation Failed',
      message: errorMessage
    });
  } finally {
    setIsGenerating(false);
    setTimeout(() => {
      setUiState(prev => ({
        ...prev,
        generationProgress: 0,
        generationStatus: ''
      }));
    }, 3000);
  }
}, [storyData, callApi, addNotification]);

const renderStoryPreviewModal = () => (
  <StoryModal
    showStoryPreview={showStoryPreview}
    setShowStoryPreview={setShowStoryPreview}
    storyData={storyData}
    setStoryData={setStoryData}
    setCurrentStep={setCurrentStep}
    addNotification={addNotification}
    CREATION_STEPS={CREATION_STEPS}
  />
);
  
  // Replace the renderConceptStep function (around line 700)
const renderConceptStep = () => (
  <div className="verse-creation-step verse-concept-step">
    <div className="verse-step-header">
      <h2 className="verse-step-title">🌟 Story Concept</h2>
      <p className="verse-step-description">
        Let's start with the foundation of your mystical tale
      </p>
    </div>
    
    <div className="verse-step-content">
      <div className="verse-form-group">
        <MysticalInput
          ref={titleRef}
          label="Story Title"
          name="title"
          value={storyData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter your enchanting story title..."
          error={uiState.errors.title}
          required
          maxLength={100}
          showCharCount
        />
      </div>
      
      <div className="verse-form-group">
        <MysticalInput
          label="Story Description"
          name="description"
          type="textarea"
          value={storyData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Write a compelling description that will entice readers. Describe the main plot, setting, and what makes your story unique..."
          error={uiState.errors.description}
          required
          rows={4}
          maxLength={1000}
          showCharCount
        />
      </div>
      
      <div className="verse-form-group">
        <label className="verse-form-label">Genre</label>
        <div className="verse-genre-grid">
          {Object.entries(STORY_GENRES).map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={`verse-genre-card ${
                storyData.genre === key ? 'selected' : ''
              }`}
              onClick={() => handleInputChange('genre', key)}
            >
              <span className="verse-genre-icon">
                {value.icon} - 
              </span>
              <span className="verse-genre-label"> {value.label}</span>
            </button>
          ))}
        </div>
        {uiState.errors.genre && (
          <span className="verse-error-text">{uiState.errors.genre}</span>
        )}
      </div>
      
      <div className="verse-form-group">
        <label className="verse-form-label">Story Type</label>
        <div className="verse-type-options">
          {Object.entries(STORY_TYPES).map(([key, label]) => (
            <label key={key} className="verse-radio-option">
              <input
                type="radio"
                name="storyType"
                value={key}
                checked={storyData.type === key}
                onChange={(e) => handleInputChange('type', e.target.value)}
              />
              <span className="verse-radio-custom"></span>
              <span className="verse-radio-label">{label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="verse-form-group">
        <MysticalInput
          ref={conceptRef}
          label="Story Concept"
          name="concept"
          type="textarea"
          disabled={true}
          title="Coming soon - This feature will be available in the next update"
          value={storyData.concept}
          onChange={(e) => handleInputChange('concept', e.target.value)}
          placeholder="Describe your story concept in detail. What is the central idea, conflict, or journey? (Coming soon) ..."
          error={uiState.errors.concept}
          required
          rows={6}
          maxLength={2000}
          showCharCount
        />
        <p className="verse-helper-text">
          💡 Tip: Include the main conflict, setting, and what makes your story unique
        </p>
      </div>

      {/* Generate Story Section */}
      <div className="verse-generate-section">
        <div className="verse-generate-header">
          <h4 className="verse-generate-title">🤖 AI Story Generation</h4>
          <p className="verse-generate-description">
            Generate a complete story based on your concept! More advanced options coming soon.
          </p>
        </div>
        
        <div className="verse-generate-actions">
          <MysticalButton
            variant="primary"
            size="lg"
            onClick={handleGenerateBasicStory}
            disabled={!canGenerateBasicStory() || isGenerating}
            loading={isGenerating}
            className="verse-generate-button"
          >
            {isGenerating ? (
              <>
                <span className="verse-btn-icon">⏳</span>
                <span className="verse-btn-text">Generating Story...</span>
              </>
            ) : (
              <>
                <span className="verse-btn-icon">✨</span>
                <span className="verse-btn-text">Generate Story</span>
              </>
            )}
          </MysticalButton>
          
          <p className="verse-generate-note">
            🔮 This will create a complete story based on your title, description, and genre
          </p>
        </div>

        {isGenerating && (
          <div className="verse-generation-progress-mini">
            <div className="verse-progress-bar-mini">
              <div 
                className="verse-progress-fill-mini"
                style={{ width: `${uiState.generationProgress}%` }}
              />
            </div>
            <p className="verse-generation-status-mini">{uiState.generationStatus}</p>
          </div>
        )}
        {/* {showStoryPreview && renderStoryPreviewModal()} */}

        {showStoryPreview && (
          <StoryModal
            showStoryPreview={showStoryPreview}
            setShowStoryPreview={setShowStoryPreview}
            storyData={storyData}
            setStoryData={setStoryData}
            addNotification={addNotification}
            setCurrentStep={setCurrentStep}
            CREATION_STEPS={CREATION_STEPS}
            storyProgression={storyProgression}
            setStoryProgression={setStoryProgression}
          />
        )}
      </div>
    </div>
  </div>
);
  
  const renderDetailsStep = () => (
    <div className="verse-creation-step verse-details-step">
      <div className="verse-step-header">
        <h2 className="verse-step-title">📖 Story Details</h2>
        <p className="verse-step-description">
          Define the tone, perspective, and audience for your story
        </p>
      </div>
      
      <div className="verse-step-content">
        <div className="verse-form-group">
          <MysticalInput
            label="Story Description"
            name="description"
            type="textarea"
            value={storyData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Write a compelling description that will entice readers. This will be shown on your story's page..."
            error={uiState.errors.description}
            required
            rows={4}
            maxLength={1000}
            showCharCount
          />
        </div>
        
        <div className="verse-form-row">
          <div className="verse-form-group">
            <label className="verse-form-label">Tone & Mood</label>
            <div className="verse-tone-grid">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  className={`verse-tone-card ${
                    storyData.tone === tone.value ? 'selected' : ''
                  }`}
                  onClick={() => handleInputChange('tone', tone.value)}
                >
                  <span className="verse-tone-icon">{tone.icon}</span>
                  <span className="verse-tone-label">{tone.label}</span>
                </button>
              ))}
            </div>
            {uiState.errors.tone && (
              <span className="verse-error-text">{uiState.errors.tone}</span>
            )}
          </div>
          
          <div className="verse-form-group">
            <label className="verse-form-label">Narrative Perspective</label>
            <div className="verse-perspective-options">
              {PERSPECTIVE_OPTIONS.map((perspective) => (
                <label key={perspective.value} className="verse-perspective-card">
                  <input
                    type="radio"
                    name="perspective"
                    value={perspective.value}
                    checked={storyData.perspective === perspective.value}
                    onChange={(e) => handleInputChange('perspective', e.target.value)}
                  />
                  <div className="verse-perspective-content">
                    <span className="verse-perspective-label">{perspective.label}</span>
                    <span className="verse-perspective-description">{perspective.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="verse-form-row">
          <div className="verse-form-group">
            <label className="verse-form-label">Target Audience</label>
            <div className="verse-audience-grid">
              {TARGET_AUDIENCE.map((audience) => (
                <button
                  key={audience.value}
                  type="button"
                  className={`verse-audience-card ${
                    storyData.targetAudience === audience.value ? 'selected' : ''
                  }`}
                  onClick={() => handleInputChange('targetAudience', audience.value)}
                >
                  <span className="verse-audience-icon">{audience.icon}</span>
                  <span className="verse-audience-label">{audience.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="verse-form-group">
            <label className="verse-form-label">Estimated Length</label>
            <select
              className="verse-select"
              value={storyData.estimatedLength}
              onChange={(e) => handleInputChange('estimatedLength', e.target.value)}
            >
              <option value="short">Short (1-5 chapters)</option>
              <option value="medium">Medium (6-15 chapters)</option>
              <option value="long">Long (16-30 chapters)</option>
              <option value="epic">Epic (30+ chapters)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderCharactersStep = () => (
    <div className="verse-creation-step verse-characters-step">
      <div className="verse-step-header">
        <h2 className="verse-step-title">👤 Characters</h2>
        <p className="verse-step-description">
          Bring your characters to life with rich personalities and backgrounds
        </p>
      </div>
      
      <div className="verse-step-content">
        <div className="verse-character-section">
          <h3 className="verse-character-title">Main Character</h3>
          
          <div className="verse-form-row">
            <div className="verse-form-group">
              <MysticalInput
                label="Character Name"
                name="mainCharacterName"
                value={storyData.mainCharacter.name}
                onChange={(e) => handleCharacterChange('main', 'name', e.target.value)}
                placeholder="Enter character name..."
                error={uiState.errors['mainCharacter.name']}
                required
              />
            </div>
            
            <div className="verse-form-group">
              <MysticalInput
                label="Character Description"
                name="mainCharacterDescription"
                type="textarea"
                value={storyData.mainCharacter.description}
                onChange={(e) => handleCharacterChange('main', 'description', e.target.value)}
                placeholder="Describe your character's appearance, age, and key traits..."
                error={uiState.errors['mainCharacter.description']}
                required
                rows={3}
              />
            </div>
          </div>
          
          <div className="verse-form-row">
            <div className="verse-form-group">
              <MysticalInput
                label="Personality"
                name="mainCharacterPersonality"
                type="textarea"
                value={storyData.mainCharacter.personality}
                onChange={(e) => handleCharacterChange('main', 'personality', e.target.value)}
                placeholder="What drives this character? What are their strengths and flaws?"
                rows={3}
              />
            </div>
            
            <div className="verse-form-group">
              <MysticalInput
                label="Background"
                name="mainCharacterBackground"
                type="textarea"
                value={storyData.mainCharacter.background}
                onChange={(e) => handleCharacterChange('main', 'background', e.target.value)}
                placeholder="What's their history? What brought them to this story?"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="verse-character-section">
          <div className="verse-section-header">
            <h3 className="verse-character-title">Supporting Characters</h3>
            <MysticalButton
              variant="ghost"
              size="sm"
              onClick={addSupportingCharacter}
            >
              ➕ Add Character
            </MysticalButton>
          </div>
          
          <div className="verse-supporting-characters">
            {storyData.supportingCharacters.map((character, index) => (
              <div key={index} className="verse-supporting-character-card">
                <div className="verse-character-card-header">
                  <span className="verse-character-number">Character {index + 1}</span>
                  <button
                    type="button"
                    className="verse-remove-character"
                    onClick={() => removeSupportingCharacter(index)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="verse-form-row">
                  <div className="verse-form-group">
                    <MysticalInput
                      label="Name"
                      value={character.name}
                      onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                      placeholder="Character name..."
                    />
                  </div>
                  
                  <div className="verse-form-group">
                    <MysticalInput
                      label="Role"
                      value={character.role}
                      onChange={(e) => handleCharacterChange(index, 'role', e.target.value)}
                      placeholder="Friend, mentor, rival..."
                    />
                  </div>
                </div>
                
                <div className="verse-form-group">
                  <MysticalInput
                    label="Description"
                    type="textarea"
                    value={character.description}
                    onChange={(e) => handleCharacterChange(index, 'description', e.target.value)}
                    placeholder="Describe this character..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            
            {storyData.supportingCharacters.length === 0 && (
              <div className="verse-empty-state">
                <p className="verse-empty-text">
                  No supporting characters yet. Add some to enrich your story!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderSettingStep = () => (
    <div className="verse-creation-step verse-setting-step">
      <div className="verse-step-header">
        <h2 className="verse-step-title">🌍 World & Setting</h2>
        <p className="verse-step-description">
          Create the world where your story unfolds
        </p>
      </div>
      
      <div className="verse-step-content">
        <div className="verse-form-row">
          <div className="verse-form-group">
            <MysticalInput
              label="Time Frame"
              name="settingTimeframe"
              value={storyData.setting.timeframe}
              onChange={(e) => handleInputChange('setting.timeframe', e.target.value)}
              placeholder="Modern day, Medieval times, Far future..."
              error={uiState.errors['setting.timeframe']}
              required
            />
          </div>
          
          <div className="verse-form-group">
            <MysticalInput
              label="Location"
              name="settingLocation"
              value={storyData.setting.location}
              onChange={(e) => handleInputChange('setting.location', e.target.value)}
              placeholder="City, countryside, another world..."
              error={uiState.errors['setting.location']}
              required
            />
          </div>
        </div>
        
        <div className="verse-form-group">
          <MysticalInput
            label="World Description"
            name="settingWorldDescription"
            type="textarea"
            value={storyData.setting.worldDescription}
            onChange={(e) => handleInputChange('setting.worldDescription', e.target.value)}
            placeholder="Describe the world your story takes place in. What makes it unique? What are the rules of this world?"
            rows={4}
            maxLength={1500}
            showCharCount
          />
        </div>
        
        <div className="verse-form-group">
          <MysticalInput
            label="Atmosphere & Mood"
            name="settingAtmosphere"
            type="textarea"
            value={storyData.setting.atmosphere}
            onChange={(e) => handleInputChange('setting.atmosphere', e.target.value)}
            placeholder="What's the general feeling of this world? Dark and foreboding? Bright and hopeful? Mysterious and magical?"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
  
  const renderGenerationStep = () => (
    <div className="verse-creation-step verse-generation-step">
      <div className="verse-step-header">
        <h2 className="verse-step-title">🤖 AI Generation</h2>
        <p className="verse-step-description">
          Configure AI assistance to help craft your story
        </p>
      </div>
      
      <div className="verse-step-content">
        {!isGenerating ? (
          <>
            <div className="verse-generation-settings">
              <div className="verse-setting-group">
                <label className="verse-slider-label">
                  Creativity Level: {storyData.generationSettings.creativity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={storyData.generationSettings.creativity}
                  onChange={(e) => handleInputChange('generationSettings.creativity', parseInt(e.target.value))}
                  className="verse-slider"
                />
                <p className="verse-slider-description">
                  How creative and unexpected should the AI be?
                </p>
              </div>
              
              <div className="verse-setting-group">
                <label className="verse-slider-label">
                  Story Complexity: {storyData.generationSettings.complexity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={storyData.generationSettings.complexity}
                  onChange={(e) => handleInputChange('generationSettings.complexity', parseInt(e.target.value))}
                  className="verse-slider"
                />
                <p className="verse-slider-description">
                  How complex should the plot and characters be?
                </p>
              </div>
              
              <div className="verse-setting-group">
                <label className="verse-slider-label">
                  Interactivity: {storyData.generationSettings.interactivity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={storyData.generationSettings.interactivity}
                  onChange={(e) => handleInputChange('generationSettings.interactivity', parseInt(e.target.value))}
                  className="verse-slider"
                />
                <p className="verse-slider-description">
                  How many choices and interactive elements?
                </p>
              </div>
            </div>
            
            <div className="verse-generation-options">
              <label className="verse-checkbox-option">
                <input
                  type="checkbox"
                  checked={storyData.generationSettings.generateOutline}
                  onChange={(e) => handleInputChange('generationSettings.generateOutline', e.target.checked)}
                />
                <span className="verse-checkbox-custom"></span>
                <span className="verse-checkbox-label">Generate story outline</span>
              </label>
              
              <label className="verse-checkbox-option">
                <input
                  type="checkbox"
                  checked={storyData.generationSettings.generateFirstChapter}
                  onChange={(e) => handleInputChange('generationSettings.generateFirstChapter', e.target.checked)}
                />
                <span className="verse-checkbox-custom"></span>
                <span className="verse-checkbox-label">Generate first chapter</span>
              </label>
            </div>
            
            <div className="verse-generation-summary">
              <h4>Story Summary</h4>
              <div className="verse-summary-grid">
                <div className="verse-summary-item">
                  <span className="verse-summary-label">Title:</span>
                  <span className="verse-summary-value">{storyData.title}</span>
                </div>
                <div className="verse-summary-item">
                  <span className="verse-summary-label">Genre:</span>
                  <span className="verse-summary-value">{STORY_GENRES[storyData.genre]}</span>
                </div>
                <div className="verse-summary-item">
                  <span className="verse-summary-label">Tone:</span>
                  <span className="verse-summary-value">
                    {TONE_OPTIONS.find(t => t.value === storyData.tone)?.label}
                  </span>
                </div>
                <div className="verse-summary-item">
                  <span className="verse-summary-label">Main Character:</span>
                  <span className="verse-summary-value">{storyData.mainCharacter.name}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="verse-generation-progress">
            <div className="verse-progress-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - uiState.generationProgress / 100)}`}
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dy="0.3em"
                  fontSize="16"
                  fill="#8b5cf6"
                >
                  {uiState.generationProgress}%
                </text>
              </svg>
            </div>
            
            <div className="verse-generation-status">
              <h4>{uiState.generationStatus}</h4>
              <p>Please wait while the AI crafts your story...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderReviewStep = () => (
    <div className="verse-creation-step verse-review-step">
      <div className="verse-step-header">
        <h2 className="verse-step-title">📋 Review & Publish</h2>
        <p className="verse-step-description">
          Review your story and publish it to the mystical realm
        </p>
      </div>
      
      <div className="verse-step-content">
        <div className="verse-story-preview">
          <StoryCard
            story={{
              title: storyData.title,
              description: storyData.description,
              genre: storyData.genre,
              author: user?.username || 'You',
              createdAt: new Date().toISOString(),
              tags: storyData.tags,
              estimatedReadingTime: computedValues.estimatedReadingTime
            }}
            variant="preview"
            showActions={false}
          />
        </div>
        
        {storyData.generatedOutline && (
          <div className="verse-generated-content">
            <h4>Generated Story Outline</h4>
            <div className="verse-outline-content">
              {storyData.generatedOutline}
            </div>
          </div>
        )}
        
        <div className="verse-publish-options">
          <label className="verse-checkbox-option">
            <input
              type="checkbox"
              checked={storyData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
            />
            <span className="verse-checkbox-custom"></span>
            <span className="verse-checkbox-label">Make story public</span>
          </label>
          
          <label className="verse-checkbox-option">
            <input
              type="checkbox"
              checked={storyData.allowCollaboration}
              onChange={(e) => handleInputChange('allowCollaboration', e.target.checked)}
            />
            <span className="verse-checkbox-custom"></span>
            <span className="verse-checkbox-label">Allow collaboration</span>
          </label>
        </div>
        
        <div className="verse-content-warnings">
          <label className="verse-form-label">Content Warnings (if any)</label>
          <div className="verse-warning-tags">
            {['Violence', 'Strong Language', 'Adult Themes', 'Scary Content'].map(warning => (
              <label key={warning} className="verse-warning-tag">
                <input
                  type="checkbox"
                  checked={storyData.contentWarnings.includes(warning)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('contentWarnings', [...storyData.contentWarnings, warning]);
                    } else {
                      handleInputChange('contentWarnings', storyData.contentWarnings.filter(w => w !== warning));
                    }
                  }}
                />
                <span className="verse-warning-label">{warning}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
// Replace the renderNavigationButtons function (around line 1160)
const renderNavigationButtons = () => (
  <div className="verse-creation-navigation">
    <div className="verse-nav-left">
      {/* Back button disabled for step 1 */}
      <MysticalButton
        variant="ghost"
        disabled={true}
        className="verse-nav-disabled"
        title="This is the first step"
      >
        ← Previous
      </MysticalButton>
    </div>
    
    <div className="verse-nav-center">
      <MysticalButton
        variant="secondary"
        onClick={saveAsDraft}
        title="Save your progress as a draft (Coming Soon)"
        disabled={true}
      >
        💾 Save Draft
      </MysticalButton>
    </div>
    
    <div className="verse-nav-right">
      <MysticalButton
        variant="ghost"
        disabled={true}
        className="verse-nav-disabled"
        title="More steps coming soon! For now, use the Generate Story button above."
      >
        Next → <span className="verse-coming-soon-small">(Soon)</span>
      </MysticalButton>
    </div>
  </div>
);
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  const getGenreIcon = (genre) => {
    const icons = {
      fantasy: '🏰',
      scifi: '🚀',
      mystery: '🔍',
      horror: '👻',
      romance: '💖',
      adventure: '⚔️',
      drama: '🎭',
      comedy: '😄'
    };
    return icons[genre] || '📖';
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  if (!isAuthenticated && !authState.isAuthenticated) {
    return (
      <div className="verse-creation-unauthorized">
        <MysticalLoading 
          text="Redirecting to login..." 
          variant="mystical"
        />
      </div>
    );
  }

  if (!isAuthenticated && !authState.isAuthenticated) {
  return (
    <MysticalLayout showSidebar={false}>
      <div className="verse-creation-unauthorized">
        <MysticalLoading 
          text="Redirecting to login..." 
          variant="mystical"
        />
      </div>
    </MysticalLayout>
  );
}
  
  return (
  <MysticalLayout>
    <div className="verse-story-create">
      <div className="verse-creation-container">
        <div className="verse-creation-header">
          <h1 className="verse-creation-title">Create Your Story</h1>
          <p className="verse-creation-subtitle">
            Craft an enchanting tale with the power of mystical AI
          </p>
          {renderProgressSteps()}
        </div>
        
        <div className="verse-creation-content">
          <form ref={formRef} className="verse-creation-form">
            {renderStepContent()}
          </form>
        </div>
        
        <div className="verse-creation-footer">
          {renderNavigationButtons()}
        </div>
      </div>
      
      {/* Modals */}
      {showPreview && (
        <MysticalModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Story Preview"
          size="large"
        >
          <StoryCard
            story={{
              title: storyData.title,
              description: storyData.description,
              genre: storyData.genre,
              author: user?.username || 'You'
            }}
            variant="detailed"
          />
        </MysticalModal>
      )}
    </div>
  </MysticalLayout>
);
};

export default MysticalStoryCreate;