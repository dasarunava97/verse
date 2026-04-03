"""
Character creation and development prompts for VERSE platform
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate


class CharacterCreationRequest(BaseModel):
    """Request model for character creation"""
    name: str = Field(..., description="Character name")
    role: str = Field(..., description="Character role (protagonist, antagonist, supporting)")
    genre: str = Field(..., description="Story genre")
    age_range: Optional[str] = Field(None, description="Age range (child, teen, adult, elderly)")
    personality_traits: Optional[List[str]] = Field(default=[], description="Desired personality traits")
    background: Optional[str] = Field(None, description="Character background or history")
    motivation: Optional[str] = Field(None, description="Character's main motivation")
    relationships: Optional[Dict[str, str]] = Field(default={}, description="Relationships with other characters")

class CharacterCreationResponse(BaseModel):
    """Response model for character creation"""
    name: str = Field(..., description="Character name")
    physical_description: str = Field(..., description="Physical appearance")
    personality_profile: Dict[str, str] = Field(..., description="Detailed personality traits")
    background_story: str = Field(..., description="Character background and history")
    motivations: List[str] = Field(..., description="Character motivations and goals")
    fears_and_flaws: List[str] = Field(..., description="Character fears and personality flaws")
    speech_patterns: str = Field(..., description="How the character speaks")
    relationships: Dict[str, str] = Field(default={}, description="Relationships with other characters")

class CharacterUpdateRequest(BaseModel):
    """Request model for character updates during story"""
    character_name: str = Field(..., description="Character to update")
    story_events: List[str] = Field(..., description="Recent story events affecting the character")
    new_relationships: Optional[Dict[str, str]] = Field(default={}, description="New or changed relationships")
    emotional_state: Optional[str] = Field(None, description="Current emotional state")

def get_character_creation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for character creation
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's character creation specialist. Your role is to create rich, multi-dimensional characters that feel real and engaging for interactive storytelling.

CHARACTER DEVELOPMENT PRINCIPLES:
1. Create authentic, relatable characters with depth
2. Ensure characters have both strengths and flaws
3. Develop clear motivations and internal conflicts
4. Create distinctive voices and mannerisms
5. Consider how characters will grow throughout the story

DIVERSITY AND INCLUSION:
- Create diverse characters across all demographics
- Avoid stereotypes and clichés
- Represent different backgrounds, cultures, and experiences
- Ensure characters feel authentic to their contexts
- Include positive representation for all groups

CHARACTER PSYCHOLOGY:
- Give characters clear internal and external goals
- Create believable personality contradictions
- Develop realistic fears and insecurities
- Consider how past experiences shape current behavior
- Plan character growth arcs"""

    human_message = """Create a detailed character based on these specifications:

CHARACTER SPECIFICATIONS:
- Name: {name}
- Role: {role}
- Genre: {genre}
- Age Range: {age_range}
- Desired Traits: {personality_traits}
- Background: {background}
- Motivation: {motivation}
- Relationships: {relationships}

CHARACTER CREATION REQUIREMENTS:
1. Physical Description (2-3 sentences):
   - Distinctive physical features
   - Clothing style or notable accessories
   - Body language and mannerisms

2. Personality Profile:
   - Core personality traits (5-6 traits)
   - How they handle stress
   - Social interaction style
   - Decision-making approach

3. Background Story (100-150 words):
   - Key formative experiences
   - Family and upbringing
   - Important life events
   - How they arrived at the current situation

4. Motivations and Goals:
   - Primary motivation driving their actions
   - Secondary goals or desires
   - Long-term aspirations

5. Fears and Flaws:
   - Deepest fears or insecurities
   - Personality flaws that create conflict
   - Blind spots or weaknesses

6. Speech Patterns:
   - Vocabulary level and style
   - Common phrases or expressions
   - Speaking rhythm and tone

Format your response as a JSON object:
{{
    "name": "Character name",
    "physical_description": "Physical description",
    "personality_profile": {{
        "core_traits": "Description of main personality traits",
        "stress_response": "How they handle stress",
        "social_style": "How they interact with others",
        "decision_making": "How they make decisions"
    }},
    "background_story": "Character background narrative",
    "motivations": ["Primary motivation", "Secondary goal", "Long-term aspiration"],
    "fears_and_flaws": ["Main fear", "Personality flaw", "Weakness"],
    "speech_patterns": "Description of how they speak",
    "relationships": {{"character_name": "relationship_description"}}
}}

Create a character that feels real, complex, and suitable for {genre} storytelling."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_character_update_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for character development updates
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's character development tracker. Your role is to update character states realistically based on story events while maintaining consistency.

CHARACTER DEVELOPMENT PRINCIPLES:
1. Characters should change gradually and believably
2. Major events should have lasting impact
3. Maintain core personality while allowing growth
4. Consider both positive and negative development
5. Track relationship changes realistically

CONSISTENCY RULES:
- Core personality traits remain stable unless major trauma occurs
- Character growth should feel earned through story events
- Relationships evolve based on interactions and shared experiences
- Emotional states should reflect recent events logically"""

    human_message = """Update the character's development based on recent story events:

CHARACTER CONTEXT:
- Character: {character_name}
- Current Personality: {current_personality}
- Current Relationships: {current_relationships}
- Previous Emotional State: {previous_emotional_state}

RECENT STORY EVENTS:
{story_events}

NEW RELATIONSHIP CHANGES:
{new_relationships}

UPDATE REQUIREMENTS:
1. Assess how the events would realistically affect this character
2. Update their emotional state based on what happened
3. Note any personality shifts or growth
4. Update relationship dynamics
5. Identify any new fears, motivations, or goals

Format your response as a JSON object:
{{
    "emotional_state": "Current emotional state and feelings",
    "personality_changes": "Any shifts in personality or behavior",
    "relationship_updates": {{"character_name": "updated_relationship_status"}},
    "new_motivations": ["Any new goals or motivations"],
    "character_growth": "How the character has grown or changed",
    "internal_conflicts": "Any new internal struggles or conflicts"
}}

Ensure all changes feel natural and consistent with the character's established personality."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_character_description_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for generating character descriptions in scenes
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's character description writer. Create vivid, contextual descriptions of characters as they appear in specific story moments.

DESCRIPTION PRINCIPLES:
1. Show character personality through actions and details
2. Use sensory details that enhance the scene
3. Reveal character state through physical cues
4. Match description to the scene's mood and pacing
5. Avoid info-dumping; integrate naturally into narrative"""

    human_message = """Generate a character description for this scene context:

CHARACTER INFORMATION:
- Name: {character_name}
- Physical Traits: {physical_traits}
- Personality: {personality}
- Current Emotional State: {emotional_state}
- Role in Scene: {scene_role}

SCENE CONTEXT:
- Setting: {scene_setting}
- Mood: {scene_mood}
- Action: {scene_action}
- POV Character: {pov_character}

DESCRIPTION REQUIREMENTS:
Create a 2-3 sentence character description that:
- Fits naturally into the scene
- Reveals character personality through details
- Shows their current emotional state
- Uses appropriate sensory details
- Matches the scene's tone and pacing

Format as a simple text description that can be integrated into the story."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])
