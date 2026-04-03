"""
AI generation endpoints for VERSE platform
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime

from core import (
    get_story_generator, 
    get_character_manager, 
    get_choice_processor,
    create_interactive_story,
    continue_interactive_story
)
from utils.auth_utils import get_current_user
from utils.helpers import get_database_connection

# Initialize router
generate_router = APIRouter(prefix="/generate", tags=["generation"])

# Request/Response models
class QuickStoryRequest(BaseModel):
    genre: str = Field(..., description="Story genre")
    length: str = Field(default="short", description="Story length (short, medium, long)")
    theme: Optional[str] = Field(None, description="Story theme")

class StoryIdeaRequest(BaseModel):
    genres: List[str] = Field(..., description="Preferred genres")
    themes: Optional[List[str]] = Field(None, description="Preferred themes")
    settings: Optional[List[str]] = Field(None, description="Preferred settings")
    count: int = Field(default=3, ge=1, le=10, description="Number of ideas to generate")

class CharacterIdeaRequest(BaseModel):
    role: str = Field(..., description="Character role")
    genre: str = Field(..., description="Story genre")
    personality_hints: Optional[List[str]] = Field(None, description="Personality hints")

class DialogueGenerationRequest(BaseModel):
    character_id: str = Field(..., description="Character ID")
    situation: str = Field(..., description="Current situation")
    emotion: str = Field(..., description="Character's emotion")
    target_character: Optional[str] = Field(None, description="Who they're talking to")

class StoryIdeaResponse(BaseModel):
    title: str
    genre: str
    theme: str
    setting: str
    premise: str
    protagonist_concept: str
    conflict: str
    estimated_length: str

class CharacterIdeaResponse(BaseModel):
    name: str
    role: str
    age_range: str
    personality_summary: str
    background_concept: str
    motivation: str
    potential_arc: str

class DialogueResponse(BaseModel):
    character_id: str
    dialogue_text: str
    emotion: str
    context: str
    alternative_options: List[str]

class GenerationStatsResponse(BaseModel):
    user_id: str
    total_generations: int
    story_generations: int
    character_generations: int
    dialogue_generations: int
    favorite_generation_type: str
    this_month_generations: int

@generate_router.post("/story-idea", response_model=List[StoryIdeaResponse])
async def generate_story_ideas(
    request: StoryIdeaRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate story ideas based on user preferences
    """
    try:
        story_generator = get_story_generator()
        
        ideas = []
        for i in range(request.count):
            # Use one of the provided genres
            genre = request.genres[i % len(request.genres)]
            theme = request.themes[i % len(request.themes)] if request.themes else None
            setting = request.settings[i % len(request.settings)] if request.settings else None
            
            # For this example, we'll create structured ideas
            # In a real implementation, this would use AI generation
            idea = StoryIdeaResponse(
                title=f"Generated Story {i+1}",
                genre=genre,
                theme=theme or "Adventure",
                setting=setting or "Modern world",
                premise=f"A {genre} story about overcoming challenges",
                protagonist_concept="A determined hero facing their destiny",
                conflict="Internal and external struggles must be overcome",
                estimated_length="Medium (2-3 hours)"
            )
            ideas.append(idea)
        
        # Log generation request
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO generation_log (user_id, generation_type, request_data, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            current_user["user_id"],
            "story_idea",
            str(request.dict()),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        return ideas
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Story idea generation failed: {str(e)}"
        )

@generate_router.post("/character-idea", response_model=CharacterIdeaResponse)
async def generate_character_idea(
    request: CharacterIdeaRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate character idea based on role and genre
    """
    try:
        character_manager = get_character_manager()
        
        # For this example, we'll create a structured character idea
        # In a real implementation, this would use AI generation
        character_idea = CharacterIdeaResponse(
            name="Generated Character",
            role=request.role,
            age_range="Adult",
            personality_summary=f"A {request.role} with compelling traits suited for {request.genre}",
            background_concept=f"Background fitting the {request.genre} genre",
            motivation="Driven by personal goals and story needs",
            potential_arc="Character growth through story challenges"
        )
        
        # Log generation request
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO generation_log (user_id, generation_type, request_data, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            current_user["user_id"],
            "character_idea",
            str(request.dict()),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        return character_idea
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Character idea generation failed: {str(e)}"
        )

@generate_router.post("/dialogue", response_model=DialogueResponse)
async def generate_dialogue(
    request: DialogueGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate dialogue for a character in a specific situation
    """
    try:
        # Verify character ownership
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name FROM characters 
            WHERE character_id = ? AND user_id = ?
        """, (request.character_id, current_user["user_id"]))
        
        character = cursor.fetchone()
        
        if not character:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Character not found"
            )
        
        character_name = character[0]
        
        # Generate dialogue (simplified for this example)
        # In a real implementation, this would use the AI client and character context
        dialogue_text = f"[{character_name} speaking with {request.emotion}]: This dialogue fits the situation: {request.situation}"
        
        alternative_options = [
            f"Alternative 1: {character_name} responds differently",
            f"Alternative 2: {character_name} takes another approach",
            f"Alternative 3: {character_name} shows different emotion"
        ]
        
        # Log generation request
        cursor.execute("""
            INSERT INTO generation_log (user_id, generation_type, request_data, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            current_user["user_id"],
            "dialogue",
            str(request.dict()),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        return DialogueResponse(
            character_id=request.character_id,
            dialogue_text=dialogue_text,
            emotion=request.emotion,
            context=request.situation,
            alternative_options=alternative_options
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dialogue generation failed: {str(e)}"
        )

@generate_router.post("/quick-story")
async def generate_quick_story(
    request: QuickStoryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a complete short story quickly
    """
    try:
        story_generator = get_story_generator()
        
        # Create a quick story
        result = await story_generator.create_story_async(
            genre=request.genre,
            theme=request.theme,
            story_length=request.length,
            target_audience="adult"
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quick story generation failed: {result.error_message}"
            )
        
        # Save to database
        conn = get_database_connection()
        cursor = conn.cursor()
        
        story_session = result.story_session
        
        cursor.execute("""
            INSERT INTO stories (
                story_id, session_id, user_id, title, genre, theme,
                current_scene, story_progress, story_context,
                target_audience, story_length, tone, character_ids,
                created_at, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            story_session.story_id,
            story_session.session_id,
            current_user["user_id"],
            story_session.title,
            story_session.genre,
            request.theme,
            story_session.current_scene,
            story_session.story_progress,
            story_session.story_context,
            story_session.target_audience,
            story_session.story_length,
            story_session.tone,
            ",".join(story_session.character_ids),
            story_session.created_at,
            story_session.last_updated
        ))
        
        # Log generation
        cursor.execute("""
            INSERT INTO generation_log (user_id, generation_type, request_data, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            current_user["user_id"],
            "quick_story",
            str(request.dict()),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "story_id": story_session.story_id,
            "session_id": story_session.session_id,
            "title": story_session.title,
            "opening_scene": story_session.current_scene,
            "character_count": len(story_session.character_ids),
            "has_choices": result.available_choices is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quick story generation failed: {str(e)}"
        )

@generate_router.get("/stats", response_model=GenerationStatsResponse)
async def get_generation_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's generation statistics
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        user_id = current_user["user_id"]
        
        # Get generation counts by type
        cursor.execute("""
            SELECT generation_type, COUNT(*) as count
            FROM generation_log 
            WHERE user_id = ?
            GROUP BY generation_type
        """, (user_id,))
        
        generation_counts = dict(cursor.fetchall())
        
        # Get this month's generations
        month_ago = datetime.now().replace(day=1)  # First day of current month
        cursor.execute("""
            SELECT COUNT(*) FROM generation_log 
            WHERE user_id = ? AND created_at >= ?
        """, (user_id, month_ago))
        
        this_month_count = cursor.fetchone()[0]
        
        conn.close()
        
        total_generations = sum(generation_counts.values())
        favorite_type = max(generation_counts.keys(), key=lambda k: generation_counts[k]) if generation_counts else "none"
        
        return GenerationStatsResponse(
            user_id=user_id,
            total_generations=total_generations,
            story_generations=generation_counts.get("story_idea", 0) + generation_counts.get("quick_story", 0),
            character_generations=generation_counts.get("character_idea", 0),
            dialogue_generations=generation_counts.get("dialogue", 0),
            favorite_generation_type=favorite_type,
            this_month_generations=this_month_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get generation stats: {str(e)}"
        )

@generate_router.get("/history")
async def get_generation_history(
    generation_type: Optional[str] = None,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's generation history
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT generation_type, request_data, created_at
            FROM generation_log 
            WHERE user_id = ?
        """
        params = [current_user["user_id"]]
        
        if generation_type:
            query += " AND generation_type = ?"
            params.append(generation_type)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        history = cursor.fetchall()
        
        conn.close()
        
        return [
            {
                "generation_type": item[0],
                "request_data": item[1],
                "created_at": item[2]
            }
            for item in history
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get generation history: {str(e)}"
        )