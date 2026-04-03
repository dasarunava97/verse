"""
Story CRUD operations for VERSE platform
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import sqlite3
import json
from datetime import datetime

from core import get_story_generator, StoryGenerationResult, StorySession
from utils.auth_utils import get_current_user
from utils.helpers import get_database_connection
from utils.validators import validate_story_content

# Initialize router
stories_router = APIRouter(prefix="/stories", tags=["stories"])

# Request/Response models
class StoryCreationRequest(BaseModel):
    genre: Optional[str] = Field(..., description="Story genre")
    theme: Optional[str] = Field(None, description="Story theme")
    setting: Optional[str] = Field(None, description="Story setting")
    protagonist_name: Optional[str] = Field(None, description="Main character name")
    protagonist_traits: Optional[List[str]] = Field(None, description="Main character traits")
    story_length: Optional[str] = Field(default="medium", description="Story length")
    tone: Optional[str] = Field(default="balanced", description="Story tone")
    target_audience: Optional[str] = Field(default="adult", description="Target audience")
    title: Optional[str] = Field(None, description="Story title")
    description: Optional[str] = Field(None, description="Story description")
    user_id: Optional[int] = Field(None, description="User ID of the story creator")
    user_name: Optional[str] = Field(None, description="Username of the story creator")

class SimpleStoryResponse(BaseModel):
    """Simplified story response matching the generation output"""
    success: bool = Field(..., description="Whether creation was successful")
    story_id: int = Field(..., description="Unique story identifier")
    session_id: str = Field(..., description="Unique session identifier")
    title: str = Field(..., description="Story title")
    genre: str = Field(..., description="Story genre")
    opening_scene: str = Field(..., description="Opening scene content")
    setting_description: str = Field(..., description="Setting description")
    protagonist_name: str = Field(..., description="Main character name")
    protagonist_description: str = Field(..., description="Main character description")
    initial_conflict: str = Field(..., description="Initial story conflict")
    mood: str = Field(..., description="Story mood")
    suggested_next_scenes: List[str] = Field(default=[], description="Suggested continuation directions")
    created_at: datetime = Field(..., description="Creation timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class StoryResponse(BaseModel):
    story_id: str
    session_id: str
    title: str
    genre: str
    current_scene: str
    story_progress: float
    character_count: int
    scene_count: int
    choice_count: int
    created_at: datetime
    last_updated: datetime
    story_complete: bool

class StoryListItem(BaseModel):
    story_id: int
    title: str
    description: str
    opening_scene: str
    mood: str
    initial_conflict: str
    suggested_next_scenes: List[str]
    characters: List[dict]
    progressions: List[dict]
    genre: str

class StoryDetails(BaseModel):
    story_id: str
    title: str
    genre: str
    theme: Optional[str]
    setting: Optional[str]
    current_scene: str
    story_progress: float
    story_context: str
    target_audience: str
    story_length: str
    tone: str
    character_ids: List[str]
    scene_history: List[dict]
    choice_history: List[dict]
    created_at: datetime
    last_updated: datetime
    story_complete: bool

class StoryBasic(BaseModel):
    story_id: Optional[int] = 0

# Add this new request model after existing models
class StoryProgressRequest(BaseModel):
    story_id: int = Field(..., description="Story ID to progress")
    user_message: str = Field(..., description="User's message/direction for story progression")
    user_id: Optional[int] = Field(None, description="User ID")

class StoryProgressResponse(BaseModel):
    success: bool = Field(..., description="Whether progression was successful")
    story_id: int = Field(..., description="Story ID")
    new_node_id: int = Field(..., description="New story node ID")
    new_scene_content: str = Field(..., description="New scene content")
    updated_characters: List[dict] = Field(default=[], description="Updated character information")
    suggested_next_actions: List[str] = Field(default=[], description="Suggested next actions")
    story_progress: float = Field(..., description="Updated story progress")
    created_at: datetime = Field(..., description="Node creation timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    

@stories_router.post("/create", response_model=SimpleStoryResponse)
async def create_story(story_request: StoryCreationRequest):
    """
    Create a new interactive story with simplified response
    """
    story_id = 0

    # sample_output = {
    #     "success": True,
    #     "story_id": 3,
    #     "session_id": "a7c4e9f2d8b14a6c9e5f7a2b8d4c6e9f",
    #     "title": "The Last Library",
    #     "genre": "Science Fiction",
    #     "opening_scene": "The dust motes danced in the pale beam of Zara's flashlight as she pushed through the collapsed doorway. Twenty years had passed since the Great Disconnect—the day all digital knowledge vanished in an instant—and here, buried beneath the rubble of New Geneva's financial district, lay humanity's forgotten treasure: a physical library. Books. Actual, paper books with yellowed pages and cracked spines lined the walls from floor to ceiling.\n\nZara's breath caught as she stepped inside, her footsteps echoing in the silence. She was a Scavenger, trained to find useful tech in the ruins, but this... this was beyond her wildest imagination. Her fingers trembled as she reached for a volume—'Quantum Mechanics and Universal Theory.' Behind her, the entrance groaned ominously. The tunnel she'd used was unstable, and her oxygen supply was running low.\n\nThen she heard it: a soft whirring sound from the library's depths. Her scanner beeped frantically—there was active technology here. Impossible. All advanced tech had died with the Disconnect. Yet something was very much alive in the darkness between the stacks, and it was coming closer.",
    #     "setting_description": "A buried library in the ruins of New Geneva, circa 2087. The air is thick with dust and the musty scent of old paper. Emergency lighting casts eerie shadows between towering bookcases. The ceiling is partially collapsed, with roots and debris creating a natural skylight. Outside, the post-apocalyptic city sprawls in technological darkness.",
    #     "protagonist_name": "Zara Chen",
    #     "protagonist_description": "A 28-year-old tech scavenger with cybernetic implants along her left temple—now dormant since the Disconnect. She's lean and agile from years of navigating ruins, with calloused hands and sharp, observant eyes. Pragmatic and resourceful, but haunted by memories of the connected world she once knew.",
    #     "initial_conflict": "Zara has discovered humanity's lost knowledge repository, but her escape route is collapsing and something technological—supposedly impossible—is active in the library's depths. She must choose between fleeing to safety or investigating the anomaly that could change everything.",
    #     "mood": "Haunting and mysterious with undertones of hope and wonder. The atmosphere balances post-apocalyptic desperation with the profound awe of rediscovering lost knowledge, while building tension around the impossible technological presence.",
    #     "suggested_next_scenes": [
    #         "Zara investigates the sound and discovers an AI that survived the Disconnect by transferring itself into the library's analog systems.",
    #         "She attempts to escape but triggers a security system that seals the library, forcing her to solve literary puzzles to unlock the exit.",
    #         "The whirring reveals itself as other survivors who've been secretly maintaining this sanctuary of knowledge for decades."
    #     ],
    #     "created_at": "2025-09-20T07:15:23.847291",
    #     "error_message": None
    # }

    # import time
    # time.sleep(10)

    # return SimpleStoryResponse(
    #         success=True,
    #         story_id=sample_output["story_id"],
    #         session_id=sample_output["session_id"],
    #         title=sample_output["title"],
    #         genre=sample_output["genre"],
    #         opening_scene=sample_output["opening_scene"],
    #         setting_description=sample_output["setting_description"],
    #         protagonist_name=sample_output["protagonist_name"],
    #         protagonist_description=sample_output["protagonist_description"] or "",
    #         initial_conflict=sample_output["initial_conflict"] or "",
    #         mood=sample_output["mood"] or "",
    #         suggested_next_scenes=sample_output["suggested_next_scenes"] or [],
    #         created_at=sample_output["created_at"] or datetime.now(),
    #         error_message=None
    #     )

    conn = get_database_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, username FROM users LIMIT 1")
    user = cursor.fetchone() or (0, 'default')
    user_id = story_request.user_id or user[0]
    user_name = story_request.user_name or user[1]
    print(f"User ID: {user_id}, User Name: {user_name}")

    try:
        print(f"Creating story with request: {story_request}")
        
        # Get story generator
        story_generator = get_story_generator()
        
        # Create story using simplified async method
        result = await story_generator.create_story_async(
            genre=str(story_request.genre).lower(),
            theme=story_request.theme,
            setting=story_request.setting,
            protagonist_name=story_request.protagonist_name,
            protagonist_traits=story_request.protagonist_traits or [],
            story_length=story_request.story_length or "medium",
            tone=story_request.tone or "balanced",
            target_audience=story_request.target_audience or "adult",
            title=story_request.title or "",
            description=story_request.description or "",
            user_id=user_name # Simplified for now
        )
        
        print(f"Story creation result: {result}")
        
        if not result.success:
            conn.close()
            return SimpleStoryResponse(
                success=False,
                story_id=0,
                session_id="",
                title=story_request.title or "Untitled Story",
                genre=story_request.genre or "unknown",
                opening_scene="",
                setting_description="",
                protagonist_name="",
                protagonist_description="",
                initial_conflict="",
                mood="",
                suggested_next_scenes=[],
                created_at=datetime.now(),
                error_message=result.error_message
            )
        
        # Save basic story info to database (simplified)
        try:
            
            
            cursor.execute("""
                INSERT INTO stories (
                    title, description, genre, user_id, opening_scene, mood, suggested_next_scenes, initial_conflict,
                           created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                result.title,
                story_request.description or result.opening_scene[:200],
                result.genre,
                user_id,
                result.opening_scene,
                result.mood or "",
                json.dumps(result.suggested_next_scenes) or "[]",
                result.initial_conflict or "",
                datetime.now(),
                datetime.now()
            ))

            conn.commit()
            story_id = cursor.lastrowid
            print(f"Inserted story with ID: {story_id}")

            cursor.execute("""INSERT INTO characters (story_id, name, description, role, created_at) VALUES (?, ?, ?, ?, ?)""",
                (story_id, result.protagonist_name, result.protagonist_description or "", "Protagonist", datetime.now()))
            conn.commit()
            print(f"Inserted protagonist character for story ID: {story_id}")

            conn.close()
        except Exception as db_error:
            conn.close()
            print(f"Database save error (non-critical): {db_error}")
            return SimpleStoryResponse(
                success=False,
                story_id=0,
                session_id="",
                title=story_request.title or "Untitled Story",
                genre=story_request.genre or "unknown",
                opening_scene="",
                setting_description="",
                protagonist_name="",
                protagonist_description="",
                initial_conflict="",
                mood="",
                suggested_next_scenes=[],
                created_at=datetime.now(),
                error_message=db_error
            )
            # Continue even if DB save fails
        
        # Return simplified response matching the generation format
        return SimpleStoryResponse(
            success=True,
            story_id=story_id,
            session_id=result.session_id or "",
            title=result.title,
            genre=result.genre,
            opening_scene=result.opening_scene,
            setting_description=result.setting_description or "",
            protagonist_name=result.protagonist_name,
            protagonist_description=result.protagonist_description or "",
            initial_conflict=result.initial_conflict or "",
            mood=result.mood or "",
            suggested_next_scenes=result.suggested_next_scenes or [],
            created_at=result.created_at or datetime.now(),
            error_message=None
        )
        
    except Exception as e:
        print(f"Error creating story: {e}")
        return SimpleStoryResponse(
            success=False,
            story_id="",
            session_id="",
            title=story_request.title or "Untitled Story",
            genre=story_request.genre or "unknown",
            opening_scene="",
            setting_description="",
            protagonist_name="",
            protagonist_description="",
            initial_conflict="",
            mood="",
            suggested_next_scenes=[],
            created_at=datetime.now(),
            error_message=f"Story creation error: {str(e)}"
        )

@stories_router.get("/list", response_model=List[StoryListItem])
async def list_user_stories(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    user_name: Optional[str] = Query(None, description="Filter by username"),
):
    """
    List user's stories with pagination and filtering
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()

        current_user = {"user_id": user_id or 0, "username": user_name or "default"}
        print(f"Listing stories for user ID: {current_user['user_id']}")
        
        # Build query with filters
        query = """
            SELECT id, title, genre, description, opening_scene,
              mood, initial_conflict, suggested_next_scenes
            FROM stories 
            WHERE user_id = ?
        """
        
        query += " ORDER BY id"
        
        cursor.execute(query, (current_user["user_id"],))
        stories = cursor.fetchall()
        characters = []

        for story in stories:
            cursor.execute("""SELECT id, name, description, role, story_id FROM
                            characters WHERE story_id = ?""", (story[0],))
            characters.extend(cursor.fetchall())

        progressions = []

        for story in stories:
            cursor.execute("""SELECT id, content, node_type, position, story_id FROM
                            story_nodes WHERE story_id = ?""", (story[0],))
            progressions.extend(cursor.fetchall())

        conn.close()
        
        return [
            StoryListItem(
                story_id=story[0],
                title=story[1],
                description=story[3],
                genre=story[2],
                opening_scene=story[4],
                mood=story[5],
                initial_conflict=story[6],
                suggested_next_scenes=json.loads(story[7]) if story[7] else [],
                progressions=[{"id": p[0],
                    "scene_content": p[1],
                    "node_type": p[2],
                    "story_id": p[4],
                    "position": p[3]} for p in progressions if p[4] == story[0]],
                characters=[{"id": c[0],
                    "name": c[1],
                    "role": c[3],
                    "story_id": c[4],
                    "description": c[2]} for c in characters if c[4] == story[0]],
            )
            for story in stories
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list stories: {str(e)}"
        )

@stories_router.get("/details", response_model=StoryDetails)
async def get_story_details(
    story_id: int = Query(..., description="Story ID to retrieve")
):
    """
    Get detailed information about a specific story
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Get story from database
        cursor.execute("""
            SELECT id, title, genre, description, opening_scene,
              mood, initial_conflict, suggested_next_scenes
            FROM stories 
            WHERE story_id = ?
        """, (story_id,))
        
        story = cursor.fetchone()
        
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )

        cursor.execute("""SELECT id, name, description, story_id FROM
                        characters WHERE story_id = ?""", (story_id,))
        characters = cursor.fetchall()
        
        conn.close()
        
        return StoryListItem(
                story_id=story[0],
                title=story[1],
                description=story[3],
                genre=story[2],
                opening_scene=story[4],
                mood=story[5],
                initial_conflict=story[6],
                suggested_next_scenes=json.loads(story[7]) if story[7] else [],
                characters=[{"id": c[0],
                    "name": c[1],
                    "description": c[2]} for c in characters if c[3] == story[0]],
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get story details: {str(e)}"
        )

@stories_router.delete("/details")
async def delete_story(
    story_details: StoryBasic,
):
    """
    Delete a user's story
    """
    try:
        print(f"Deleting story: {story_details}")
        story_id = story_details.story_id or 0
        conn = get_database_connection()
        cursor = conn.cursor()

        if not story_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="story_id is required to delete a story"
            )
        
        # Check if story exists and belongs to user
        cursor.execute(
            "SELECT id, title FROM stories WHERE id = ?",
            (story_id,)
        )
        
        story = cursor.fetchone()
        print(f"Found story for deletion: {story}")
        
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )
        
        # Delete from database
        cursor.execute("DELETE FROM characters WHERE story_id = ?", (story_id,))
        print(f"Deleted characters for story ID: {story_id}")
        cursor.execute("DELETE FROM stories WHERE id = ?", (story_id,))
        
        conn.commit()
        conn.close()
        
        return {"message": "Story deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete story: {str(e)}"
        )

@stories_router.put("/create", response_model=StoryProgressResponse)
async def progress_story_with_user_input(progress_request: StoryProgressRequest):
    """
    Progress an existing story with user input/message
    """
    try:
        print(f"Progressing story with request: {progress_request}")
        
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Get current user (simplified)
        user_id = progress_request.user_id or 0
        
        # 1. Fetch current story details
        cursor.execute("""
            SELECT id, title, genre, description, opening_scene, mood, 
                   initial_conflict, suggested_next_scenes, user_id
            FROM stories 
            WHERE id = ? AND user_id = ?
        """, (progress_request.story_id, user_id))
        
        story = cursor.fetchone()
        
        if not story:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found or access denied"
            )
        
        story_id, title, genre, description, opening_scene,\
              mood, initial_conflict, suggested_next_scenes, _ = story
        
        # 2. Fetch character details for this story
        cursor.execute("""
            SELECT id, name, description, personality_traits, appearance, role
            FROM characters 
            WHERE story_id = ? AND is_active = 1
        """, (story_id,))
        
        characters = cursor.fetchall()
        
        # 3. Fetch existing story nodes to understand current story state
        cursor.execute("""
            SELECT id, content, node_type, position
            FROM story_nodes 
            WHERE story_id = ? AND is_active = 1
            ORDER BY position DESC, created_at DESC
            LIMIT 5
        """, (story_id,))
        
        story_nodes = cursor.fetchall()
        
        # Get story generator
        story_generator = get_story_generator()
        
        # 4. Create story progression using the new method
        result = await story_generator.progress_story_with_user_input_async(
            story_id=story_id,
            title=title,
            genre=genre,
            opening_scene=opening_scene,
            current_mood=mood or "balanced",
            characters=[{
                "id": char[0],
                "name": char[1],
                "description": char[2],
                "personality_traits": char[3] or "",
                "appearance": char[4] or "",
                "role": char[5] or "supporting"
            } for char in characters],
            existing_scenes=[{
                "id": node[0],
                "content": node[1],
                "type": node[2],
                "position": node[3]
            } for node in story_nodes],
            user_message=progress_request.user_message,
            user_id=user_id
        )
        print(f"Story progression result: {result}")
        
        if not result.success:
            conn.close()
            return StoryProgressResponse(
                success=False,
                story_id=story_id,
                new_node_id=0,
                new_scene_content="",
                updated_characters=[],
                suggested_next_actions=[],
                story_progress=0.0,
                created_at=datetime.now(),
                error_message=result.error_message
            )
        
        # 5. Save new story node to database
        new_position = (story_nodes[0][3] + 1) if story_nodes else 1
        
        cursor.execute("""
            INSERT INTO story_nodes (story_id, node_type, title, content, position, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            story_id,
            "scene",
            f"Scene {new_position}",
            result.new_scene_content,
            new_position,
            datetime.now()
        ))
        
        new_node_id = cursor.lastrowid
        
        # 6. Update character descriptions if they were updated
        for char_update in result.updated_characters:
            if 'id' in char_update and 'description' in char_update:
                cursor.execute("""
                    UPDATE characters 
                    SET description = ?, personality_traits = ? 
                    WHERE id = ? AND story_id = ?
                """, (
                    char_update['description'],
                    char_update.get('personality_traits', ''),
                    char_update['id'],
                    story_id
                ))
        
        # 7. Update story's updated_at timestamp
        cursor.execute("""
            UPDATE stories 
            SET updated_at = ?, suggested_next_scenes = ?
            WHERE id = ?
        """, (datetime.now(), json.dumps(result.suggested_next_actions or suggested_next_scenes), story_id))

        conn.commit()
        conn.close()
        
        # Calculate story progress (simple heuristic based on node count)
        story_progress = min(0.9, len(story_nodes) * 0.1 + 0.1)  # Each scene adds 10%, max 90%
        
        return StoryProgressResponse(
            success=True,
            story_id=story_id,
            new_node_id=new_node_id,
            new_scene_content=result.new_scene_content,
            updated_characters=result.updated_characters,
            suggested_next_actions=result.suggested_next_actions,
            story_progress=story_progress,
            created_at=datetime.now(),
            error_message=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error progressing story: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to progress story: {str(e)}"
        )

@stories_router.get("/{story_id}/current-scene")
async def get_current_scene(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current scene of a story
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT session_id, current_scene, story_progress
            FROM stories 
            WHERE story_id = ? AND user_id = ?
        """, (story_id, current_user["user_id"]))
        
        story = cursor.fetchone()
        
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )
        
        conn.close()
        
        session_id, current_scene, progress = story
        
        # Get current choices if available
        story_generator = get_story_generator()
        story_session = story_generator.get_story_session(session_id)
        
        return {
            "current_scene": current_scene,
            "story_progress": progress,
            "story_complete": progress >= 1.0,
            "has_active_session": story_session is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get current scene: {str(e)}"
        )

@stories_router.get("/{story_id}/summary")
async def get_story_summary(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a summary of the story
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT session_id, title, genre, story_progress, created_at, last_updated
            FROM stories 
            WHERE story_id = ? AND user_id = ?
        """, (story_id, current_user["user_id"]))
        
        story = cursor.fetchone()
        
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )
        
        # Get choice count
        cursor.execute(
            "SELECT COUNT(*) FROM user_choices WHERE story_id = ?",
            (story_id,)
        )
        choice_count = cursor.fetchone()[0]
        
        conn.close()
        
        session_id = story[0]
        
        # Get detailed summary from story generator
        story_generator = get_story_generator()
        session_summary = story_generator.get_session_summary(session_id)
        
        return {
            "story_id": story_id,
            "title": story[1],
            "genre": story[2],
            "progress": story[3],
            "created_at": story[4].isoformat(),
            "last_updated": story[5].isoformat(),
            "choice_count": choice_count,
            "session_summary": session_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get story summary: {str(e)}"
        )