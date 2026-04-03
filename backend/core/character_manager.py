"""
Character management and consistency for VERSE platform
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel, Field

from .ai_client import get_ai_client, AIResponse
from .story_validator import get_story_validator, ValidationResult
from prompts.character_creation import (
    CharacterCreationRequest,
    CharacterUpdateRequest,
    get_character_creation_prompt,
    get_character_update_prompt,
    get_character_description_prompt
)
from utils.helpers import (
    generate_unique_id,
    get_current_timestamp,
    safe_json_loads,
    safe_json_dumps,
    get_config_value
)
from utils.validators import validate_username, validate_story_content
from utils.text_processing import clean_text, extract_keywords

# Models
class CharacterState(BaseModel):
    """Current state of a character"""
    character_id: str = Field(..., description="Unique character identifier")
    name: str = Field(..., description="Character name")
    current_emotional_state: str = Field(..., description="Current emotional state")
    personality_traits: Dict[str, str] = Field(..., description="Core personality traits")
    current_goals: List[str] = Field(default=[], description="Current character goals")
    relationships: Dict[str, str] = Field(default={}, description="Relationships with other characters")
    character_arc_progress: float = Field(default=0.0, description="Character development progress (0-1)")
    last_updated: datetime = Field(default_factory=get_current_timestamp, description="Last update timestamp")

class CharacterMemory(BaseModel):
    """Character memory and development tracking"""
    character_id: str = Field(..., description="Character identifier")
    significant_events: List[Dict[str, Any]] = Field(default=[], description="Important events affecting character")
    relationship_history: Dict[str, List[str]] = Field(default={}, description="History of relationship changes")
    personality_evolution: List[Dict[str, Any]] = Field(default=[], description="How personality has evolved")
    dialogue_samples: List[str] = Field(default=[], description="Sample dialogue for voice consistency")

class CharacterCreationResult(BaseModel):
    """Result of character creation"""
    success: bool = Field(..., description="Whether creation was successful")
    character_data: Optional[Dict[str, Any]] = Field(None, description="Created character data")
    character_state: Optional[CharacterState] = Field(None, description="Initial character state")
    validation_result: Optional[ValidationResult] = Field(None, description="Validation results")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class CharacterUpdateResult(BaseModel):
    """Result of character update"""
    success: bool = Field(..., description="Whether update was successful")
    updated_state: Optional[CharacterState] = Field(None, description="Updated character state")
    changes_made: List[str] = Field(default=[], description="List of changes made")
    validation_result: Optional[ValidationResult] = Field(None, description="Validation results")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class CharacterManager:
    """Manages character creation, development, and consistency"""
    
    def __init__(self):
        """Initialize character manager"""
        self.ai_client = get_ai_client()
        self.validator = get_story_validator()
        self.character_states: Dict[str, CharacterState] = {}
        self.character_memories: Dict[str, CharacterMemory] = {}
        self.supported_genres = get_config_value("story.supported_genres", [])
    
    async def create_character_async(self, name: str, role: str, genre: str,
                                   age_range: str = None, personality_traits: List[str] = None,
                                   background: str = None, motivation: str = None,
                                   relationships: Dict[str, str] = None) -> CharacterCreationResult:
        """
        Create a new character asynchronously
        
        Args:
            name: Character name
            role: Character role (protagonist, antagonist, supporting)
            genre: Story genre
            age_range: Age range (child, teen, adult, elderly)
            personality_traits: Desired personality traits
            background: Character background
            motivation: Character motivation
            relationships: Initial relationships
            
        Returns:
            CharacterCreationResult: Creation results
        """
        try:
            # Validate inputs
            name_validation = validate_username(name)
            if not name_validation["is_valid"]:
                return CharacterCreationResult(
                    success=False,
                    error_message=f"Invalid character name: {', '.join(name_validation['errors'])}"
                )
            
            if genre not in self.supported_genres:
                return CharacterCreationResult(
                    success=False,
                    error_message=f"Unsupported genre '{genre}'. Supported: {', '.join(self.supported_genres)}"
                )
            
            # Create character creation request
            request = CharacterCreationRequest(
                name=name,
                role=role,
                genre=genre,
                age_range=age_range,
                personality_traits=personality_traits or [],
                background=background,
                motivation=motivation,
                relationships=relationships or {}
            )
            
            # Generate character using AI
            ai_response = await self.ai_client.create_character_async(request)
            
            if not ai_response.success:
                return CharacterCreationResult(
                    success=False,
                    error_message=f"AI character generation failed: {ai_response.error_message}"
                )
            
            character_data = ai_response.content
            
            # Validate generated character
            validation_result = self.validator.validate_character_content(character_data)
            
            if not validation_result.is_valid:
                return CharacterCreationResult(
                    success=False,
                    validation_result=validation_result,
                    error_message=f"Character validation failed: {', '.join(validation_result.errors)}"
                )
            
            # Create character state
            character_id = generate_unique_id()
            character_state = CharacterState(
                character_id=character_id,
                name=name,
                current_emotional_state="neutral",
                personality_traits=character_data.get("personality_profile", {}),
                current_goals=[character_data.get("motivations", ["Survive the story"])[0]],
                relationships=character_data.get("relationships", {}),
                character_arc_progress=0.0
            )
            
            # Create character memory
            character_memory = CharacterMemory(
                character_id=character_id,
                significant_events=[{
                    "event": "Character created",
                    "timestamp": get_current_timestamp().isoformat(),
                    "impact": "Initial character establishment"
                }],
                dialogue_samples=[character_data.get("speech_patterns", "")]
            )
            
            # Store character data
            self.character_states[character_id] = character_state
            self.character_memories[character_id] = character_memory
            
            return CharacterCreationResult(
                success=True,
                character_data=character_data,
                character_state=character_state,
                validation_result=validation_result
            )
            
        except Exception as e:
            return CharacterCreationResult(
                success=False,
                error_message=f"Character creation error: {str(e)}"
            )
    
    def create_character(self, name: str, role: str, genre: str,
                        age_range: str = None, personality_traits: List[str] = None,
                        background: str = None, motivation: str = None,
                        relationships: Dict[str, str] = None) -> CharacterCreationResult:
        """
        Create a new character synchronously
        
        Args:
            name: Character name
            role: Character role
            genre: Story genre
            age_range: Age range
            personality_traits: Desired personality traits
            background: Character background
            motivation: Character motivation
            relationships: Initial relationships
            
        Returns:
            CharacterCreationResult: Creation results
        """
        try:
            # Validate inputs
            name_validation = validate_username(name)
            if not name_validation["is_valid"]:
                return CharacterCreationResult(
                    success=False,
                    error_message=f"Invalid character name: {', '.join(name_validation['errors'])}"
                )
            
            # Create character creation request
            request = CharacterCreationRequest(
                name=name,
                role=role,
                genre=genre,
                age_range=age_range,
                personality_traits=personality_traits or [],
                background=background,
                motivation=motivation,
                relationships=relationships or {}
            )
            
            # Generate character using AI
            ai_response = self.ai_client.create_character(request)
            
            if not ai_response.success:
                return CharacterCreationResult(
                    success=False,
                    error_message=f"AI character generation failed: {ai_response.error_message}"
                )
            
            character_data = ai_response.content
            
            # Validate generated character
            validation_result = self.validator.validate_character_content(character_data)
            
            # Create character state even if validation has warnings
            character_id = generate_unique_id()
            character_state = CharacterState(
                character_id=character_id,
                name=name,
                current_emotional_state="neutral",
                personality_traits=character_data.get("personality_profile", {}),
                current_goals=[character_data.get("motivations", ["Survive the story"])[0]],
                relationships=character_data.get("relationships", {}),
                character_arc_progress=0.0
            )
            
            # Store character data
            self.character_states[character_id] = character_state
            self.character_memories[character_id] = CharacterMemory(
                character_id=character_id,
                significant_events=[{
                    "event": "Character created",
                    "timestamp": get_current_timestamp().isoformat(),
                    "impact": "Initial character establishment"
                }]
            )
            
            return CharacterCreationResult(
                success=True,
                character_data=character_data,
                character_state=character_state,
                validation_result=validation_result
            )
            
        except Exception as e:
            return CharacterCreationResult(
                success=False,
                error_message=f"Character creation error: {str(e)}"
            )
    
    async def update_character_async(self, character_id: str, story_events: List[str],
                                   new_relationships: Dict[str, str] = None,
                                   emotional_state: str = None) -> CharacterUpdateResult:
        """
        Update character based on story events asynchronously
        
        Args:
            character_id: Character to update
            story_events: Recent story events affecting the character
            new_relationships: New or changed relationships
            emotional_state: New emotional state
            
        Returns:
            CharacterUpdateResult: Update results
        """
        try:
            if character_id not in self.character_states:
                return CharacterUpdateResult(
                    success=False,
                    error_message=f"Character {character_id} not found"
                )
            
            current_state = self.character_states[character_id]
            current_memory = self.character_memories.get(character_id, CharacterMemory(character_id=character_id))
            
            # Prepare update request
            ai_response = await self.ai_client.update_character_async(
                character_name=current_state.name,
                current_personality=current_state.personality_traits,
                current_relationships=current_state.relationships,
                previous_emotional_state=current_state.current_emotional_state,
                story_events=story_events,
                new_relationships=new_relationships or {}
            )
            
            if not ai_response.success:
                return CharacterUpdateResult(
                    success=False,
                    error_message=f"AI character update failed: {ai_response.error_message}"
                )
            
            update_data = ai_response.content
            changes_made = []
            
            # Update character state
            if "emotional_state" in update_data:
                old_state = current_state.current_emotional_state
                current_state.current_emotional_state = update_data["emotional_state"]
                changes_made.append(f"Emotional state: {old_state} → {update_data['emotional_state']}")
            
            if "relationship_updates" in update_data:
                for char_name, relationship in update_data["relationship_updates"].items():
                    old_relationship = current_state.relationships.get(char_name, "unknown")
                    current_state.relationships[char_name] = relationship
                    changes_made.append(f"Relationship with {char_name}: {old_relationship} → {relationship}")
            
            if "new_motivations" in update_data:
                current_state.current_goals.extend(update_data["new_motivations"])
                changes_made.append(f"Added goals: {', '.join(update_data['new_motivations'])}")
            
            if "personality_changes" in update_data and update_data["personality_changes"]:
                changes_made.append(f"Personality shift: {update_data['personality_changes']}")
            
            # Update character development progress
            if story_events:
                current_state.character_arc_progress = min(1.0, current_state.character_arc_progress + 0.1)
                changes_made.append(f"Character development progress: {current_state.character_arc_progress:.1f}")
            
            # Update memory
            for event in story_events:
                current_memory.significant_events.append({
                    "event": event,
                    "timestamp": get_current_timestamp().isoformat(),
                    "impact": update_data.get("character_growth", "Character development")
                })
            
            # Update timestamp
            current_state.last_updated = get_current_timestamp()
            
            # Store updated data
            self.character_states[character_id] = current_state
            self.character_memories[character_id] = current_memory
            
            return CharacterUpdateResult(
                success=True,
                updated_state=current_state,
                changes_made=changes_made
            )
            
        except Exception as e:
            return CharacterUpdateResult(
                success=False,
                error_message=f"Character update error: {str(e)}"
            )
    
    def update_character(self, character_id: str, story_events: List[str],
                        new_relationships: Dict[str, str] = None,
                        emotional_state: str = None) -> CharacterUpdateResult:
        """
        Update character based on story events synchronously
        
        Args:
            character_id: Character to update
            story_events: Recent story events affecting the character
            new_relationships: New or changed relationships
            emotional_state: New emotional state
            
        Returns:
            CharacterUpdateResult: Update results
        """
        try:
            if character_id not in self.character_states:
                return CharacterUpdateResult(
                    success=False,
                    error_message=f"Character {character_id} not found"
                )
            
            current_state = self.character_states[character_id]
            
            # Simple update for synchronous version
            changes_made = []
            
            if emotional_state and emotional_state != current_state.current_emotional_state:
                old_state = current_state.current_emotional_state
                current_state.current_emotional_state = emotional_state
                changes_made.append(f"Emotional state: {old_state} → {emotional_state}")
            
            if new_relationships:
                for char_name, relationship in new_relationships.items():
                    old_relationship = current_state.relationships.get(char_name, "unknown")
                    current_state.relationships[char_name] = relationship
                    changes_made.append(f"Relationship with {char_name}: {old_relationship} → {relationship}")
            
            # Update development progress
            if story_events:
                current_state.character_arc_progress = min(1.0, current_state.character_arc_progress + 0.05)
                changes_made.append(f"Character development progress: {current_state.character_arc_progress:.1f}")
            
            current_state.last_updated = get_current_timestamp()
            
            return CharacterUpdateResult(
                success=True,
                updated_state=current_state,
                changes_made=changes_made
            )
            
        except Exception as e:
            return CharacterUpdateResult(
                success=False,
                error_message=f"Character update error: {str(e)}"
            )
    
    def get_character_state(self, character_id: str) -> Optional[CharacterState]:
        """
        Get current character state
        
        Args:
            character_id: Character identifier
            
        Returns:
            CharacterState: Current character state or None if not found
        """
        return self.character_states.get(character_id)
    
    def get_character_memory(self, character_id: str) -> Optional[CharacterMemory]:
        """
        Get character memory and development history
        
        Args:
            character_id: Character identifier
            
        Returns:
            CharacterMemory: Character memory or None if not found
        """
        return self.character_memories.get(character_id)
    
    def get_all_characters(self) -> Dict[str, CharacterState]:
        """
        Get all character states
        
        Returns:
            Dict: All character states by ID
        """
        return self.character_states.copy()
    
    def validate_character_consistency(self, character_id: str, new_dialogue: str) -> ValidationResult:
        """
        Validate dialogue consistency with character
        
        Args:
            character_id: Character identifier
            new_dialogue: New dialogue to validate
            
        Returns:
            ValidationResult: Validation results
        """
        if character_id not in self.character_states:
            return ValidationResult(
                is_valid=False,
                errors=[f"Character {character_id} not found"]
            )
        
        character_state = self.character_states[character_id]
        character_memory = self.character_memories.get(character_id)
        
        # Create character context for validation
        character_context = {
            "name": character_state.name,
            "personality_traits": character_state.personality_traits,
            "emotional_state": character_state.current_emotional_state,
            "dialogue_history": character_memory.dialogue_samples if character_memory else []
        }
        
        dialogue_data = {
            "dialogue_text": new_dialogue,
            "speaker_character": character_state.name
        }
        
        return self.validator.validate_dialogue_content(dialogue_data, character_context)
    
    def add_dialogue_sample(self, character_id: str, dialogue: str):
        """
        Add dialogue sample to character memory for consistency
        
        Args:
            character_id: Character identifier
            dialogue: Dialogue sample to add
        """
        if character_id in self.character_memories:
            memory = self.character_memories[character_id]
            memory.dialogue_samples.append(dialogue)
            
            # Keep only recent samples (max 10)
            if len(memory.dialogue_samples) > 10:
                memory.dialogue_samples = memory.dialogue_samples[-10:]
    
    def get_character_relationships(self, character_id: str) -> Dict[str, str]:
        """
        Get character's current relationships
        
        Args:
            character_id: Character identifier
            
        Returns:
            Dict: Character relationships
        """
        if character_id in self.character_states:
            return self.character_states[character_id].relationships.copy()
        return {}
    
    def get_character_development_summary(self, character_id: str) -> Dict[str, Any]:
        """
        Get character development summary
        
        Args:
            character_id: Character identifier
            
        Returns:
            Dict: Character development summary
        """
        if character_id not in self.character_states:
            return {"error": "Character not found"}
        
        state = self.character_states[character_id]
        memory = self.character_memories.get(character_id)
        
        return {
            "name": state.name,
            "current_emotional_state": state.current_emotional_state,
            "development_progress": state.character_arc_progress,
            "current_goals": state.current_goals,
            "relationships": state.relationships,
            "significant_events_count": len(memory.significant_events) if memory else 0,
            "last_updated": state.last_updated.isoformat()
        }
    
    def reset_character(self, character_id: str):
        """
        Reset character to initial state (for testing or story restart)
        
        Args:
            character_id: Character identifier
        """
        if character_id in self.character_states:
            state = self.character_states[character_id]
            state.current_emotional_state = "neutral"
            state.character_arc_progress = 0.0
            state.current_goals = state.current_goals[:1]  # Keep only first goal
            state.last_updated = get_current_timestamp()
            
        if character_id in self.character_memories:
            memory = self.character_memories[character_id]
            memory.significant_events = [memory.significant_events[0]]  # Keep only creation event
            memory.personality_evolution = []

# Singleton instance
_character_manager_instance: Optional[CharacterManager] = None

def get_character_manager() -> CharacterManager:
    """
    Get or create character manager singleton
    
    Returns:
        CharacterManager: Configured character manager instance
    """
    global _character_manager_instance
    
    if _character_manager_instance is None:
        _character_manager_instance = CharacterManager()
    
    return _character_manager_instance

def reset_character_manager():
    """Reset character manager singleton (useful for testing)"""
    global _character_manager_instance
    _character_manager_instance = None
    