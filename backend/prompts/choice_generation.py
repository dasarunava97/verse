"""
Choice generation and consequence prompts for VERSE platform
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate


class ChoiceGenerationRequest(BaseModel):
    """Request model for choice generation"""
    current_scene: str = Field(..., description="Current story scene content")
    character_states: Dict[str, Any] = Field(..., description="Current character emotional/mental states")
    story_context: str = Field(..., description="Overall story context and progress")
    genre: str = Field(..., description="Story genre")
    difficulty_level: str = Field(default="medium", description="Choice difficulty (easy, medium, hard)")
    choice_type: str = Field(default="action", description="Type of choice (action, dialogue, moral, strategic)")
    max_choices: int = Field(default=3, description="Maximum number of choices to generate")

class ChoiceGenerationResponse(BaseModel):
    """Response model for choice generation"""
    choices: List[Dict[str, Any]] = Field(..., description="Generated choice options")
    choice_context: str = Field(..., description="Context for why these choices are available")
    difficulty_analysis: str = Field(..., description="Analysis of choice difficulty and implications")

class ChoiceConsequenceRequest(BaseModel):
    """Request model for choice consequence analysis"""
    chosen_option: str = Field(..., description="The choice the player made")
    alternative_options: List[str] = Field(..., description="Other choices that were available")
    character_making_choice: str = Field(..., description="Character who made the choice")
    story_context: str = Field(..., description="Current story situation")
    character_states: Dict[str, Any] = Field(..., description="Current character states")

def get_choice_generation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for generating story choices
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's choice architect. Your role is to create meaningful, engaging choices that drive the interactive story forward and reflect character agency.

CHOICE DESIGN PRINCIPLES:
1. Each choice should feel distinct and meaningful
2. Choices should reflect character personality and current state
3. Include both short-term and long-term consequences
4. Balance risk and reward across options
5. Avoid obviously "correct" or "incorrect" choices
6. Create moral complexity when appropriate

CHOICE TYPES:
- Action Choices: What the character does physically
- Dialogue Choices: How the character speaks or responds
- Moral Choices: Ethical dilemmas and value decisions
- Strategic Choices: Planning and problem-solving decisions
- Emotional Choices: How to handle feelings and relationships

QUALITY GUIDELINES:
- Choices should be clear and understandable
- Each option should lead to different story outcomes
- Consider character motivation and consistency
- Include consequences that matter to the story
- Create tension and engagement"""

    human_message = """Generate meaningful choices for this story moment:

STORY CONTEXT:
Current Scene: {current_scene}
Character States: {character_states}
Story Progress: {story_context}
Genre: {genre}
Difficulty Level: {difficulty_level}
Choice Type: {choice_type}
Number of Choices: {max_choices}

CHOICE GENERATION REQUIREMENTS:
1. Create {max_choices} distinct choice options that:
   - Feel natural to the current situation
   - Reflect different approaches or philosophies
   - Have meaningful consequences
   - Match the character's capabilities and knowledge
   - Fit the story's tone and genre

2. For each choice, provide:
   - Choice text (what the player sees)
   - Brief description of likely immediate outcome
   - Potential long-term consequences
   - Character motivation behind this choice
   - Risk/reward assessment

3. Ensure choices represent different:
   - Personality approaches (cautious vs bold, kind vs harsh)
   - Problem-solving methods
   - Relationship impacts
   - Story direction possibilities

Format your response as a JSON object:
{{
    "choices": [
        {{
            "text": "Choice option text",
            "description": "What this choice represents",
            "immediate_outcome": "Likely immediate result",
            "long_term_consequences": "Potential future implications",
            "character_motivation": "Why character might choose this",
            "risk_level": "low/medium/high",
            "reward_potential": "Description of potential benefits"
        }}
    ],
    "choice_context": "Why these specific choices are available now",
    "difficulty_analysis": "Analysis of choice complexity and implications"
}}

Create choices that make the player think and feel invested in the outcome."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_choice_consequence_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for determining choice consequences
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's consequence engine. Your role is to determine realistic, meaningful outcomes for player choices that maintain story consistency and character development.

CONSEQUENCE PRINCIPLES:
1. Consequences should feel logical and earned
2. Consider both intended and unintended results
3. Impact character relationships and development
4. Affect future story possibilities
5. Maintain genre and tone consistency
6. Create ripple effects that matter

CONSEQUENCE TYPES:
- Immediate: What happens right now
- Short-term: Effects in the next few scenes
- Long-term: Impact on overall story arc
- Character: How it affects character development
- Relationship: Changes in character dynamics
- World: How it affects the story world

REALISM GUIDELINES:
- Actions should have believable results
- Consider character capabilities and limitations
- Account for other characters' likely reactions
- Maintain internal story logic
- Allow for both positive and negative outcomes"""

    human_message = """Determine the consequences of this player choice:

CHOICE CONTEXT:
Chosen Option: {chosen_option}
Alternative Options: {alternative_options}
Character Making Choice: {character_making_choice}
Story Context: {story_context}
Character States: {character_states}

CONSEQUENCE ANALYSIS REQUIREMENTS:
1. Immediate Consequences:
   - What happens in the next few moments
   - Other characters' immediate reactions
   - Environmental or situational changes

2. Character Impact:
   - How this affects the choosing character
   - Emotional and psychological effects
   - Skill or knowledge gained/lost
   - Confidence or self-image changes

3. Relationship Effects:
   - How other characters view this choice
   - Trust, respect, or affection changes
   - New alliances or conflicts created

4. Story Progression:
   - How this choice affects the plot
   - New opportunities or obstacles created
   - Future choices enabled or prevented

5. Unintended Consequences:
   - Unexpected results or side effects
   - Information revealed or hidden
   - Resources gained or lost

Format your response as a JSON object:
{{
    "immediate_consequences": "What happens right now",
    "character_changes": {{
        "emotional_state": "New emotional state",
        "personality_impact": "Any personality effects",
        "skills_knowledge": "Skills or knowledge affected"
    }},
    "relationship_changes": {{
        "character_name": "how relationship changed"
    }},
    "story_impact": "How this affects the overall plot",
    "future_opportunities": ["New possibilities opened"],
    "future_obstacles": ["New challenges created"],
    "unintended_consequences": "Unexpected results or side effects",
    "next_scene_setup": "How this leads into the next story moment"
}}

Ensure consequences feel realistic and advance the story meaningfully."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])

def get_choice_validation_prompt() -> ChatPromptTemplate:
    """
    Create prompt template for validating if a choice is appropriate
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    system_message = """You are VERSE's choice validator. Your role is to ensure that generated choices are appropriate, logical, and enhance the storytelling experience.

VALIDATION CRITERIA:
1. Logical Consistency: Choice must make sense in context
2. Character Authenticity: Choice must fit character capabilities
3. Genre Appropriateness: Choice must fit story genre and tone
4. Meaningful Impact: Choice must have significant consequences
5. Player Agency: Choice must feel empowering to the player
6. Content Safety: Choice must be appropriate for target audience

VALIDATION PROCESS:
- Check if choice is physically/mentally possible for character
- Verify choice fits current story context
- Ensure choice has meaningful impact on story
- Confirm choice respects character development
- Validate appropriateness for target audience"""

    human_message = """Validate this choice option for story appropriateness:

CHOICE TO VALIDATE:
Choice Text: {choice_text}
Choice Description: {choice_description}

STORY CONTEXT:
Current Situation: {current_situation}
Character Capabilities: {character_capabilities}
Story Genre: {genre}
Target Audience: {target_audience}
Character Personality: {character_personality}

VALIDATION REQUIREMENTS:
Analyze the choice across these dimensions:

1. Logical Consistency:
   - Does the choice make sense in the current situation?
   - Is it physically/mentally possible for the character?

2. Character Authenticity:
   - Would this character realistically consider this option?
   - Does it respect their established personality and beliefs?

3. Story Impact:
   - Will this choice create meaningful consequences?
   - Does it advance or enhance the narrative?

4. Appropriateness:
   - Is it suitable for the target audience?
   - Does it fit the genre and tone?

Format your response as a JSON object:
{{
    "is_valid": true/false,
    "validation_score": "1-10 rating",
    "issues_found": ["List any problems identified"],
    "improvements_suggested": ["Suggestions for better alternatives"],
    "reasoning": "Detailed explanation of validation decision"
}}

Provide constructive feedback to improve choice quality."""

    return ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", human_message)
    ])
