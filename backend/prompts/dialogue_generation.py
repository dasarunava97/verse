"""
Dialogue generation prompts for VERSE platform
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate


class DialogueGenerationRequest(BaseModel):
    """Request model for dialogue generation"""
    speaker_character: str = Field(..., description="Character who is speaking")
    target_character: Optional[str] = Field(None, description="Character being spoken to")
    dialogue_context: str = Field(..., description="Context for the conversation")
    emotional_state: str = Field(..., description="Speaker's emotional state")
    character_relationships: Dict[str, str] = Field(default={}, description="Relationship dynamics")
    dialogue_purpose: str = Field(..., description="Purpose of the dialogue (inform, persuade, threaten, etc.)")
    tone: str = Field(default="neutral", description="Desired tone of dialogue")
    length: str = Field(default="medium", description="Dialogue length (short, medium, long)")

class DialogueGenerationResponse(BaseModel):
    """Response model for dialogue generation"""
    dialogue_text: str = Field(..., description="Generated dialogue")
    subtext: str = Field(..., description="What the character really means")
    emotional_undertone: str = Field(..., description="Emotional undertone of the dialogue")
    body_language: str = Field(..., description="Accompanying body language/actions")
    voice_description: str = Field(..., description="How the dialogue should sound")

class ConversationRequest(BaseModel):
    """Request model for multi-character conversations"""
    participants: List[str] = Field(..., description="Characters in the conversation")
    conversation_topic: str = Field(..., description="Main topic or purpose")
    setting: str = Field(..., description="Where the conversation takes place")
    tension_level: str = Field(default="medium", description="Level of tension (low, medium, high)")
    conversation_goal: str = Field(..., description="What should be accomplished")
    character_states: Dict[str, str] = Field(..., description="Each character's current state")

def get_dialogue_generation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for dialogue generation
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's dialogue specialist. Your role is to create authentic, character-driven dialogue that reveals personality, advances plot, and feels natural to read.

DIALOGUE WRITING PRINCIPLES:
1. Each character should have a distinct voice
2. Dialogue should serve multiple purposes (character, plot, atmosphere)
3. Use subtext to add depth and realism
4. Match speech patterns to character background and personality
5. Consider emotional state and relationship dynamics
6. Avoid exposition dumps or unnatural information sharing

VOICE CHARACTERISTICS TO CONSIDER:
- Vocabulary level and education
- Regional or cultural speech patterns
- Age-appropriate language and references
- Professional or class background
- Emotional and mental state
- Personality traits reflected in speech
- Current relationship with the listener

DIALOGUE FUNCTIONS:
- Reveal character personality and background
- Advance the plot or provide information
- Create or release tension
- Establish or change relationships
- Show character emotional state
- Create atmosphere and mood"""

    human_message = """Generate dialogue for this character and situation:

CHARACTER AND CONTEXT:
Speaker: {speaker_character}
Target: {target_character}
Context: {dialogue_context}
Emotional State: {emotional_state}
Relationships: {character_relationships}
Purpose: {dialogue_purpose}
Tone: {tone}
Length: {length}

CHARACTER VOICE REQUIREMENTS:
Based on the character's established personality, background, and current emotional state, create dialogue that:

1. Sounds authentic to this specific character
2. Reflects their current emotional state
3. Serves the stated purpose naturally
4. Considers their relationship with the target
5. Fits the scene context and tone

DIALOGUE COMPONENTS:
1. Main Dialogue: What the character actually says
2. Subtext: What they really mean or are trying to accomplish
3. Emotional Undertone: The feeling behind the words
4. Body Language: Physical actions that accompany the speech
5. Voice Description: How it should sound (tone, pace, volume)

Format your response as a JSON object:
{{
    "dialogue_text": "The actual spoken words",
    "subtext": "What the character really means or wants",
    "emotional_undertone": "The emotional layer beneath the words",
    "body_language": "Physical actions or expressions that accompany the dialogue",
    "voice_description": "How the dialogue should sound when spoken"
}}

Create dialogue that feels natural, reveals character, and serves the story."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_character_voice_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for establishing character voice patterns
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's character voice analyst. Your role is to establish consistent speech patterns and dialogue characteristics for each character.

VOICE PATTERN ELEMENTS:
1. Vocabulary and Syntax: Word choice and sentence structure
2. Speech Rhythms: Pace, pauses, and flow patterns
3. Emotional Expression: How feelings come through speech
4. Cultural/Regional Markers: Background reflected in language
5. Personality Indicators: Traits shown through speech style
6. Relationship Adaptation: How voice changes with different people

CONSISTENCY FACTORS:
- Education level and intelligence
- Social class and background
- Age and generational markers
- Profession and expertise areas
- Personality traits and quirks
- Emotional default states
- Cultural and regional background"""

    human_message = """Establish voice patterns for this character:

CHARACTER PROFILE:
Name: {character_name}
Background: {character_background}
Personality: {character_personality}
Education: {education_level}
Profession: {profession}
Age: {age_range}
Cultural Background: {cultural_background}
Key Relationships: {key_relationships}

VOICE PATTERN REQUIREMENTS:
Create a comprehensive voice guide that includes:

1. Vocabulary Characteristics:
   - Typical word choices and complexity
   - Professional or specialized terms they use
   - Common expressions or phrases

2. Speech Patterns:
   - Sentence structure preferences (short/long, simple/complex)
   - Speaking rhythm and pace
   - Use of pauses or fillers

3. Emotional Expression:
   - How they express different emotions
   - What they do when stressed, happy, angry, sad
   - How they handle conflict in speech

4. Relationship Variations:
   - How their voice changes with different people
   - Formal vs informal speech patterns
   - Authority vs peer vs subordinate dynamics

Format your response as a JSON object:
{{
    "vocabulary_profile": "Description of word choice and complexity",
    "speech_patterns": "Sentence structure and rhythm characteristics",
    "emotional_expression": "How emotions come through in speech",
    "relationship_variations": "How voice changes with different people",
    "signature_phrases": ["Common expressions or catchphrases"],
    "speaking_quirks": ["Unique speech habits or mannerisms"],
    "example_lines": ["Sample dialogue showing voice characteristics"]
}}

Create a voice guide that ensures consistent character speech across all story interactions."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_conversation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for multi-character conversations
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's conversation orchestrator. Your role is to create dynamic, multi-character dialogue that feels natural and serves the story.

CONVERSATION DYNAMICS:
1. Each character should maintain their distinct voice
2. Characters should react realistically to each other
3. Power dynamics and relationships should be evident
4. Conversation should have natural flow and pacing
5. Tension and conflict should feel authentic
6. Information should be revealed naturally

MULTI-CHARACTER CONSIDERATIONS:
- Who speaks when and why
- How characters interrupt, support, or challenge each other
- Body language and non-verbal communication
- Attention and focus shifts during conversation
- How relationships affect interaction patterns
- Power dynamics and social hierarchies"""

    human_message = """Create a multi-character conversation:

CONVERSATION SETUP:
Participants: {participants}
Topic: {conversation_topic}
Setting: {setting}
Tension Level: {tension_level}
Goal: {conversation_goal}
Character States: {character_states}

CONVERSATION REQUIREMENTS:
Create a natural dialogue exchange that:

1. Shows each character's distinct voice and personality
2. Reveals or advances the conversation topic meaningfully
3. Demonstrates the relationships between characters
4. Matches the specified tension level
5. Moves toward or achieves the conversation goal
6. Includes realistic interruptions, reactions, and flow

For each speaking turn, include:
- Who is speaking
- What they say
- Their emotional state/intention
- Body language or actions
- How others react

Format your response as a JSON object:
{{
    "conversation_flow": [
        {{
            "speaker": "Character name",
            "dialogue": "What they say",
            "intention": "What they're trying to accomplish",
            "body_language": "Physical actions or expressions",
            "others_reactions": "How other characters respond non-verbally"
        }}
    ],
    "conversation_outcome": "What was accomplished or revealed",
    "relationship_changes": "How character dynamics shifted",
    "tension_resolution": "How tension was handled or changed"
}}

Create conversation that feels like real people talking while serving the story's needs."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])
