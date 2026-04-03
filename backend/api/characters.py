"""
Character management endpoints for VERSE platform
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime

from core import get_character_manager, CharacterState, CharacterCreationResult
from utils.auth_utils import get_current_user
from utils.helpers import get_database_connection

# Initialize router
characters_router = APIRouter(prefix="/characters", tags=["characters"])

# Request/Response models
class CharacterCreationRequest(BaseModel):
    name: str = Field(..., description="Character name")
    role: str = Field(..., description="Character role")
    genre: str = Field(..., description="Story genre")
    age_range: Optional[str] = Field(None, description="Age range")
    personality_traits: Optional[List[str]] = Field(None, description="Personality traits")
    background: Optional[str] = Field(None, description="Character background")
    motivation: Optional[str] = Field(None, description="Character motivation")

class CharacterResponse(BaseModel):
    character_id: str
    name: str
    role: str
    current_emotional_state: str
    personality_traits: Dict[str, str]
    current_goals: List[str]
    relationships: Dict[str, str]
    character_arc_progress: float
    created_at: datetime
    last_updated: datetime

class CharacterListItem(BaseModel):
    character_id: str
    name: str
    role: str
    current_emotional_state: str
    character_arc_progress: float
    last_updated: datetime

class CharacterUpdateRequest(BaseModel):
    story_events: List[str] = Field(..., description="Recent story events")
    new_relationships: Optional[Dict[str, str]] = Field(None, description="New relationships")
    emotional_state: Optional[str] = Field(None, description="New emotional state")

@characters_router.post("/create", response_model=CharacterResponse)
async def create_character(
    character_request: CharacterCreationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new character
    """
    try:
        character_manager = get_character_manager()
        
        # Create character using core manager
        result = await character_manager.create_character_async(
            name=character_request.name,
            role=character_request.role,
            genre=character_request.genre,
            age_range=character_request.age_range,
            personality_traits=character_request.personality_traits,
            background=character_request.background,
            motivation=character_request.motivation
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Character creation failed: {result.error_message}"
            )
        
        character_state = result.character_state
        
        # Save character to database
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO characters (
                character_id, user_id, name, role, current_emotional_state,
                personality_traits, current_goals, relationships,
                character_arc_progress, created_at, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            character_state.character_id,
            current_user["user_id"],
            character_state.name,
            character_request.role,
            character_state.current_emotional_state,
            str(character_state.personality_traits),
            ",".join(character_state.current_goals),
            str(character_state.relationships),
            character_state.character_arc_progress,
            character_state.last_updated,
            character_state.last_updated
        ))
        
        conn.commit()
        conn.close()
        
        return CharacterResponse(
            character_id=character_state.character_id,
            name=character_state.name,
            role=character_request.role,
            current_emotional_state=character_state.current_emotional_state,
            personality_traits=character_state.personality_traits,
            current_goals=character_state.current_goals,
            relationships=character_state.relationships,
            character_arc_progress=character_state.character_arc_progress,
            created_at=character_state.last_updated,
            last_updated=character_state.last_updated
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Character creation error: {str(e)}"
        )

@characters_router.get("/", response_model=List[CharacterListItem])
async def list_user_characters(
    current_user: dict = Depends(get_current_user)
):
    """
    List user's characters
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT character_id, name, role, current_emotional_state, 
                   character_arc_progress, last_updated
            FROM characters 
            WHERE user_id = ?
            ORDER BY last_updated DESC
        """, (current_user["user_id"],))
        
        characters = cursor.fetchall()
        conn.close()
        
        return [
            CharacterListItem(
                character_id=char[0],
                name=char[1],
                role=char[2],
                current_emotional_state=char[3],
                character_arc_progress=char[4],
                last_updated=char[5]
            )
            for char in characters
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list characters: {str(e)}"
        )

@characters_router.get("/{character_id}", response_model=CharacterResponse)
async def get_character_details(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed character information
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT character_id, name, role, current_emotional_state,
                   personality_traits, current_goals, relationships,
                   character_arc_progress, created_at, last_updated
            FROM characters 
            WHERE character_id = ? AND user_id = ?
        """, (character_id, current_user["user_id"]))
        
        character_data = cursor.fetchone()
        
        if not character_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        conn.close()
        
        # Parse stored data
        try:
            personality_traits = eval(character_data[4]) if character_data[4] else {}
            relationships = eval(character_data[6]) if character_data[6] else {}
        except:
            personality_traits = {}
            relationships = {}
        
        current_goals = character_data[5].split(",") if character_data[5] else []
        
        return CharacterResponse(
            character_id=character_data[0],
            name=character_data[1],
            role=character_data[2],
            current_emotional_state=character_data[3],
            personality_traits=personality_traits,
            current_goals=current_goals,
            relationships=relationships,
            character_arc_progress=character_data[7],
            created_at=character_data[8],
            last_updated=character_data[9]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get character details: {str(e)}"
        )

@characters_router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: str,
    update_request: CharacterUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update character based on story events
    """
    try:
        # Verify character ownership
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT character_id FROM characters WHERE character_id = ? AND user_id = ?",
            (character_id, current_user["user_id"])
        )
        
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        conn.close()
        
        # Update character using core manager
        character_manager = get_character_manager()
        
        result = await character_manager.update_character_async(
            character_id=character_id,
            story_events=update_request.story_events,
            new_relationships=update_request.new_relationships,
            emotional_state=update_request.emotional_state
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Character update failed: {result.error_message}"
            )
        
        updated_state = result.updated_state
        
        # Update database
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE characters 
            SET current_emotional_state = ?, personality_traits = ?,
                current_goals = ?, relationships = ?, character_arc_progress = ?,
                last_updated = ?
            WHERE character_id = ?
        """, (
            updated_state.current_emotional_state,
            str(updated_state.personality_traits),
            ",".join(updated_state.current_goals),
            str(updated_state.relationships),
            updated_state.character_arc_progress,
            updated_state.last_updated,
            character_id
        ))
        
        conn.commit()
        conn.close()
        
        return CharacterResponse(
            character_id=updated_state.character_id,
            name=updated_state.name,
            role="",  # Would need to store role separately
            current_emotional_state=updated_state.current_emotional_state,
            personality_traits=updated_state.personality_traits,
            current_goals=updated_state.current_goals,
            relationships=updated_state.relationships,
            character_arc_progress=updated_state.character_arc_progress,
            created_at=updated_state.last_updated,
            last_updated=updated_state.last_updated
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Character update error: {str(e)}"
        )

@characters_router.delete("/{character_id}")
async def delete_character(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a character
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Check if character exists and belongs to user
        cursor.execute(
            "SELECT character_id FROM characters WHERE character_id = ? AND user_id = ?",
            (character_id, current_user["user_id"])
        )
        
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        # Delete character
        cursor.execute("DELETE FROM characters WHERE character_id = ?", (character_id,))
        conn.commit()
        conn.close()
        
        return {"message": "Character deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete character: {str(e)}"
        )

@characters_router.get("/{character_id}/development")
async def get_character_development(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get character development summary
    """
    try:
        # Verify character ownership
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT character_id FROM characters WHERE character_id = ? AND user_id = ?",
            (character_id, current_user["user_id"])
        )
        
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        conn.close()
        
        # Get development summary from character manager
        character_manager = get_character_manager()
        development_summary = character_manager.get_character_development_summary(character_id)
        
        return development_summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get character development: {str(e)}"
        )

@characters_router.post("/{character_id}/validate-dialogue")
async def validate_character_dialogue(
    character_id: str,
    dialogue: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate dialogue consistency with character
    """
    try:
        # Verify character ownership
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT character_id FROM characters WHERE character_id = ? AND user_id = ?",
            (character_id, current_user["user_id"])
        )
        
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        conn.close()
        
        # Validate dialogue using character manager
        character_manager = get_character_manager()
        validation_result = character_manager.validate_character_consistency(character_id, dialogue)
        
        return {
            "is_valid": validation_result.is_valid,
            "errors": validation_result.errors,
            "warnings": validation_result.warnings,
            "suggestions": validation_result.suggestions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dialogue validation error: {str(e)}"
        )