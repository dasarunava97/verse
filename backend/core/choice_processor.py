"""
Choice processing and consequence management for VERSE platform
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel, Field

from .ai_client import get_ai_client, AIResponse
from .story_validator import get_story_validator, ValidationResult
from .character_manager import get_character_manager, CharacterState
from prompts.choice_generation import (
    ChoiceGenerationRequest,
    ChoiceConsequenceRequest,
    get_choice_generation_prompt,
    get_choice_consequence_prompt,
    get_choice_validation_prompt
)
from utils.helpers import (
    generate_unique_id,
    get_current_timestamp,
    safe_json_loads,
    safe_json_dumps,
    get_config_value
)
from utils.validators import validate_choice_text, validate_positive_integer
from utils.text_processing import clean_text, count_words

# Models
class Choice(BaseModel):
    """Individual choice option"""
    choice_id: str = Field(..., description="Unique choice identifier")
    text: str = Field(..., description="Choice text displayed to player")
    description: str = Field(..., description="Brief description of choice")
    immediate_outcome: str = Field(..., description="Expected immediate result")
    long_term_consequences: List[str] = Field(default=[], description="Potential long-term effects")
    character_motivation: str = Field(..., description="Why character might choose this")
    risk_level: str = Field(..., description="Risk level (low, medium, high)")
    reward_potential: str = Field(..., description="Potential benefits")
    difficulty: str = Field(default="medium", description="Choice difficulty level")
    created_at: datetime = Field(default_factory=get_current_timestamp, description="Creation timestamp")

class ChoiceNode(BaseModel):
    """Collection of choices at a story decision point"""
    node_id: str = Field(..., description="Unique node identifier")
    story_context: str = Field(..., description="Current story situation")
    character_states: Dict[str, Any] = Field(..., description="Current character states")
    available_choices: List[Choice] = Field(..., description="Available choice options")
    choice_type: str = Field(default="action", description="Type of choices")
    difficulty_level: str = Field(default="medium", description="Overall difficulty")
    created_at: datetime = Field(default_factory=get_current_timestamp, description="Creation timestamp")

class ChoiceConsequence(BaseModel):
    """Result of making a choice"""
    choice_id: str = Field(..., description="Choice that was made")
    immediate_consequences: str = Field(..., description="Immediate results")
    character_changes: Dict[str, Any] = Field(..., description="Character state changes")
    relationship_changes: Dict[str, str] = Field(default={}, description="Relationship impacts")
    story_impact: str = Field(..., description="Impact on overall story")
    future_opportunities: List[str] = Field(default=[], description="New opportunities opened")
    future_obstacles: List[str] = Field(default=[], description="New challenges created")
    unintended_consequences: str = Field(..., description="Unexpected results")
    next_scene_setup: str = Field(..., description="How this leads to next scene")
    consequence_severity: str = Field(default="medium", description="Severity of consequences")

class ChoiceProcessingResult(BaseModel):
    """Result of choice processing"""
    success: bool = Field(..., description="Whether processing was successful")
    choice_node: Optional[ChoiceNode] = Field(None, description="Generated choices")
    validation_result: Optional[ValidationResult] = Field(None, description="Validation results")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class ConsequenceProcessingResult(BaseModel):
    """Result of consequence processing"""
    success: bool = Field(..., description="Whether processing was successful")
    consequences: Optional[ChoiceConsequence] = Field(None, description="Choice consequences")
    character_updates: List[str] = Field(default=[], description="Character updates made")
    story_progression: str = Field(..., description="How story progresses")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class ChoiceProcessor:
    """Processes choices and their consequences in the story"""
    
    def __init__(self):
        """Initialize choice processor"""
        self.ai_client = get_ai_client()
        self.validator = get_story_validator()
        self.character_manager = get_character_manager()
        self.choice_nodes: Dict[str, ChoiceNode] = {}
        self.choice_history: List[Dict[str, Any]] = []
        self.max_choices_per_node = get_config_value("story.max_choices_per_node", 4)
    
    async def generate_choices_async(self, current_scene: str, character_states: Dict[str, Any],
                                   story_context: str, genre: str, difficulty_level: str = "medium",
                                   choice_type: str = "action", max_choices: int = None) -> ChoiceProcessingResult:
        """
        Generate choice options for current story moment asynchronously
        
        Args:
            current_scene: Current story scene content
            character_states: Current character states
            story_context: Overall story context and progress
            genre: Story genre
            difficulty_level: Choice difficulty (easy, medium, hard)
            choice_type: Type of choice (action, dialogue, moral, strategic)
            max_choices: Maximum number of choices (defaults to config)
            
        Returns:
            ChoiceProcessingResult: Generated choices
        """
        try:
            if max_choices is None:
                max_choices = self.max_choices_per_node
            
            # Validate inputs
            if not current_scene or not current_scene.strip():
                return ChoiceProcessingResult(
                    success=False,
                    error_message="Current scene cannot be empty"
                )
            
            if max_choices < 2 or max_choices > 6:
                return ChoiceProcessingResult(
                    success=False,
                    error_message="Max choices must be between 2 and 6"
                )
            
            # Create choice generation request
            request = ChoiceGenerationRequest(
                current_scene=clean_text(current_scene),
                character_states=character_states,
                story_context=story_context,
                genre=genre,
                difficulty_level=difficulty_level,
                choice_type=choice_type,
                max_choices=max_choices
            )
            
            # Generate choices using AI
            ai_response = await self.ai_client.generate_choices_async(request)
            
            if not ai_response.success:
                return ChoiceProcessingResult(
                    success=False,
                    error_message=f"AI choice generation failed: {ai_response.error_message}"
                )
            
            choice_data = ai_response.content
            
            # Validate generated choices
            choices_list = choice_data.get("choices", [])
            validation_result = self.validator.validate_choice_content(choices_list, current_scene)
            
            if not validation_result.is_valid:
                return ChoiceProcessingResult(
                    success=False,
                    validation_result=validation_result,
                    error_message=f"Choice validation failed: {', '.join(validation_result.errors)}"
                )
            
            # Create Choice objects
            choices = []
            for i, choice_info in enumerate(choices_list):
                choice = Choice(
                    choice_id=generate_unique_id(),
                    text=choice_info.get("text", f"Choice {i+1}"),
                    description=choice_info.get("description", ""),
                    immediate_outcome=choice_info.get("immediate_outcome", "Unknown outcome"),
                    long_term_consequences=choice_info.get("long_term_consequences", "").split(";") if choice_info.get("long_term_consequences") else [],
                    character_motivation=choice_info.get("character_motivation", "Personal motivation"),
                    risk_level=choice_info.get("risk_level", "medium"),
                    reward_potential=choice_info.get("reward_potential", "Moderate reward"),
                    difficulty=difficulty_level
                )
                choices.append(choice)
            
            # Create choice node
            node_id = generate_unique_id()
            choice_node = ChoiceNode(
                node_id=node_id,
                story_context=story_context,
                character_states=character_states,
                available_choices=choices,
                choice_type=choice_type,
                difficulty_level=difficulty_level
            )
            
            # Store choice node
            self.choice_nodes[node_id] = choice_node
            
            return ChoiceProcessingResult(
                success=True,
                choice_node=choice_node,
                validation_result=validation_result
            )
            
        except Exception as e:
            return ChoiceProcessingResult(
                success=False,
                error_message=f"Choice generation error: {str(e)}"
            )
    
    def generate_choices(self, current_scene: str, character_states: Dict[str, Any],
                        story_context: str, genre: str, difficulty_level: str = "medium",
                        choice_type: str = "action", max_choices: int = None) -> ChoiceProcessingResult:
        """
        Generate choice options for current story moment synchronously
        
        Args:
            current_scene: Current story scene content
            character_states: Current character states
            story_context: Overall story context and progress
            genre: Story genre
            difficulty_level: Choice difficulty
            choice_type: Type of choice
            max_choices: Maximum number of choices
            
        Returns:
            ChoiceProcessingResult: Generated choices
        """
        try:
            if max_choices is None:
                max_choices = self.max_choices_per_node
            
            # Create choice generation request
            request = ChoiceGenerationRequest(
                current_scene=clean_text(current_scene),
                character_states=character_states,
                story_context=story_context,
                genre=genre,
                difficulty_level=difficulty_level,
                choice_type=choice_type,
                max_choices=max_choices
            )
            
            # Generate choices using AI
            ai_response = self.ai_client.generate_choices(request)
            
            if not ai_response.success:
                return ChoiceProcessingResult(
                    success=False,
                    error_message=f"AI choice generation failed: {ai_response.error_message}"
                )
            
            choice_data = ai_response.content
            
            # Create simplified choices for sync version
            choices = []
            choices_list = choice_data.get("choices", [])
            
            for i, choice_info in enumerate(choices_list):
                choice = Choice(
                    choice_id=generate_unique_id(),
                    text=choice_info.get("text", f"Choice {i+1}"),
                    description=choice_info.get("description", ""),
                    immediate_outcome=choice_info.get("immediate_outcome", "Unknown outcome"),
                    character_motivation=choice_info.get("character_motivation", "Personal motivation"),
                    risk_level=choice_info.get("risk_level", "medium"),
                    reward_potential=choice_info.get("reward_potential", "Moderate reward"),
                    difficulty=difficulty_level
                )
                choices.append(choice)
            
            # Create choice node
            node_id = generate_unique_id()
            choice_node = ChoiceNode(
                node_id=node_id,
                story_context=story_context,
                character_states=character_states,
                available_choices=choices,
                choice_type=choice_type,
                difficulty_level=difficulty_level
            )
            
            # Store choice node
            self.choice_nodes[node_id] = choice_node
            
            return ChoiceProcessingResult(
                success=True,
                choice_node=choice_node
            )
            
        except Exception as e:
            return ChoiceProcessingResult(
                success=False,
                error_message=f"Choice generation error: {str(e)}"
            )
    
    async def process_choice_consequences_async(self, choice_id: str, node_id: str,
                                              additional_context: str = None) -> ConsequenceProcessingResult:
        """
        Process consequences of a chosen option asynchronously
        
        Args:
            choice_id: ID of the choice made
            node_id: ID of the choice node
            additional_context: Additional story context
            
        Returns:
            ConsequenceProcessingResult: Consequence processing results
        """
        try:
            # Find choice and node
            if node_id not in self.choice_nodes:
                return ConsequenceProcessingResult(
                    success=False,
                    error_message=f"Choice node {node_id} not found",
                    story_progression=""
                )
            
            choice_node = self.choice_nodes[node_id]
            selected_choice = None
            other_choices = []
            
            for choice in choice_node.available_choices:
                if choice.choice_id == choice_id:
                    selected_choice = choice
                else:
                    other_choices.append(choice.text)
            
            if not selected_choice:
                return ConsequenceProcessingResult(
                    success=False,
                    error_message=f"Choice {choice_id} not found in node {node_id}",
                    story_progression=""
                )
            
            # Get character making the choice (assume protagonist for now)
            character_states = choice_node.character_states
            character_making_choice = "protagonist"  # This could be determined dynamically
            
            # Analyze consequences using AI
            ai_response = await self.ai_client.analyze_choice_consequences_async(
                chosen_option=selected_choice.text,
                alternative_options=other_choices,
                character_making_choice=character_making_choice,
                story_context=choice_node.story_context + (f" {additional_context}" if additional_context else ""),
                character_states=character_states
            )
            
            if not ai_response.success:
                return ConsequenceProcessingResult(
                    success=False,
                    error_message=f"AI consequence analysis failed: {ai_response.error_message}",
                    story_progression=""
                )
            
            consequence_data = ai_response.content
            
            # Create consequence object
            consequences = ChoiceConsequence(
                choice_id=choice_id,
                immediate_consequences=consequence_data.get("immediate_consequences", "Unknown consequences"),
                character_changes=consequence_data.get("character_changes", {}),
                relationship_changes=consequence_data.get("relationship_changes", {}),
                story_impact=consequence_data.get("story_impact", "Story continues"),
                future_opportunities=consequence_data.get("future_opportunities", []),
                future_obstacles=consequence_data.get("future_obstacles", []),
                unintended_consequences=consequence_data.get("unintended_consequences", "No unexpected results"),
                next_scene_setup=consequence_data.get("next_scene_setup", "Story continues"),
                consequence_severity=self._assess_consequence_severity(selected_choice.risk_level, consequence_data)
            )
            
            # Update character states based on consequences
            character_updates = await self._update_characters_from_consequences(consequences, character_states)
            
            # Record choice in history
            self.choice_history.append({
                "timestamp": get_current_timestamp().isoformat(),
                "choice_id": choice_id,
                "choice_text": selected_choice.text,
                "consequences": consequences.dict(),
                "character_updates": character_updates
            })
            
            return ConsequenceProcessingResult(
                success=True,
                consequences=consequences,
                character_updates=character_updates,
                story_progression=consequences.next_scene_setup
            )
            
        except Exception as e:
            return ConsequenceProcessingResult(
                success=False,
                error_message=f"Consequence processing error: {str(e)}",
                story_progression=""
            )
    
    def process_choice_consequences(self, choice_id: str, node_id: str,
                                  additional_context: str = None) -> ConsequenceProcessingResult:
        """
        Process consequences of a chosen option synchronously
        
        Args:
            choice_id: ID of the choice made
            node_id: ID of the choice node
            additional_context: Additional story context
            
        Returns:
            ConsequenceProcessingResult: Consequence processing results
        """
        try:
            # Find choice and node
            if node_id not in self.choice_nodes:
                return ConsequenceProcessingResult(
                    success=False,
                    error_message=f"Choice node {node_id} not found",
                    story_progression=""
                )
            
            choice_node = self.choice_nodes[node_id]
            selected_choice = None
            
            for choice in choice_node.available_choices:
                if choice.choice_id == choice_id:
                    selected_choice = choice
                    break
            
            if not selected_choice:
                return ConsequenceProcessingResult(
                    success=False,
                    error_message=f"Choice {choice_id} not found",
                    story_progression=""
                )
            
            # Create basic consequences for sync version
            consequences = ChoiceConsequence(
                choice_id=choice_id,
                immediate_consequences=selected_choice.immediate_outcome,
                character_changes={"emotional_state": "responsive to choice"},
                story_impact="Story continues based on player choice",
                unintended_consequences="Story develops naturally",
                next_scene_setup="Story progresses with choice consequences",
                consequence_severity=selected_choice.risk_level
            )
            
            # Record choice in history
            self.choice_history.append({
                "timestamp": get_current_timestamp().isoformat(),
                "choice_id": choice_id,
                "choice_text": selected_choice.text,
                "consequences": consequences.dict(),
                "character_updates": []
            })
            
            return ConsequenceProcessingResult(
                success=True,
                consequences=consequences,
                character_updates=[],
                story_progression=consequences.next_scene_setup
            )
            
        except Exception as e:
            return ConsequenceProcessingResult(
                success=False,
                error_message=f"Consequence processing error: {str(e)}",
                story_progression=""
            )
    
    async def _update_characters_from_consequences(self, consequences: ChoiceConsequence,
                                                 character_states: Dict[str, Any]) -> List[str]:
        """
        Update character states based on choice consequences
        
        Args:
            consequences: Choice consequences
            character_states: Current character states
            
        Returns:
            List[str]: List of character updates made
        """
        updates_made = []
        
        try:
            # Update emotional states
            if "emotional_state" in consequences.character_changes:
                new_emotional_state = consequences.character_changes["emotional_state"]
                
                # Update all characters (in a real implementation, this would be more targeted)
                for char_id in character_states.keys():
                    update_result = await self.character_manager.update_character_async(
                        character_id=char_id,
                        story_events=[consequences.immediate_consequences],
                        emotional_state=new_emotional_state
                    )
                    
                    if update_result.success:
                        updates_made.extend(update_result.changes_made)
            
            # Update relationships
            if consequences.relationship_changes:
                # This would need to map character names to IDs in a real implementation
                for char_name, relationship_change in consequences.relationship_changes.items():
                    updates_made.append(f"Relationship change: {char_name} - {relationship_change}")
            
        except Exception as e:
            updates_made.append(f"Error updating characters: {str(e)}")
        
        return updates_made
    
    def _assess_consequence_severity(self, risk_level: str, consequence_data: Dict[str, Any]) -> str:
        """
        Assess the severity of consequences based on risk level and content
        
        Args:
            risk_level: Risk level of the choice
            consequence_data: Consequence data from AI
            
        Returns:
            str: Severity level (low, medium, high, critical)
        """
        # Check for indicators of severe consequences
        severe_indicators = ["death", "permanent", "irreversible", "catastrophic", "destroyed"]
        moderate_indicators = ["injured", "damaged", "conflict", "trouble", "difficult"]
        
        consequence_text = str(consequence_data.get("immediate_consequences", "")).lower()
        
        if any(indicator in consequence_text for indicator in severe_indicators):
            return "critical"
        elif any(indicator in consequence_text for indicator in moderate_indicators):
            return "high"
        elif risk_level == "high":
            return "high"
        elif risk_level == "medium":
            return "medium"
        else:
            return "low"
    
    def get_choice_node(self, node_id: str) -> Optional[ChoiceNode]:
        """
        Get choice node by ID
        
        Args:
            node_id: Node identifier
            
        Returns:
            ChoiceNode: Choice node or None if not found
        """
        return self.choice_nodes.get(node_id)
    
    def get_choice_history(self, limit: int = None) -> List[Dict[str, Any]]:
        """
        Get choice history
        
        Args:
            limit: Maximum number of recent choices to return
            
        Returns:
            List: Choice history
        """
        if limit:
            return self.choice_history[-limit:]
        return self.choice_history.copy()
    
    def validate_choice_quality(self, choices: List[Choice]) -> ValidationResult:
        """
        Validate the quality of generated choices
        
        Args:
            choices: List of choices to validate
            
        Returns:
            ValidationResult: Validation results
        """
        choice_dicts = [choice.dict() for choice in choices]
        return self.validator.validate_choice_content(choice_dicts)
    
    def get_choice_analytics(self) -> Dict[str, Any]:
        """
        Get analytics about choice processing
        
        Returns:
            Dict: Choice analytics
        """
        if not self.choice_history:
            return {"total_choices": 0, "message": "No choices made yet"}
        
        total_choices = len(self.choice_history)
        choice_types = {}
        risk_levels = {}
        
        for choice_record in self.choice_history:
            # This would need more detailed tracking in a real implementation
            choice_types["action"] = choice_types.get("action", 0) + 1
            risk_levels["medium"] = risk_levels.get("medium", 0) + 1
        
        return {
            "total_choices": total_choices,
            "choice_types": choice_types,
            "risk_levels": risk_levels,
            "average_consequences_severity": "medium",  # Would calculate from actual data
            "last_choice_time": self.choice_history[-1]["timestamp"] if self.choice_history else None
        }
    
    def clear_choice_history(self):
        """Clear choice history (for testing or story restart)"""
        self.choice_history.clear()
        self.choice_nodes.clear()

# Singleton instance
_choice_processor_instance: Optional[ChoiceProcessor] = None

def get_choice_processor() -> ChoiceProcessor:
    """
    Get or create choice processor singleton
    
    Returns:
        ChoiceProcessor: Configured choice processor instance
    """
    global _choice_processor_instance
    
    if _choice_processor_instance is None:
        _choice_processor_instance = ChoiceProcessor()
    
    return _choice_processor_instance

def reset_choice_processor():
    """Reset choice processor singleton (useful for testing)"""
    global _choice_processor_instance
    _choice_processor_instance = None
    