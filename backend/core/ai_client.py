"""
AI API integration for VERSE platform
"""

import json
import ast
import re
import asyncio
from typing import Dict, Any, Optional, Union, List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from utils.helpers import get_llm_client, safe_json_loads, safe_json_dumps, get_config_value
from utils.validators import validate_positive_integer
from prompts.story_generation import (
    StoryGenerationRequest, 
    StoryProgressionRequest,
    get_story_generation_prompt,
    get_story_continuation_prompt,
    get_story_ending_prompt,
    get_story_progression_prompt
)
from prompts.character_creation import (
    CharacterCreationRequest,
    get_character_creation_prompt,
    get_character_update_prompt,
    get_character_description_prompt
)
from prompts.choice_generation import (
    ChoiceGenerationRequest,
    get_choice_generation_prompt,
    get_choice_consequence_prompt
)
from prompts.dialogue_generation import (
    DialogueGenerationRequest,
    get_dialogue_generation_prompt,
    get_character_voice_prompt,
    get_conversation_prompt
)

# Response models
class AIResponse(BaseModel):
    """Standard AI response model"""
    success: bool = Field(..., description="Whether the request was successful")
    content: Dict[str, Any] = Field(default={}, description="Generated content")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    tokens_used: Optional[int] = Field(None, description="Number of tokens consumed")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")

# Exception classes
class AIError(Exception):
    """Base exception for AI-related errors"""
    pass

class AIClient:
    """Main AI client for VERSE platform"""
    
    def __init__(self, llm_client: Optional[ChatOpenAI] = None):
        """
        Initialize AI client
        
        Args:
            llm_client: Optional pre-configured LLM client
        """
        self.llm_client = llm_client or get_llm_client()
        # print('AI client', self.llm_client)
        self.max_retries = get_config_value("ai.max_retries", 3)
        self.retry_delay = get_config_value("ai.retry_delay", 1.0)
    
    async def _make_request(self, prompt_template, variables: Dict[str, Any]) -> AIResponse:
        """
        Make a request to the AI model with retry logic
        
        Args:
            prompt_template: Configured prompt template
            variables: Variables to fill in the prompt
            
        Returns:
            AIResponse: Response from AI model
        """
        import time
        start_time = time.time()
        
        for attempt in range(self.max_retries + 1):
            try:
                # Format the prompt with variables
                formatted_prompt = prompt_template.format_messages(**variables)
                # print(formatted_prompt)
                
                # Make the API call
                response = self.llm_client.invoke(formatted_prompt)
                
                # Parse response content
                content = self._parse_response_content(response.content)
                
                processing_time = time.time() - start_time
                
                return AIResponse(
                    success=True,
                    content=content,
                    tokens_used=getattr(response, 'response_metadata', {}).get('token_usage', {}).get('total_tokens'),
                    processing_time=processing_time
                )
                
            except Exception as e:
                if attempt == self.max_retries:
                    processing_time = time.time() - start_time
                    return AIResponse(
                        success=False,
                        error_message=f"AI request failed after {self.max_retries + 1} attempts: {str(e)}",
                        processing_time=processing_time
                    )
                
                # Wait before retry
                await asyncio.sleep(self.retry_delay * (attempt + 1))
    
    def _make_sync_request(self, prompt_template, variables: Dict[str, Any]) -> AIResponse:
        """
        Make a synchronous request to the AI model
        
        Args:
            prompt_template: Configured prompt template
            variables: Variables to fill in the prompt
            
        Returns:
            AIResponse: Response from AI model
        """
        import time
        start_time = time.time()
        
        for attempt in range(self.max_retries + 1):
            try:
                # Format the prompt with variables
                formatted_prompt = prompt_template.format_messages(**variables)
                
                # Make the API call
                response = self.llm_client.invoke(formatted_prompt)
                
                # Parse response content
                content = self._parse_response_content(response.content)
                
                processing_time = time.time() - start_time
                
                return AIResponse(
                    success=True,
                    content=content,
                    tokens_used=getattr(response, 'response_metadata', {}).get('token_usage', {}).get('total_tokens'),
                    processing_time=processing_time
                )
                
            except Exception as e:
                if attempt == self.max_retries:
                    processing_time = time.time() - start_time
                    return AIResponse(
                        success=False,
                        error_message=f"AI request failed after {self.max_retries + 1} attempts: {str(e)}",
                        processing_time=processing_time
                    )
                
                # Wait before retry
                import time
                time.sleep(self.retry_delay * (attempt + 1))
    
    def _parse_response_content(self, content: str) -> Dict[str, Any]:
        """
        Parse AI response content, handling both JSON and plain text
        
        Args:
            content: Raw response content
            
        Returns:
            Dict: Parsed content
        """
        # Try to parse as JSON first
        if "```json" in content:
            # Extract content between json code block markers
            pattern = r"```json\n(.*?)```"
            matches = re.findall(pattern, content, re.DOTALL)
            if matches:
                content = matches[0]
          
        # Try to parse as JSON first

        try:
            parsed_json = safe_json_loads(content)
            if parsed_json is not None:
                return parsed_json
        except Exception as e:
            print("JSON parsing error:", e)
            try:
                return ast.literal_eval(content)
            except Exception as e:
                pass

        # If not JSON, return as plain text
        return {"text": content.strip()}

    
    # Story Generation Methods
    async def generate_story_async(self, request: StoryGenerationRequest) -> AIResponse:
        """
        Generate initial story content asynchronously
        
        Args:
            request: Story generation request parameters
            
        Returns:
            AIResponse: Generated story content
        """
        prompt_template = get_story_generation_prompt()
        variables = request.dict()
        
        return await self._make_request(prompt_template, variables)
    
    async def progress_story_with_user_input_async(self, request: StoryProgressionRequest) -> AIResponse:
        """
        Progress story based on user input and existing context
        
        Args:
            title: Story title
            genre: Story genre
            current_story_context: Current story scenes context
            character_details: Character information
            user_message: User's direction/message
            current_mood: Current story mood
            
        Returns:
            AIResponse: AI response with story progression
        """
        prompt_template = get_story_progression_prompt()
        variables = request.dict()
        
        return await self._make_request(prompt_template, variables)
    
    def generate_story(self, request: StoryGenerationRequest) -> AIResponse:
        """
        Generate initial story content synchronously
        
        Args:
            request: Story generation request parameters
            
        Returns:
            AIResponse: Generated story content
        """
        prompt_template = get_story_generation_prompt()
        variables = request.dict()
        
        return self._make_sync_request(prompt_template, variables)
    
    async def continue_story_async(self, previous_scene: str, player_choice: str, 
                                 character_states: Dict[str, Any], story_progress: str) -> AIResponse:
        """
        Continue story based on player choice asynchronously
        
        Args:
            previous_scene: Previous story scene
            player_choice: Choice made by player
            character_states: Current character states
            story_progress: Overall story progress
            
        Returns:
            AIResponse: Story continuation
        """
        prompt_template = get_story_continuation_prompt()
        variables = {
            "previous_scene": previous_scene,
            "player_choice": player_choice,
            "character_states": safe_json_dumps(character_states),
            "story_progress": story_progress
        }
        
        return await self._make_request(prompt_template, variables)
    
    def continue_story(self, previous_scene: str, player_choice: str, 
                      character_states: Dict[str, Any], story_progress: str) -> AIResponse:
        """
        Continue story based on player choice synchronously
        
        Args:
            previous_scene: Previous story scene
            player_choice: Choice made by player
            character_states: Current character states
            story_progress: Overall story progress
            
        Returns:
            AIResponse: Story continuation
        """
        prompt_template = get_story_continuation_prompt()
        variables = {
            "previous_scene": previous_scene,
            "player_choice": player_choice,
            "character_states": safe_json_dumps(character_states),
            "story_progress": story_progress
        }
        
        return self._make_sync_request(prompt_template, variables)
    
    async def generate_story_ending_async(self, genre: str, main_characters: List[str],
                                        key_choices: List[str], current_situation: str,
                                        unresolved_conflicts: List[str]) -> AIResponse:
        """
        Generate story ending asynchronously
        
        Args:
            genre: Story genre
            main_characters: List of main characters
            key_choices: Key player choices made
            current_situation: Current story situation
            unresolved_conflicts: Conflicts that need resolution
            
        Returns:
            AIResponse: Story ending
        """
        prompt_template = get_story_ending_prompt()
        variables = {
            "genre": genre,
            "main_characters": safe_json_dumps(main_characters),
            "key_choices": safe_json_dumps(key_choices),
            "current_situation": current_situation,
            "unresolved_conflicts": safe_json_dumps(unresolved_conflicts)
        }
        
        return await self._make_request(prompt_template, variables)
    
    # Character Generation Methods
    async def create_character_async(self, request: CharacterCreationRequest) -> AIResponse:
        """
        Create character asynchronously
        
        Args:
            request: Character creation request
            
        Returns:
            AIResponse: Generated character
        """
        prompt_template = get_character_creation_prompt()
        variables = request.dict()
        
        return await self._make_request(prompt_template, variables)
    
    def create_character(self, request: CharacterCreationRequest) -> AIResponse:
        """
        Create character synchronously
        
        Args:
            request: Character creation request
            
        Returns:
            AIResponse: Generated character
        """
        prompt_template = get_character_creation_prompt()
        variables = request.dict()
        
        return self._make_sync_request(prompt_template, variables)
    
    async def update_character_async(self, character_name: str, current_personality: Dict[str, Any],
                                   current_relationships: Dict[str, str], previous_emotional_state: str,
                                   story_events: List[str], new_relationships: Dict[str, str]) -> AIResponse:
        """
        Update character development asynchronously
        
        Args:
            character_name: Name of character to update
            current_personality: Current personality traits
            current_relationships: Current relationships
            previous_emotional_state: Previous emotional state
            story_events: Recent story events
            new_relationships: New relationship changes
            
        Returns:
            AIResponse: Updated character state
        """
        prompt_template = get_character_update_prompt()
        variables = {
            "character_name": character_name,
            "current_personality": safe_json_dumps(current_personality),
            "current_relationships": safe_json_dumps(current_relationships),
            "previous_emotional_state": previous_emotional_state,
            "story_events": safe_json_dumps(story_events),
            "new_relationships": safe_json_dumps(new_relationships)
        }
        
        return await self._make_request(prompt_template, variables)
    
    # Choice Generation Methods
    async def generate_choices_async(self, request: ChoiceGenerationRequest) -> AIResponse:
        """
        Generate story choices asynchronously
        
        Args:
            request: Choice generation request
            
        Returns:
            AIResponse: Generated choices
        """
        prompt_template = get_choice_generation_prompt()
        variables = request.dict()
        
        return await self._make_request(prompt_template, variables)
    
    def generate_choices(self, request: ChoiceGenerationRequest) -> AIResponse:
        """
        Generate story choices synchronously
        
        Args:
            request: Choice generation request
            
        Returns:
            AIResponse: Generated choices
        """
        prompt_template = get_choice_generation_prompt()
        variables = request.dict()
        
        return self._make_sync_request(prompt_template, variables)
    
    async def analyze_choice_consequences_async(self, chosen_option: str, alternative_options: List[str],
                                              character_making_choice: str, story_context: str,
                                              character_states: Dict[str, Any]) -> AIResponse:
        """
        Analyze choice consequences asynchronously
        
        Args:
            chosen_option: The choice made by player
            alternative_options: Other available choices
            character_making_choice: Character who made the choice
            story_context: Current story context
            character_states: Current character states
            
        Returns:
            AIResponse: Choice consequences analysis
        """
        prompt_template = get_choice_consequence_prompt()
        variables = {
            "chosen_option": chosen_option,
            "alternative_options": safe_json_dumps(alternative_options),
            "character_making_choice": character_making_choice,
            "story_context": story_context,
            "character_states": safe_json_dumps(character_states)
        }
        
        return await self._make_request(prompt_template, variables)
    
    # Dialogue Generation Methods
    async def generate_dialogue_async(self, request: DialogueGenerationRequest) -> AIResponse:
        """
        Generate character dialogue asynchronously
        
        Args:
            request: Dialogue generation request
            
        Returns:
            AIResponse: Generated dialogue
        """
        prompt_template = get_dialogue_generation_prompt()
        variables = request.dict()
        
        return await self._make_request(prompt_template, variables)
    
    def generate_dialogue(self, request: DialogueGenerationRequest) -> AIResponse:
        """
        Generate character dialogue synchronously
        
        Args:
            request: Dialogue generation request
            
        Returns:
            AIResponse: Generated dialogue
        """
        prompt_template = get_dialogue_generation_prompt()
        variables = request.dict()
        
        return self._make_sync_request(prompt_template, variables)

# Singleton instance
_ai_client_instance: Optional[AIClient] = None

def get_ai_client() -> AIClient:
    """
    Get or create AI client singleton
    
    Returns:
        AIClient: Configured AI client instance
    """
    global _ai_client_instance
    
    if _ai_client_instance is None:
        _ai_client_instance = AIClient()
    
    return _ai_client_instance

def reset_ai_client():
    """Reset AI client singleton (useful for testing)"""
    global _ai_client_instance
    _ai_client_instance = None

# Convenience functions for direct use
async def generate_story_content(request: StoryGenerationRequest) -> AIResponse:
    """Generate story content using default AI client"""
    client = get_ai_client()
    return await client.generate_story_async(request)

async def generate_character_content(request: CharacterCreationRequest) -> AIResponse:
    """Generate character content using default AI client"""
    client = get_ai_client()
    return await client.create_character_async(request)

async def generate_choice_content(request: ChoiceGenerationRequest) -> AIResponse:
    """Generate choice content using default AI client"""
    client = get_ai_client()
    return await client.generate_choices_async(request)

async def generate_dialogue_content(request: DialogueGenerationRequest) -> AIResponse:
    """Generate dialogue content using default AI client"""
    client = get_ai_client()
    return await client.generate_dialogue_async(request)
