import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import MysticalButton from '../components/common/Button.jsx';
import MysticalModal from '../components/common/Modal.jsx';
import './StoryCreate.css';


const StoryModal = ({
        showStoryPreview,
        setShowStoryPreview,
        storyData = {},
        setStoryData,
        setCurrentStep = null,
        addNotification = null,
        CREATION_STEPS = {},
        setStoryProgression = null,
        storyProgression = {}
    }) => {
    // console.log('Opening story preview modal for story 2:', storyData);

    const { authState, progressStories } = useAuth();
    const latestProgressionRef = useRef(null);

    // const [storyProgression, setStoryProgression] = useState({
    //     nextSceneInput: '',
    //     isProgressing: false,
    //     progressionHistory: [], // Will store new scene parts as they're added
    //     currentStoryId: null
    // });

    const handleSuggestionClick = (suggestionText) => {
      setStoryProgression({
          ...storyProgression,
          nextSceneInput: suggestionText
      });
      };

    const handleStoryProgression = async () => {
        
        try {
        console.log('Starting story progression...');
        setStoryProgression({ ...storyProgression, isProgressing: true });
        let generatedStory = storyData.generatedStory;
        
        const progressionData = {
            story_id: generatedStory?.story_id || storyData.storyId,
            user_message: storyProgression.nextSceneInput,
            user_id: authState.user?.userId
        };
        
        console.log('Progression data being sent:', progressionData);
        
        const response = await progressStories(progressionData);
        console.log('Received progression response:', response);
        
        if (response.data && response.data.success) {
            // Add the new scene content to progression history
            const newProgressionEntry = {
            scene_content: response.data.new_scene_content,
            suggested_actions: response.data.suggested_next_actions || [],
            created_at: response.data.created_at || new Date().toISOString(),
            node_id: response.data.new_node_id
            };
            generatedStory.suggested_next_scenes = response.data.suggested_next_actions || generatedStory.suggested_next_scenes;
            response.data.updated_characters.forEach(char => {
                const existingCharIndex = generatedStory.characters.findIndex(c => c.id === char.id);
                if (existingCharIndex !== -1) {
                    // Update existing character
                    generatedStory.characters[existingCharIndex] = char;
                } else {
                    // Add new character
                    generatedStory.characters.push(char);
                }
            });
            
            setStoryProgression({
              ...storyProgression,
              progressionHistory: storyProgression.progressionHistory.concat(newProgressionEntry),
              nextSceneInput: '', // Clear the input after successful progression
              isProgressing: false
            })

            setStoryData(prev => ({
            ...prev,
            generatedStory: generatedStory,
            }));

            setTimeout(() => {
                if (latestProgressionRef.current) {
                    latestProgressionRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                    
                    // Optional: Add a brief highlight effect
                    latestProgressionRef.current.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.5)';
                    setTimeout(() => {
                        if (latestProgressionRef.current) {
                            latestProgressionRef.current.style.boxShadow = '';
                        }
                    }, 2000);
                }
            }, 100);
            
            addNotification({
            type: 'success',
            title: 'Story Continued!',
            message: 'Your story has been successfully progressed with the new scene.'
            });
        } else {
            throw new Error(response?.error_message || 'Story progression failed');
        }
        
        } catch (error) {
        console.error('Story progression failed:', error);
        
        let errorMessage = 'Failed to continue story. Please try again.';
        if (error.response?.data?.detail) {
            errorMessage = Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map(err => err.msg).join(', ')
            : error.response.data.detail;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        addNotification({
            type: 'error',
            title: 'Story Progression Failed',
            message: errorMessage
        });
        
          setStoryProgression({ ...storyProgression, isProgressing: false });
        }
    };

    useEffect(() => {
        if (!showStoryPreview) {
            setStoryProgression({
              ...storyProgression,
              isProgressing: false,
                progressionHistory: [],
                currentStoryId: null
            })
        }
    }, [showStoryPreview]);

    return (
        <MysticalModal
            isOpen={showStoryPreview}
            onClose={() => {
              setShowStoryPreview(false);
              // Reset progression state when modal closes
              // setStoryProgression({
              //   nextSceneInput: '',
              //   isProgressing: false,
              //   progressionHistory: [],
              //   currentStoryId: null
              // });
              storyProgression && storyProgression(storyProgression);
            }}
            title=""
            size="xl"
            className="verse-story-preview-modal"
          >
            {storyData?.generatedStory && (
              <div className="verse-story-preview-container">
                {/* Story Header */}
                <div className="verse-story-header-section">
                  <div className="verse-story-success-badge">
                    <span className="verse-success-icon">✨</span>
                    <span className="verse-success-text">Story Created Successfully!</span>
                  </div>
                  
                  <h1 className="verse-story-preview-title">{storyData.generatedStory.title}</h1>
                  
                  <div className="verse-story-meta-info">
                    <div className="verse-meta-item">
                      <span className="verse-meta-icon">🏷️</span>
                      <span className="verse-meta-label">Genre:</span>
                      <span className="verse-meta-value">{storyData.generatedStory.genre}</span>
                    </div>
                    <div className="verse-meta-item">
                      <span className="verse-meta-icon">👤</span>
                      <span className="verse-meta-label">Protagonist:</span>
                      <span className="verse-meta-value">
                        {storyData.generatedStory.characters.find(c => c.role === 'Protagonist')?.name ||
                        storyData.generatedStory.characters?.[0]?.name || 'Unknown Protagonist'}</span>
                    </div>
                    <div className="verse-meta-item">
                      <span className="verse-meta-icon">🌙</span>
                      <span className="verse-meta-label">Mood:</span>
                      <span className="verse-meta-value">{storyData.generatedStory.mood}</span>
                    </div>
                    <div className="verse-meta-item">
                      <span className="verse-meta-icon">🆔</span>
                      <span className="verse-meta-label">Story ID:</span>
                      <span className="verse-meta-value">#{storyData.generatedStory.story_id}</span>
                    </div>
                  </div>
                </div>
        
                {/* Story Content Sections */}
                <div className="verse-story-content-sections">
                  
                  {/* Opening Scene */}
                  <div className="verse-content-section verse-opening-section">
                    <div className="verse-section-header">
                      <h3 className="verse-section-title">
                        <span className="verse-section-icon">📖</span>
                        Opening Scene
                      </h3>
                      <div className="verse-section-badge">The Beginning</div>
                    </div>
                    <div className="verse-opening-content">
                      <div className="verse-opening-text">
                        {storyData.generatedStory.opening_scene}
                      </div>
                    </div>
                  </div>
        
                  {/* Show progression history if any */}
                  {storyProgression.progressionHistory.map((progression, index) => {

                    return (
                      <div key={`progression-${index}`} 
                           className="verse-content-section verse-progression-section"
                           ref={index === storyProgression.progressionHistory.length - 1 ? latestProgressionRef : null}
                        style={index === storyProgression.progressionHistory.length - 1 ? {
                            transition: 'all 0.3s ease-in-out',
                            position: 'relative'
                        } : {}}>
                      <div className="verse-section-header">
                        <h3 className="verse-section-title">
                          <span className="verse-section-icon">📜</span>
                          Part {index + 1}
                        </h3>
                        <div className="verse-section-badge">Continued</div>
                      </div>
                      <div className="verse-progression-content">
                        <div className="verse-progression-text">
                          {progression.scene_content}
                        </div>
                      </div>
                    </div>
                  )})}
        
                  {/* World & Setting */}
                  <div className="verse-content-section verse-setting-section">
                    <div className="verse-section-header">
                      <h3 className="verse-section-title">
                        <span className="verse-section-icon">🌍</span>
                        World & Setting
                      </h3>
                      <div className="verse-section-badge">Environment</div>
                    </div>
                    <div className="verse-setting-content">
                      <p className="verse-setting-description">
                        {storyData.generatedStory.mood}
                      </p>
                    </div>
                  </div>
        
                  {/* Character Profile */}
                  <div className="verse-content-section verse-character-section">
                    <div className="verse-section-header">
                      <h3 className="verse-section-title">
                        <span className="verse-section-icon">🎭</span>
                        Main Character
                      </h3>
                      <div className="verse-section-badge">Protagonist</div>
                    </div>
                    <div className="verse-character-content">
                      <div className="verse-character-name-card">
                        <h4 className="verse-character-name">{storyData.generatedStory.characters.find(c => c.role === 'Protagonist')?.name ||
                        storyData.generatedStory.characters?.[0]?.name || 'Unknown Protagonist'}</h4>
                        <p className="verse-character-description">
                          {storyData.generatedStory.characters.find(c => c.role === 'Protagonist')?.description ||
                          storyData.generatedStory.characters?.[0]?.description || 'No description available.'}
                        </p>
                      </div>
                    </div>
                  </div>
        
                  {/* Story Conflict */}
                  <div className="verse-content-section verse-conflict-section">
                    <div className="verse-section-header">
                      <h3 className="verse-section-title">
                        <span className="verse-section-icon">⚔️</span>
                        Initial Conflict
                      </h3>
                      <div className="verse-section-badge">Challenge</div>
                    </div>
                    <div className="verse-conflict-content">
                      <p className="verse-conflict-description">
                        {storyData.generatedStory.initial_conflict}
                      </p>
                    </div>
                  </div>
        
                  {/* Next Scenes Suggestions - Get the latest suggestions */}
                  <div className="verse-content-section verse-suggestions-section">
                    <div className="verse-section-header">
                      <h3 className="verse-section-title">
                        <span className="verse-section-icon">🔮</span>
                        Story Paths
                      </h3>
                      <div className="verse-section-badge">What's Next?</div>
                    </div>
                    <div className="verse-suggestions-content">
                      <p className="verse-suggestions-intro">
                        Your story can continue in several fascinating directions:
                      </p>
                      <div className="verse-suggestions-list">
                        {/* Show latest suggestions (either from progression or original) */}
                        {(storyProgression.progressionHistory.length > 0 
                          ? storyProgression.progressionHistory[storyProgression.progressionHistory.length - 1].suggested_actions || storyData.generatedStory.suggested_next_scenes
                          : storyData.generatedStory.suggested_next_scenes
                        ).map((suggestion, index) => (
                          <div 
                            key={index} 
                            className="verse-suggestion-card verse-suggestion-clickable"
                            onClick={() => handleSuggestionClick(suggestion)}
                            style={{ cursor: 'pointer' }}
                            title="Click to use this suggestion for your next scene"
                          >
                            <div className="verse-suggestion-number">{index + 1}</div>
                            <div className="verse-suggestion-text">{suggestion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
        
                  {/* Story Progression Input Section */}
                  <div className="verse-content-section verse-progression-input-section">
                    <div className="verse-section-header">
                      <h3 className="verse-section-title">
                        <span className="verse-section-icon">✍️</span>
                        Continue Your Story
                      </h3>
                      <div className="verse-section-badge">Your Turn</div>
                    </div>
                    <div className="verse-progression-input-content">
                      <div className="verse-form-group">
                        <label className="verse-form-label">Describe Next Scene</label>
                        <textarea
                          className="verse-progression-textarea"
                          value={storyProgression.nextSceneInput}
                          onChange={(e) => setStoryProgression(prev => ({
                            ...prev,
                            nextSceneInput: e.target.value
                          }))}
                          placeholder="Describe what happens next in your story... You can click on the story path suggestions above to use them, or write your own direction."
                          rows={4}
                          disabled={storyProgression.isProgressing}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: 'rgba(51, 65, 85, 0.8)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '0.75rem',
                            color: '#e2e8f0',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            minHeight: '100px'
                          }}
                        />
                        <p className="verse-helper-text">
                          💡 Tip: Click on any story path suggestion above to use it, or write your own creative direction
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
        
                {/* Story Actions */}
                <div className="verse-story-actions-section">
                  <div className="verse-actions-grid">
                    <MysticalButton
                      variant="primary"
                      size="lg"
                      onClick={() => handleStoryProgression(storyData, setStoryData, addNotification)}
                      disabled={!storyProgression.nextSceneInput.trim() || storyProgression.isProgressing}
                      loading={storyProgression.isProgressing}
                      className="verse-action-primary"
                    >
                      {storyProgression.isProgressing ? (
                        <>
                          <span className="verse-btn-icon">⏳</span>
                          <span className="verse-btn-text">Continuing Story...</span>
                        </>
                      ) : (
                        <>
                          <span className="verse-btn-icon">📖</span>
                          <span className="verse-btn-text">Continue Story</span>
                        </>
                      )}
                    </MysticalButton>
                    
                    <MysticalButton
                      variant="secondary"
                      size="lg"
                      onClick={() => {
                        setShowStoryPreview(false);
                        addNotification({
                          type: 'info',
                          title: 'Story Reading Feature',
                          message: 'Interactive story reading will be available in the next update!'
                        });
                      }}
                      className="verse-action-secondary"
                    >
                      <span className="verse-btn-icon">📚</span>
                      <span className="verse-btn-text">Read Full Story</span>
                    </MysticalButton>
                    
                    <MysticalButton
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        // Create new story
                        setStoryData({
                          title: '',
                          concept: '',
                          genre: '',
                          type: 'interactive',
                          description: '',
                          tone: '',
                          perspective: 'second',
                          targetAudience: 'young_adult',
                          estimatedLength: 'medium',
                          mainCharacter: { name: '', description: '', personality: '', background: '' },
                          supportingCharacters: [],
                          setting: { timeframe: '', location: '', worldDescription: '', atmosphere: '' },
                          generationSettings: { creativity: 70, complexity: 50, interactivity: 80, aiAssistance: true, generateOutline: true, generateFirstChapter: false },
                          tags: [],
                          isPublic: true,
                          allowCollaboration: false,
                          contentWarnings: []
                        });
                        setStoryProgression({
                          nextSceneInput: '',
                          isProgressing: false,
                          progressionHistory: [],
                          currentStoryId: null
                        });
                        setShowStoryPreview(false);
                        if (setCurrentStep) {
                            setCurrentStep(CREATION_STEPS.CONCEPT);
                        }
                        addNotification({
                          type: 'success',
                          title: 'New Story Started',
                          message: 'Ready to create another mystical tale!'
                        });
                      }}
                      className="verse-action-new"
                    >
                      <span className="verse-btn-icon">✨</span>
                      <span className="verse-btn-text">Create New Story</span>
                    </MysticalButton>
                    
                    <MysticalButton
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setShowStoryPreview(false);
                        setStoryProgression({
                          nextSceneInput: '',
                          isProgressing: false,
                          progressionHistory: [],
                          currentStoryId: null
                        });
                      }}
                      className="verse-action-close"
                    >
                      Close Preview
                    </MysticalButton>
                  </div>
                  
                  <div className="verse-story-info-footer">
                    <p className="verse-footer-text">
                      <span className="verse-footer-icon">🕒</span>
                      Created on {new Date(storyData.generatedStory.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="verse-footer-text">
                      <span className="verse-footer-icon">🔗</span>
                      Session ID: {storyData.generatedStory.session_id}
                    </p>
                    {storyProgression.progressionHistory.length > 0 && (
                      <p className="verse-footer-text">
                        <span className="verse-footer-icon">📊</span>
                        Story Parts: {storyProgression.progressionHistory.length + 1} (Original + {storyProgression.progressionHistory.length} continued)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </MysticalModal>
    )
};

export default React.memo(StoryModal);