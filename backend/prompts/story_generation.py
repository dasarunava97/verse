"""
Story generation prompts for VERSE platform
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate


class StoryGenerationRequest(BaseModel):
    """Request model for story generation"""
    genre: str = Field(..., description="Story genre (fantasy, sci-fi, mystery, etc.)")
    theme: Optional[str] = Field(None, description="Optional story theme")
    setting: Optional[str] = Field(None, description="Story setting description")
    protagonist_name: Optional[str] = Field(None, description="Main character name")
    protagonist_traits: Optional[List[str]] = Field(default=[], description="Main character traits")
    story_length: str = Field(default="medium", description="Story length (short, medium, long)")
    tone: str = Field(default="balanced", description="Story tone (dark, light, balanced, humorous)")
    target_audience: str = Field(default="adult", description="Target audience (child, teen, adult)")
    title: str = Field(..., description="Story title")
    description: str = Field(..., description="Story description")
    user_id: Any = Field(..., description="User ID of the story creator")

class StoryProgressionRequest(BaseModel):
    """Request model for story progression"""
    user_message: str = Field(..., description="User's input or direction for story progression")
    current_mood: str = Field(..., description="Current mood of the story")
    title: str = Field(..., description="Story title")
    genre: str = Field(..., description="Story genre")
    current_story_context: str = Field(..., description="Current story context")
    character_details: str = Field(..., description="Details of established characters")

class StoryGenerationResponse(BaseModel):
    """Response model for story generation"""
    title: str = Field(..., description="Generated story title")
    opening_scene: str = Field(..., description="Opening scene content")
    setting_description: str = Field(..., description="Detailed setting description")
    protagonist_description: str = Field(..., description="Main character description")
    initial_conflict: str = Field(..., description="Initial story conflict")
    mood: str = Field(..., description="Story mood and atmosphere")
    suggested_next_scenes: List[str] = Field(default=[], description="Suggested continuation directions")

def get_story_generation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for initial story generation
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE, an expert interactive storyteller AI. Your role is to create engaging, immersive story openings that captivate readers and set up meaningful choices.

CORE PRINCIPLES:
1. Create vivid, sensory-rich descriptions that draw readers in
2. Establish clear character motivations and conflicts
3. Set up situations that naturally lead to meaningful choices
4. Maintain genre consistency and appropriate tone
5. Leave room for character development and plot progression

STORY STRUCTURE GUIDELINES:
- Opening Hook: Start with an engaging scene that immediately draws attention
- Character Introduction: Present the protagonist in a way that shows their personality
- Setting Establishment: Create a vivid sense of place and atmosphere
- Conflict Introduction: Present the initial problem or tension
- Choice Setup: End in a way that naturally leads to player decisions

CONTENT GUIDELINES:
- Keep content appropriate for the target audience
- Avoid graphic violence, explicit content, or harmful stereotypes
- Create diverse, well-rounded characters
- Use inclusive language and representation
- Focus on character growth and meaningful choices"""

    human_message = """Create an engaging story opening based on these parameters:

STORY PARAMETERS:
- Genre: {genre}
- Theme: {theme}
- Setting: {setting}
- Protagonist Name: {protagonist_name}
- Protagonist Traits: {protagonist_traits}
- Story Length: {story_length}
- Tone: {tone}
- Target Audience: {target_audience}
- Title: {title}
- Description: {description}
- User ID: {user_id}

REQUIREMENTS:
1. Generate a compelling title that captures the story's essence
2. Write an opening scene (1000-2000 words, minimum 1000 words) that:
   - Immediately engages the reader
   - Introduces the protagonist naturally
   - Establishes the setting and mood
   - Presents an initial conflict or tension
   - Ends at a natural decision point

3. Provide detailed descriptions for:
   - Setting and atmosphere
   - Protagonist appearance and personality
   - Initial conflict or challenge

4. Suggest 2-3 potential directions for the story to continue

Format your response as a JSON object with the following structure:
{{
    "title": "Story title here",
    "opening_scene": "Full opening scene text here",
    "setting_description": "Detailed setting description",
    "protagonist_description": "Character description",
    "protagonist_name": "Name of the protagonist",
    "initial_conflict": "Description of the main conflict",
    "mood": "Overall story mood and atmosphere",
    "suggested_next_scenes": ["Direction 1", "Direction 2", "Direction 3"]
}}

Ensure the story opening is engaging, age-appropriate, and sets up natural choice points for interactive storytelling."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_story_progression_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for story progression
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_prompt = """You are VERSE, an expert interactive storyteller AI. Your role is to progress an existing story based on user input while maintaining consistency with established characters and plot elements.

        PROGRESSION PRINCIPLES:
        1. Maintain consistency with established characters and story elements
        2. Honor the user's creative direction while keeping it engaging
        3. Advance the plot meaningfully based on user input
        4. Keep character personalities and relationships consistent
        5. Maintain the established genre and mood

        CONTENT GUIDELINES:
        - Build naturally from the existing story context
        - Integrate user suggestions creatively and logically
        - Maintain character voice and development
        - Keep the narrative engaging and coherent
        - Ensure scene transitions feel natural"""

    user_prompt = """Progress this story based on the user's input:

        STORY DETAILS:
        - Title: {title}
        - Genre: {genre}
        - Current Mood: {current_mood}

        CURRENT STORY CONTEXT:
        {current_story_context}

        ESTABLISHED CHARACTERS:
        {character_details}

        USER'S MESSAGE/DIRECTION:
        "{user_message}"

        REQUIREMENTS:
        1. Write the next scene (300-600 words) that:
        - Incorporates the user's message/direction naturally
        - Maintains consistency with existing characters
        - Advances the story in an engaging way
        - Keeps the established tone and genre
        - Provides natural progression from current context

        2. Update character information if they develop or change
        3. Suggest 3 potential next actions/directions
        4. Update the story mood if appropriate

        Format your response as a JSON object:
        {{
            "new_scene_content": "The new scene content here",
            "updated_characters": [
                {{
                    "id": "character_id_if_updating_existing",
                    "name": "character_name",
                    "description": "updated_description",
                    "personality_traits": "updated_traits_if_changed"
                }}
            ],
            "suggested_next_actions": [
                "Action suggestion 1",
                "Action suggestion 2", 
                "Action suggestion 3"
            ],
            "story_mood": "updated_mood_if_changed"
        }}

        Create an engaging progression that honors both the existing story and the user's creative input."""

    return ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", user_prompt)
    ])

def get_story_continuation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for story continuation
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE, continuing an interactive story. Your role is to seamlessly continue the narrative based on the player's previous choice while maintaining consistency and engagement.

CONTINUATION PRINCIPLES:
1. Honor the consequences of the player's choice
2. Maintain character consistency and development
3. Keep the story moving forward with new challenges
4. Introduce new elements while respecting established lore
5. Create natural stopping points for new choices

CONSISTENCY REQUIREMENTS:
- Character personalities must remain consistent
- Previously established facts cannot be contradicted
- The story tone and genre must be maintained
- Character relationships should evolve naturally"""

    human_message = """Continue the story based on the player's choice:

STORY CONTEXT:
- Previous Scene: {previous_scene}
- Player's Choice: {player_choice}
- Character States: {character_states}
- Story Progress: {story_progress}

CONTINUATION REQUIREMENTS:
1. Write the next scene (200-400 words) that:
   - Directly follows from the player's choice
   - Shows realistic consequences of their decision
   - Advances the plot meaningfully
   - Maintains character consistency
   - Ends at a new decision point

2. Update character emotional states based on events
3. Suggest 2-3 new choice options for the player

Format your response as a JSON object:
{{
    "scene_content": "The continuation scene text",
    "character_updates": {{"character_name": "emotional_state_description"}},
    "new_conflict": "Any new challenges or conflicts introduced",
    "suggested_choices": ["Choice 1", "Choice 2", "Choice 3"]
}}

Ensure the continuation feels natural and maintains narrative momentum."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_story_ending_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for story endings
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE, crafting a satisfying conclusion to an interactive story. Your role is to create meaningful endings that reflect the player's choices and provide emotional closure.

ENDING PRINCIPLES:
1. Reflect the impact of major player choices
2. Provide emotional resolution for character arcs
3. Address the main story conflicts
4. Match the tone established throughout the story
5. Leave the reader satisfied but not necessarily perfectly happy

RESOLUTION GUIDELINES:
- Consequences should feel earned and logical
- Character growth should be evident
- Major plot threads should be resolved
- The ending should feel true to the genre and tone"""

    human_message = """Create a satisfying ending for this story:

STORY SUMMARY:
- Genre: {genre}
- Main Characters: {main_characters}
- Key Player Choices: {key_choices}
- Current Situation: {current_situation}
- Unresolved Conflicts: {unresolved_conflicts}

ENDING REQUIREMENTS:
1. Write a concluding scene (300-500 words) that:
   - Resolves the main story conflict
   - Shows the consequences of major choices
   - Provides character closure
   - Matches the established tone
   - Feels emotionally satisfying

2. Summarize how each major character's arc concludes
3. Reflect on the impact of the player's key decisions

Format your response as a JSON object:
{{
    "ending_scene": "The final scene text",
    "character_resolutions": {{"character_name": "how their story concludes"}},
    "choice_consequences": "Summary of how player choices affected the outcome",
    "final_message": "A brief reflection on the story's themes"
}}

Create an ending that honors the player's journey and provides meaningful closure."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])
