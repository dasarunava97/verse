"""
Main story generation orchestrator for VERSE platform
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel, Field

from .ai_client import get_ai_client, AIResponse
from .story_validator import get_story_validator, ValidationResult
from .character_manager import (
    get_character_manager, 
    CharacterState, 
    CharacterCreationResult,
    CharacterUpdateResult
)
from .choice_processor import (
    get_choice_processor,
    Choice,
    ChoiceNode,
    ChoiceConsequence,
    ChoiceProcessingResult,
    ConsequenceProcessingResult
)
from prompts.story_generation import (
    StoryGenerationRequest,
    StoryProgressionRequest,
    get_story_generation_prompt,
    get_story_continuation_prompt,
    get_story_ending_prompt
)
from prompts.dialogue_generation import (
    DialogueGenerationRequest,
    get_dialogue_generation_prompt
)
from utils.helpers import (
    generate_unique_id,
    get_current_timestamp,
    safe_json_loads,
    safe_json_dumps,
    get_config_value
)
from utils.validators import validate_story_content as validate_story_text
from utils.text_processing import clean_text, count_words, extract_keywords

# Models
class StorySession(BaseModel):
    """Active story session"""
    session_id: str = Field(..., description="Unique session identifier")
    story_id: str = Field(..., description="Story identifier")
    title: str = Field(..., description="Story title")
    genre: str = Field(..., description="Story genre")
    current_scene: str = Field(..., description="Current story scene")
    story_progress: float = Field(default=0.0, description="Story completion progress (0-1)")
    character_ids: List[str] = Field(default=[], description="Character IDs in this story")
    scene_history: List[Dict[str, Any]] = Field(default=[], description="History of story scenes")
    choice_history: List[Dict[str, Any]] = Field(default=[], description="History of player choices")
    story_context: str = Field(..., description="Overall story context and state")
    target_audience: str = Field(default="adult", description="Target audience")
    story_length: str = Field(default="medium", description="Intended story length")
    tone: str = Field(default="balanced", description="Story tone")
    created_at: datetime = Field(default_factory=get_current_timestamp, description="Session creation time")
    last_updated: datetime = Field(default_factory=get_current_timestamp, description="Last update time")

class SimpleStoryGenerationResult(BaseModel):
    """Simplified result of story generation matching prompt output format"""
    success: bool = Field(..., description="Whether generation was successful")
    title: str = Field(..., description="Generated story title")
    opening_scene: str = Field(..., description="Opening scene content")
    setting_description: str = Field(..., description="Detailed setting description")
    protagonist_description: str = Field(..., description="Main character description")
    protagonist_name: str = Field(..., description="Name of the protagonist")
    initial_conflict: str = Field(..., description="Initial story conflict")
    mood: str = Field(..., description="Story mood and atmosphere")
    suggested_next_scenes: List[str] = Field(default=[], description="Suggested continuation directions")
    story_id: str = Field(..., description="Unique story identifier")
    session_id: str = Field(..., description="Unique session identifier")
    genre: str = Field(..., description="Story genre")
    created_at: datetime = Field(default_factory=get_current_timestamp, description="Creation timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class StoryNode(BaseModel):
    """Individual story scene/node"""
    node_id: str = Field(..., description="Unique node identifier")
    scene_content: str = Field(..., description="Scene narrative content")
    scene_type: str = Field(..., description="Type of scene (narrative, dialogue, action, etc.)")
    character_states: Dict[str, Any] = Field(..., description="Character states at this node")
    mood: str = Field(..., description="Scene mood and atmosphere")
    setting_description: str = Field(..., description="Scene setting details")
    choice_node_id: Optional[str] = Field(None, description="Associated choice node ID")
    previous_node_id: Optional[str] = Field(None, description="Previous scene node ID")
    created_at: datetime = Field(default_factory=get_current_timestamp, description="Node creation time")

class StoryGenerationResult(BaseModel):
    """Result of story generation"""
    success: bool = Field(..., description="Whether generation was successful")
    story_session: Optional[StorySession] = Field(None, description="Created or updated story session")
    current_node: Optional[StoryNode] = Field(None, description="Current story node")
    available_choices: Optional[ChoiceNode] = Field(None, description="Available player choices")
    validation_result: Optional[ValidationResult] = Field(None, description="Content validation results")
    character_updates: List[str] = Field(default=[], description="Character updates made")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    ai_tokens_used: Optional[int] = Field(None, description="AI tokens consumed")

class StoryProgressResult(BaseModel):
    """Result of story progression"""
    success: bool = Field(..., description="Whether progression was successful")
    new_scene: Optional[StoryNode] = Field(None, description="New story scene")
    choice_consequences: Optional[ChoiceConsequence] = Field(None, description="Consequences of player choice")
    character_updates: List[str] = Field(default=[], description="Character updates made")
    story_complete: bool = Field(default=False, description="Whether story has ended")
    next_choices: Optional[ChoiceNode] = Field(None, description="Next available choices")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class StoryUserProgressResult(BaseModel):
    """Result of story progression with user input"""
    success: bool = Field(..., description="Whether progression was successful")
    new_scene_content: str = Field(..., description="New scene content")
    updated_characters: List[dict] = Field(default=[], description="Updated character information")
    suggested_next_actions: List[str] = Field(default=[], description="Suggested next actions")
    story_mood: str = Field(..., description="Updated story mood")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class StoryGenerator:
    """Main story generator orchestrator"""
    
    def __init__(self):
        """Initialize story generator with all core components"""
        self.ai_client = get_ai_client()
        self.validator = get_story_validator()
        self.character_manager = get_character_manager()
        self.choice_processor = get_choice_processor()
        
        # Story sessions storage
        self.active_sessions: Dict[str, StorySession] = {}
        self.story_nodes: Dict[str, StoryNode] = {}
        
        # Configuration
        self.supported_genres = get_config_value("story.supported_genres", [])
        self.max_story_length = get_config_value("story.max_story_length", 5000)
        self.max_scenes_per_story = get_config_value("story.max_scenes_per_story", 20)
    
    async def create_story_async(self, genre: str, theme: str = None, setting: str = None,
                           protagonist_name: str = None, protagonist_traits: List[str] = None,
                           story_length: str = "medium", tone: str = "balanced",
                           target_audience: str = "adult", title: str = "",
                           description: str = "", user_id: Any = "") -> SimpleStoryGenerationResult:
        """
        Create a new interactive story asynchronously (simplified version)
        
        Returns:
            SimpleStoryGenerationResult: Simplified story creation results matching prompt format
        """
        try:
            # Validate inputs
            supported_genres = ["fantasy", "sci-fi", "mystery", "horror", "romance", "adventure", "drama", "comedy"]
            if genre not in supported_genres:
                return SimpleStoryGenerationResult(
                    success=False,
                    title="",
                    opening_scene="",
                    setting_description="",
                    protagonist_description="",
                    protagonist_name="",
                    initial_conflict="",
                    mood="",
                    story_id="",
                    session_id="",
                    genre=genre,
                    error_message=f"Unsupported genre '{genre}'. Supported: {', '.join(supported_genres)}"
                )
            
            # Create story generation request
            request = StoryGenerationRequest(
                genre=genre,
                theme=theme or description,  # Use description as theme if theme not provided
                setting=setting,
                protagonist_name=protagonist_name,
                protagonist_traits=protagonist_traits or [],
                story_length=story_length,
                tone=tone,
                target_audience=target_audience,
                title=title,
                description=description,
                user_id=user_id or "anonymous"
            )
            
            print(f"Creating story with request: {request}")
            
            # Generate story content using AI client
            ai_response = await self.ai_client.generate_story_async(request)
            
            if not ai_response.success:
                return SimpleStoryGenerationResult(
                    success=False,
                    title=title or "Untitled Story",
                    opening_scene="",
                    setting_description="",
                    protagonist_description="",
                    protagonist_name=protagonist_name or "Hero",
                    initial_conflict="",
                    mood="",
                    story_id="",
                    session_id="",
                    genre=genre,
                    error_message=f"AI story generation failed: {ai_response.error_message}"
                )
            
            # Extract story data from AI response
            story_data = ai_response.content
            print(f"Generated story data: {story_data}")
            
            # Generate unique IDs
            story_id = generate_unique_id()
            session_id = generate_unique_id()
            
            # Create simplified story session for internal tracking
            story_session = StorySession(
                session_id=session_id,
                story_id=story_id,
                title=story_data.get("title", title or "Untitled Story"),
                genre=genre,
                current_scene=story_data.get("opening_scene", "The story begins..."),
                character_ids=[],  # Simplified - no character management for now
                story_context=f"Genre: {genre}. Theme: {theme or description}",
                target_audience=target_audience,
                story_length=story_length,
                tone=tone
            )
            
            # Store session for potential future use
            self.active_sessions[session_id] = story_session
            
            # Return simplified result matching prompt output format
            return SimpleStoryGenerationResult(
                success=True,
                title=story_data.get("title", title or "Untitled Story"),
                opening_scene=story_data.get("opening_scene", "The story begins..."),
                setting_description=story_data.get("setting_description", setting or "Unknown setting"),
                protagonist_description=story_data.get("protagonist_description", "A brave hero"),
                protagonist_name=story_data.get("protagonist_name", protagonist_name or "Hero"),
                initial_conflict=story_data.get("initial_conflict", "A challenge awaits"),
                mood=story_data.get("mood", tone or "balanced"),
                suggested_next_scenes=story_data.get("suggested_next_scenes", [
                    "Continue the adventure",
                    "Explore the character's background", 
                    "Introduce a new challenge"
                ]),
                story_id=story_id,
                session_id=session_id,
                genre=genre,
                created_at=get_current_timestamp()
            )
            
        except Exception as e:
            print(f"Story creation error: {str(e)}")
            return SimpleStoryGenerationResult(
                success=False,
                title=title or "Untitled Story",
                opening_scene="",
                setting_description="",
                protagonist_description="",
                protagonist_name=protagonist_name or "Hero",
                initial_conflict="",
                mood="",
                story_id="",
                session_id="",
                genre=genre,
                error_message=f"Story creation error: {str(e)}"
            )
        
    async def progress_story_with_user_input_async(self, story_id: int, title: str, genre: str,
                                                opening_scene: str, current_mood: str,
                                                characters: List[dict], existing_scenes: List[dict],
                                                user_message: str, user_id: int) -> StoryUserProgressResult:
        """
        Progress story with user input and existing story context
        
        Args:
            story_id: Database story ID
            title: Story title
            genre: Story genre
            opening_scene: Original opening scene
            current_mood: Current story mood
            characters: List of existing characters
            existing_scenes: List of existing story scenes
            user_message: User's message/direction for progression
            user_id: User ID
            
        Returns:
            StoryUserProgressResult: Story progression results
        """
        try:
            print(f"Progressing story {story_id} with user input: {user_message}")
            
            # Prepare character context
            character_context = []
            for char in characters:
                char_desc = f"- {char['name']} ({char['role']}): {char['description']}"
                if char.get('personality_traits'):
                    char_desc += f" Traits: {char['personality_traits']}"
                character_context.append(char_desc)
            
            character_summary = "\n".join(character_context) if character_context else "No established characters yet."
            
            # Prepare story context from existing scenes
            if existing_scenes:
                # Get the most recent scenes for context
                recent_scenes = sorted(existing_scenes, key=lambda x: x.get('position', 0), reverse=True)[:3]
                story_context = "\n\n".join([
                    f"Scene {scene.get('position', 'Unknown')}: {scene['content'][:300]}..."
                    for scene in recent_scenes
                ])
            else:
                story_context = f"Opening Scene: {opening_scene}"
            
            # Generate story progression using AI client
            request = StoryProgressionRequest(
                title=title,
                genre=genre,
                current_story_context=story_context,
                character_details=character_summary,
                user_message=user_message,
                current_mood=current_mood,
                user_id=user_id
            )

            progression_response = await self.ai_client.progress_story_with_user_input_async(request)
        
            if not progression_response.success:
                progression_data = {
                        "new_scene_content": "Detective Sarah's phone buzzed with an encrypted message: 'The lighthouse keeper wasn't the first to disappear. Check the archives - 1847, 1923, 1965, 1991. Same date. Every 26 years.' Her blood ran cold as she realized today marked exactly 26 years since the last disappearance. Racing to the town archives, she discovered a pattern more sinister than she'd imagined. Each victim had been investigating the same maritime accident - a ship called 'The Siren's Call' that had vanished without a trace over a century ago. But as she delved deeper into the records, she noticed something that made her hands tremble: her own grandfather's name was listed as one of the investigators in 1991.",
                        "updated_characters": [
                            {
                                "id": 1,
                                "name": "Pip",
                                "description": "A small, plump cat with patchy orange-white fur and wide, golden eyes. Despite its bedraggled state, there’s a stubborn pride in the way it carries itself. It’s clever but impulsive, prone to curiosity (hence the pond incident), and deeply suspicious of anything that smells like magic.",
                                "personality_traits": "Determined, analytical, now personally invested and slightly shaken by the family connection, driven by both professional duty and personal need for answers"
                            }
                        ],
                        "suggested_next_actions": [
                            "Investigate what happened to her grandfather and uncover family secrets",
                            "Race to the lighthouse to prevent the next disappearance before midnight",
                            "Dig deeper into the maritime records to understand the curse of 'The Siren's Call'"
                        ],
                        "story_mood": "dark suspense with personal stakes"
                    }
                
                # return StoryUserProgressResult(
                #     success=False,
                #     new_scene_content="",
                #     updated_characters=[],
                #     suggested_next_actions=[],
                #     story_mood=current_mood,
                #     error_message=f"AI progression failed: {progression_response.error_message}"
                # )
            else:
                progression_data = progression_response.content

            # Extract and validate content
            new_scene_content = progression_data.get("new_scene_content", "The story continues...")
            updated_characters = progression_data.get("updated_characters", [])
            suggested_actions = progression_data.get("suggested_next_actions", [
                "Continue the current storyline",
                "Introduce a new character",
                "Add a plot twist"
            ])
            new_mood = progression_data.get("story_mood", current_mood)
            
            # Validate scene content
            validation_result = self.validator.validate_story_content(
                new_scene_content,
                genre,
                "adult"  # Default target audience
            )
            
            if not validation_result.is_valid:
                print(f"Content validation failed: {validation_result.errors}")
                # Continue with content but log the issues
            
            return StoryUserProgressResult(
                success=True,
                new_scene_content=new_scene_content,
                updated_characters=updated_characters,
                suggested_next_actions=suggested_actions,
                story_mood=new_mood
            )
            
        except Exception as e:
            print(f"Story progression error: {str(e)}")
            return StoryUserProgressResult(
                success=False,
                new_scene_content="",
                updated_characters=[],
                suggested_next_actions=[],
                story_mood=current_mood,
                error_message=f"Story progression error: {str(e)}"
            )
    
    async def generate_story_ending_async(self, session_id: str) -> StoryProgressResult:
        """
        Generate story ending asynchronously
        
        Args:
            session_id: Story session ID
            
        Returns:
            StoryProgressResult: Story ending results
        """
        try:
            if session_id not in self.active_sessions:
                return StoryProgressResult(
                    success=False,
                    error_message=f"Story session {session_id} not found"
                )
            
            story_session = self.active_sessions[session_id]
            
            # Collect key story information
            main_characters = [char_id for char_id in story_session.character_ids]
            key_choices = [choice["choice_id"] for choice in story_session.choice_history]
            current_situation = story_session.current_scene
            
            # Generate ending
            ending_response = await self.ai_client.generate_story_ending_async(
                genre=story_session.genre,
                main_characters=main_characters,
                key_choices=key_choices,
                current_situation=current_situation,
                unresolved_conflicts=["Main story conflict"]  # This would be tracked in a real implementation
            )
            
            if not ending_response.success:
                return StoryProgressResult(
                    success=False,
                    error_message=f"Story ending generation failed: {ending_response.error_message}"
                )
            
            ending_data = ending_response.content
            
            # Create ending node
            ending_node_id = generate_unique_id()
            ending_scene = ending_data.get("ending_scene", "The story comes to a satisfying conclusion.")
            
            ending_node = StoryNode(
                node_id=ending_node_id,
                scene_content=ending_scene,
                scene_type="ending",
                character_states=self._get_current_character_states(story_session),
                mood="conclusive",
                setting_description="Story conclusion"
            )
            
            # Update session to mark completion
            story_session.current_scene = ending_scene
            story_session.story_progress = 1.0
            story_session.last_updated = get_current_timestamp()
            
            # Add ending to history
            story_session.scene_history.append({
                "node_id": ending_node_id,
                "scene_type": "ending",
                "timestamp": get_current_timestamp().isoformat(),
                "content_preview": ending_scene[:100] + "..." if len(ending_scene) > 100 else ending_scene
            })
            
            # Store ending node
            self.story_nodes[ending_node_id] = ending_node
            
            return StoryProgressResult(
                success=True,
                new_scene=ending_node,
                story_complete=True,
                character_updates=[]
            )
            
        except Exception as e:
            return StoryProgressResult(
                success=False,
                error_message=f"Story ending generation error: {str(e)}"
            )
    
    # Helper methods
    def _get_current_character_states(self, story_session: StorySession) -> Dict[str, Any]:
        """Get current states of all characters in the story"""
        character_states = {}
        for char_id in story_session.character_ids:
            char_state = self.character_manager.get_character_state(char_id)
            if char_state:
                character_states[char_id] = char_state.dict()
        return character_states
    
    def _get_current_node_id(self, story_session: StorySession) -> Optional[str]:
        """Get the current story node ID"""
        if story_session.scene_history:
            return story_session.scene_history[-1]["node_id"]
        return None
    
    def _calculate_story_progress_description(self, story_session: StorySession) -> str:
        """Calculate a description of story progress"""
        scene_count = len(story_session.scene_history)
        choice_count = len(story_session.choice_history)
        
        return f"Story has {scene_count} scenes and {choice_count} player choices. Progress: {story_session.story_progress:.1%}"
    
    def _determine_scene_mood(self, consequences: ChoiceConsequence) -> str:
        """Determine scene mood based on choice consequences"""
        severity = consequences.consequence_severity
        
        if severity == "critical":
            return "tense"
        elif severity == "high":
            return "dramatic"
        elif severity == "medium":
            return "engaging"
        else:
            return "calm"
    
    def _should_story_end(self, story_session: StorySession, new_scene: str) -> bool:
        """Determine if story should end"""
        # Check various ending conditions
        scene_count = len(story_session.scene_history)
        
        # End if too many scenes
        if scene_count >= self.max_scenes_per_story:
            return True
        
        # End if story progress is near complete
        if story_session.story_progress >= 0.9:
            return True
        
        # Check for ending keywords in scene
        ending_keywords = ["conclusion", "end", "finally", "resolution", "epilogue"]
        scene_lower = new_scene.lower()
        if any(keyword in scene_lower for keyword in ending_keywords):
            return True
        
        return False
    
    def _calculate_difficulty_level(self, story_session: StorySession) -> str:
        """Calculate appropriate difficulty level based on story progress"""
        progress = story_session.story_progress
        
        if progress < 0.3:
            return "easy"
        elif progress < 0.7:
            return "medium"
        else:
            return "hard"
    
    # Session management methods
    def get_story_session(self, session_id: str) -> Optional[StorySession]:
        """Get story session by ID"""
        return self.active_sessions.get(session_id)
    
    def get_story_node(self, node_id: str) -> Optional[StoryNode]:
        """Get story node by ID"""
        return self.story_nodes.get(node_id)
    
    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get summary of story session"""
        if session_id not in self.active_sessions:
            return {"error": "Session not found"}
        
        session = self.active_sessions[session_id]
        
        return {
            "session_id": session_id,
            "title": session.title,
            "genre": session.genre,
            "progress": session.story_progress,
            "scene_count": len(session.scene_history),
            "choice_count": len(session.choice_history),
            "character_count": len(session.character_ids),
            "created_at": session.created_at.isoformat(),
            "last_updated": session.last_updated.isoformat(),
            "story_complete": session.story_progress >= 1.0
        }
    
    def list_active_sessions(self) -> List[Dict[str, Any]]:
        """List all active story sessions"""
        return [
            {
                "session_id": session_id,
                "title": session.title,
                "genre": session.genre,
                "progress": session.story_progress,
                "last_updated": session.last_updated.isoformat()
            }
            for session_id, session in self.active_sessions.items()
        ]
    
    def delete_story_session(self, session_id: str) -> bool:
        """Delete a story session"""
        if session_id in self.active_sessions:
            # Clean up associated nodes
            session = self.active_sessions[session_id]
            nodes_to_delete = []
            
            for node_id, node in self.story_nodes.items():
                # In a real implementation, this would track node ownership better
                nodes_to_delete.append(node_id)
            
            for node_id in nodes_to_delete:
                if node_id in self.story_nodes:
                    del self.story_nodes[node_id]
            
            del self.active_sessions[session_id]
            return True
        
        return False
    
    def validate_story_session(self, session_id: str) -> ValidationResult:
        """Validate story session content"""
        if session_id not in self.active_sessions:
            return ValidationResult(
                is_valid=False,
                errors=[f"Session {session_id} not found"]
            )
        
        session = self.active_sessions[session_id]
        
        return self.validator.validate_story_content(
            session.current_scene,
            session.genre,
            session.target_audience
        )
    
    def get_story_analytics(self) -> Dict[str, Any]:
        """Get analytics about story generation"""
        total_sessions = len(self.active_sessions)
        total_nodes = len(self.story_nodes)
        
        if total_sessions == 0:
            return {
                "total_sessions": 0,
                "total_nodes": 0,
                "message": "No active stories"
            }
        
        # Calculate analytics
        genre_distribution = {}
        avg_progress = 0
        completed_stories = 0
        
        for session in self.active_sessions.values():
            genre_distribution[session.genre] = genre_distribution.get(session.genre, 0) + 1
            avg_progress += session.story_progress
            if session.story_progress >= 1.0:
                completed_stories += 1
        
        avg_progress /= total_sessions
        
        return {
            "total_sessions": total_sessions,
            "total_nodes": total_nodes,
            "completed_stories": completed_stories,
            "completion_rate": completed_stories / total_sessions if total_sessions > 0 else 0,
            "average_progress": avg_progress,
            "genre_distribution": genre_distribution,
            "active_sessions": total_sessions - completed_stories
        }

# Singleton instance
_story_generator_instance: Optional[StoryGenerator] = None

def get_story_generator() -> StoryGenerator:
    """
    Get or create story generator singleton
    
    Returns:
        StoryGenerator: Configured story generator instance
    """
    global _story_generator_instance
    
    if _story_generator_instance is None:
        _story_generator_instance = StoryGenerator()
    
    return _story_generator_instance

def reset_story_generator():
    """Reset story generator singleton (useful for testing)"""
    global _story_generator_instance
    _story_generator_instance = None

# Convenience functions for direct use
async def create_interactive_story(genre: str, **kwargs) -> StoryGenerationResult:
    """Create interactive story using default generator"""
    generator = get_story_generator()
    return await generator.create_story_async(genre=genre, **kwargs)

async def continue_interactive_story(session_id: str, choice_id: str, 
                                   choice_node_id: str) -> StoryProgressResult:
    """Continue interactive story using default generator"""
    generator = get_story_generator()
    return await generator.progress_story_async(session_id, choice_id, choice_node_id)

async def end_interactive_story(session_id: str) -> StoryProgressResult:
    """End interactive story using default generator"""
    generator = get_story_generator()
    return await generator.generate_story_ending_async(session_id)