"""
Choice handling endpoints for VERSE platform
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime

from core import get_choice_processor, get_story_generator, Choice, ChoiceNode
from utils.auth_utils import get_current_user
from utils.helpers import get_database_connection

# Initialize router
choices_router = APIRouter(prefix="/choices", tags=["choices"])

# Request/Response models
class ChoiceGenerationRequest(BaseModel):
    story_id: str = Field(..., description="Story ID")
    session_id: str = Field(..., description="Story session ID")
    difficulty_level: str = Field(default="medium", description="Choice difficulty")
    choice_type: str = Field(default="action", description="Type of choices")
    max_choices: int = Field(default=3, ge=2, le=6, description="Maximum number of choices")

class ChoiceResponse(BaseModel):
    choice_id: str
    text: str
    description: str
    immediate_outcome: str
    long_term_consequences: List[str]
    character_motivation: str
    risk_level: str
    reward_potential: str
    difficulty: str

class ChoiceNodeResponse(BaseModel):
    node_id: str
    story_context: str
    available_choices: List[ChoiceResponse]
    choice_type: str
    difficulty_level: str
    created_at: datetime

class ChoiceMadeRequest(BaseModel):
    choice_id: str = Field(..., description="ID of chosen option")
    choice_node_id: str = Field(..., description="ID of choice node")

class ChoiceConsequenceResponse(BaseModel):
    choice_id: str
    immediate_consequences: str
    character_changes: Dict[str, Any]
    relationship_changes: Dict[str, str]
    story_impact: str
    future_opportunities: List[str]
    future_obstacles: List[str]
    unintended_consequences: str
    next_scene_setup: str
    consequence_severity: str

class ChoiceHistoryItem(BaseModel):
    choice_id: str
    choice_text: str
    story_id: str
    chosen_at: datetime
    consequences_summary: str
    risk_level: str

@choices_router.post("/generate", response_model=ChoiceNodeResponse)
async def generate_choices(
    request: ChoiceGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate choice options for current story moment
    """
    try:
        # Verify story ownership
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT current_scene, story_context, genre
            FROM stories 
            WHERE story_id = ? AND user_id = ?
        """, (request.story_id, current_user["user_id"]))
        
        story_data = cursor.fetchone()
        
        if not story_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )
        
        conn.close()
        
        current_scene, story_context, genre = story_data
        
        # Get story session and character states
        story_generator = get_story_generator()
        story_session = story_generator.get_story_session(request.session_id)
        
        if not story_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story session not found"
            )
        
        # Generate choices using choice processor
        choice_processor = get_choice_processor()
        
        result = await choice_processor.generate_choices_async(
            current_scene=current_scene,
            character_states=story_session.character_states if hasattr(story_session, 'character_states') else {},
            story_context=story_context,
            genre=genre,
            difficulty_level=request.difficulty_level,
            choice_type=request.choice_type,
            max_choices=request.max_choices
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Choice generation failed: {result.error_message}"
            )
        
        choice_node = result.choice_node
        
        # Convert choices to response format
        choice_responses = [
            ChoiceResponse(
                choice_id=choice.choice_id,
                text=choice.text,
                description=choice.description,
                immediate_outcome=choice.immediate_outcome,
                long_term_consequences=choice.long_term_consequences,
                character_motivation=choice.character_motivation,
                risk_level=choice.risk_level,
                reward_potential=choice.reward_potential,
                difficulty=choice.difficulty
            )
            for choice in choice_node.available_choices
        ]
        
        return ChoiceNodeResponse(
            node_id=choice_node.node_id,
            story_context=choice_node.story_context,
            available_choices=choice_responses,
            choice_type=choice_node.choice_type,
            difficulty_level=choice_node.difficulty_level,
            created_at=choice_node.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Choice generation error: {str(e)}"
        )

@choices_router.post("/make-choice", response_model=ChoiceConsequenceResponse)
async def make_choice(
    story_id: str,
    request: ChoiceMadeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Process player choice and return consequences
    """
    try:
        # Verify story ownership
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT session_id, current_scene
            FROM stories 
            WHERE story_id = ? AND user_id = ?
        """, (story_id, current_user["user_id"]))
        
        story_data = cursor.fetchone()
        
        if not story_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )
        
        session_id, current_scene = story_data
        
        # Process choice consequences
        choice_processor = get_choice_processor()
        
        result = await choice_processor.process_choice_consequences_async(
            choice_id=request.choice_id,
            node_id=request.choice_node_id,
            additional_context=f"Story ID: {story_id}"
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Choice processing failed: {result.error_message}"
            )
        
        consequences = result.consequences
        
        # Record choice in database
        cursor.execute("""
            INSERT INTO user_choices (
                choice_id, user_id, story_id, choice_text, chosen_at,
                consequences_summary, risk_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            request.choice_id,
            current_user["user_id"],
            story_id,
            "Choice made",  # Would need to get actual choice text
            datetime.now(),
            consequences.immediate_consequences,
            consequences.consequence_severity
        ))
        
        conn.commit()
        conn.close()
        
        return ChoiceConsequenceResponse(
            choice_id=consequences.choice_id,
            immediate_consequences=consequences.immediate_consequences,
            character_changes=consequences.character_changes,
            relationship_changes=consequences.relationship_changes,
            story_impact=consequences.story_impact,
            future_opportunities=consequences.future_opportunities,
            future_obstacles=consequences.future_obstacles,
            unintended_consequences=consequences.unintended_consequences,
            next_scene_setup=consequences.next_scene_setup,
            consequence_severity=consequences.consequence_severity
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Choice processing error: {str(e)}"
        )

@choices_router.get("/history", response_model=List[ChoiceHistoryItem])
async def get_choice_history(
    story_id: Optional[str] = Query(None, description="Filter by story ID"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's choice history
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Build query with optional story filter
        query = """
            SELECT choice_id, choice_text, story_id, chosen_at, 
                   consequences_summary, risk_level
            FROM user_choices 
            WHERE user_id = ?
        """
        params = [current_user["user_id"]]
        
        if story_id:
            query += " AND story_id = ?"
            params.append(story_id)
        
        query += " ORDER BY chosen_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        choices = cursor.fetchall()
        
        conn.close()
        
        return [
            ChoiceHistoryItem(
                choice_id=choice[0],
                choice_text=choice[1],
                story_id=choice[2],
                chosen_at=choice[3],
                consequences_summary=choice[4],
                risk_level=choice[5]
            )
            for choice in choices
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get choice history: {str(e)}"
        )

@choices_router.get("/node/{node_id}")
async def get_choice_node(
    node_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get specific choice node details
    """
    try:
        choice_processor = get_choice_processor()
        choice_node = choice_processor.get_choice_node(node_id)
        
        if not choice_node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Choice node not found"
            )
        
        # Convert to response format
        choice_responses = [
            ChoiceResponse(
                choice_id=choice.choice_id,
                text=choice.text,
                description=choice.description,
                immediate_outcome=choice.immediate_outcome,
                long_term_consequences=choice.long_term_consequences,
                character_motivation=choice.character_motivation,
                risk_level=choice.risk_level,
                reward_potential=choice.reward_potential,
                difficulty=choice.difficulty
            )
            for choice in choice_node.available_choices
        ]
        
        return ChoiceNodeResponse(
            node_id=choice_node.node_id,
            story_context=choice_node.story_context,
            available_choices=choice_responses,
            choice_type=choice_node.choice_type,
            difficulty_level=choice_node.difficulty_level,
            created_at=choice_node.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get choice node: {str(e)}"
        )

@choices_router.get("/analytics")
async def get_choice_analytics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's choice analytics
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Get choice statistics
        cursor.execute("""
            SELECT COUNT(*) as total_choices,
                   COUNT(DISTINCT story_id) as stories_with_choices,
                   risk_level,
                   COUNT(*) as risk_count
            FROM user_choices 
            WHERE user_id = ?
            GROUP BY risk_level
        """, (current_user["user_id"],))
        
        risk_stats = cursor.fetchall()
        
        cursor.execute("""
            SELECT COUNT(*) as total_choices
            FROM user_choices 
            WHERE user_id = ?
        """, (current_user["user_id"],))
        
        total_choices = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(DISTINCT story_id) as unique_stories
            FROM user_choices 
            WHERE user_id = ?
        """, (current_user["user_id"],))
        
        unique_stories = cursor.fetchone()[0]
        
        conn.close()
        
        # Get analytics from choice processor
        choice_processor = get_choice_processor()
        processor_analytics = choice_processor.get_choice_analytics()
        
        # Compile risk distribution
        risk_distribution = {}
        for risk_stat in risk_stats:
            risk_distribution[risk_stat[2]] = risk_stat[3]
        
        return {
            "total_choices": total_choices,
            "unique_stories": unique_stories,
            "risk_distribution": risk_distribution,
            "average_choices_per_story": total_choices / unique_stories if unique_stories > 0 else 0,
            "processor_analytics": processor_analytics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get choice analytics: {str(e)}"
        )

@choices_router.post("/validate")
async def validate_choice_quality(
    choices_data: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """
    Validate quality of choice options
    """
    try:
        choice_processor = get_choice_processor()
        
        # Convert dict data to Choice objects for validation
        choices = []
        for choice_data in choices_data:
            choice = Choice(
                choice_id=choice_data.get("choice_id", "temp_id"),
                text=choice_data.get("text", ""),
                description=choice_data.get("description", ""),
                immediate_outcome=choice_data.get("immediate_outcome", ""),
                character_motivation=choice_data.get("character_motivation", ""),
                risk_level=choice_data.get("risk_level", "medium"),
                reward_potential=choice_data.get("reward_potential", "moderate")
            )
            choices.append(choice)
        
        validation_result = choice_processor.validate_choice_quality(choices)
        
        return {
            "is_valid": validation_result.is_valid,
            "errors": validation_result.errors,
            "warnings": validation_result.warnings,
            "suggestions": validation_result.suggestions,
            "choice_count": len(choices)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Choice validation error: {str(e)}"
        )