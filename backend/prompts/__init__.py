"""
AI prompt templates for VERSE - Virtual Experience Reactive Story Engine
"""

from .story_generation import (
    StoryGenerationRequest,
    StoryGenerationResponse,
    get_story_generation_prompt,
    get_story_continuation_prompt,
    get_story_ending_prompt
)

from .character_creation import (
    CharacterCreationRequest,
    CharacterCreationResponse,
    CharacterUpdateRequest,
    get_character_creation_prompt,
    get_character_update_prompt,
    get_character_description_prompt
)

from .choice_generation import (
    ChoiceGenerationRequest,
    ChoiceGenerationResponse,
    get_choice_generation_prompt,
    get_choice_consequence_prompt,
    get_choice_validation_prompt
)

from .dialogue_generation import (
    DialogueGenerationRequest,
    DialogueGenerationResponse,
    get_dialogue_generation_prompt,
    get_character_voice_prompt,
    get_conversation_prompt
)

__all__ = [
    # Story generation
    "StoryGenerationRequest",
    "StoryGenerationResponse", 
    "get_story_generation_prompt",
    "get_story_continuation_prompt",
    "get_story_ending_prompt",
    
    # Character creation
    "CharacterCreationRequest",
    "CharacterCreationResponse",
    "CharacterUpdateRequest",
    "get_character_creation_prompt",
    "get_character_update_prompt",
    "get_character_description_prompt",
    
    # Choice generation
    "ChoiceGenerationRequest",
    "ChoiceGenerationResponse",
    "get_choice_generation_prompt",
    "get_choice_consequence_prompt",
    "get_choice_validation_prompt",
    
    # Dialogue generation
    "DialogueGenerationRequest",
    "DialogueGenerationResponse",
    "get_dialogue_generation_prompt",
    "get_character_voice_prompt",
    "get_conversation_prompt"
]