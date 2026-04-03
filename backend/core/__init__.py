"""
Core AI logic modules for VERSE - Virtual Experience Reactive Story Engine
"""

from .ai_client import (
    AIClient,
    AIResponse,
    AIError,
    get_ai_client,
    generate_story_content,
    generate_character_content,
    generate_choice_content,
    generate_dialogue_content
)

from .story_validator import (
    StoryValidator,
    ValidationResult,
    ContentValidationError,
    validate_story_content,
    validate_character_content,
    validate_choice_content,
    validate_dialogue_content,
    get_story_validator
)

from .character_manager import (
    CharacterManager,
    CharacterState,
    CharacterMemory,
    CharacterCreationResult,
    CharacterUpdateResult,
    get_character_manager,
    reset_character_manager
)

from .choice_processor import (
    ChoiceProcessor,
    Choice,
    ChoiceNode,
    ChoiceConsequence,
    ChoiceProcessingResult,
    ConsequenceProcessingResult,
    get_choice_processor,
    reset_choice_processor
)

from .story_generator import (
    StoryGenerator,
    StorySession,
    StoryNode,
    StoryGenerationResult,
    StoryProgressResult,
    get_story_generator,
    reset_story_generator,
    create_interactive_story,
    continue_interactive_story,
    end_interactive_story
)

__all__ = [
    # AI Client
    "AIClient",
    "AIResponse", 
    "AIError",
    "get_ai_client",
    "generate_story_content",
    "generate_character_content",
    "generate_choice_content",
    "generate_dialogue_content",
    
    # Story Validator
    "StoryValidator",
    "ValidationResult",
    "ContentValidationError",
    "validate_story_content",
    "validate_character_content",
    "validate_choice_content",
    "validate_dialogue_content",
    "get_story_validator",
    
    # Character Manager
    "CharacterManager",
    "CharacterState",
    "CharacterMemory",
    "CharacterCreationResult",
    "CharacterUpdateResult",
    "get_character_manager",
    "reset_character_manager",
    
    # Choice Processor
    "ChoiceProcessor",
    "Choice",
    "ChoiceNode",
    "ChoiceConsequence",
    "ChoiceProcessingResult",
    "ConsequenceProcessingResult",
    "get_choice_processor",
    "reset_choice_processor",
    
    # Story Generator
    "StoryGenerator",
    "StorySession",
    "StoryNode", 
    "StoryGenerationResult",
    "StoryProgressResult",
    "get_story_generator",
    "reset_story_generator",
    "create_interactive_story",
    "continue_interactive_story",
    "end_interactive_story"
]