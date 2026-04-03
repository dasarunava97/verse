"""
User progress tracking endpoints for VERSE platform
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime, timedelta

from utils.auth_utils import get_current_user
from utils.helpers import get_database_connection

# Initialize router
progress_router = APIRouter(prefix="/progress", tags=["progress"])

# Request/Response models
class ProgressOverview(BaseModel):
    user_id: str
    total_stories: int
    completed_stories: int
    total_choices: int
    total_characters: int
    favorite_genre: str
    average_story_progress: float
    total_play_time_hours: float
    stories_this_week: int
    completion_rate: float

class StoryProgressItem(BaseModel):
    story_id: str
    title: str
    genre: str
    progress: float
    last_played: datetime
    total_scenes: int
    total_choices: int
    estimated_completion_time: str
    is_completed: bool

class AchievementItem(BaseModel):
    achievement_id: str
    name: str
    description: str
    category: str
    earned_at: Optional[datetime]
    progress_value: int
    target_value: int
    is_earned: bool

class PlaytimeStats(BaseModel):
    total_hours: float
    this_week_hours: float
    this_month_hours: float
    average_session_duration: float
    longest_session_duration: float
    most_active_day: str
    daily_breakdown: Dict[str, float]

class GenrePreferences(BaseModel):
    genre_distribution: Dict[str, int]
    favorite_genre: str
    completion_rates_by_genre: Dict[str, float]
    average_progress_by_genre: Dict[str, float]

@progress_router.get("/overview", response_model=ProgressOverview)
async def get_progress_overview(
    current_user: dict = Depends(get_current_user)
):
    """
    Get comprehensive progress overview for user
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        user_id = current_user["user_id"]
        
        # Get basic story statistics
        cursor.execute("""
            SELECT COUNT(*) as total_stories,
                   COUNT(CASE WHEN story_progress >= 1.0 THEN 1 END) as completed_stories,
                   AVG(story_progress) as avg_progress,
                   genre
            FROM stories 
            WHERE user_id = ?
            GROUP BY genre
            ORDER BY COUNT(*) DESC
        """, (user_id,))
        
        story_stats = cursor.fetchall()
        
        # Calculate totals
        total_stories = sum(stat[0] for stat in story_stats)
        completed_stories = sum(stat[1] for stat in story_stats)
        
        if story_stats:
            avg_progress = sum(stat[2] * stat[0] for stat in story_stats) / total_stories
            favorite_genre = story_stats[0][3] if story_stats else "Unknown"
        else:
            avg_progress = 0.0
            favorite_genre = "None"
        
        # Get choice count
        cursor.execute(
            "SELECT COUNT(*) FROM user_choices WHERE user_id = ?",
            (user_id,)
        )
        total_choices = cursor.fetchone()[0]
        
        # Get character count
        cursor.execute(
            "SELECT COUNT(*) FROM characters WHERE user_id = ?",
            (user_id,)
        )
        total_characters = cursor.fetchone()[0]
        
        # Get stories this week
        week_ago = datetime.now() - timedelta(days=7)
        cursor.execute("""
            SELECT COUNT(*) FROM stories 
            WHERE user_id = ? AND created_at >= ?
        """, (user_id, week_ago))
        
        stories_this_week = cursor.fetchone()[0]
        
        # Calculate play time (estimated based on story activity)
        cursor.execute("""
            SELECT COUNT(*) * 0.5 as estimated_hours
            FROM user_choices 
            WHERE user_id = ?
        """, (user_id,))
        
        total_play_time = cursor.fetchone()[0] or 0.0
        
        conn.close()
        
        completion_rate = (completed_stories / total_stories) if total_stories > 0 else 0.0
        
        return ProgressOverview(
            user_id=user_id,
            total_stories=total_stories,
            completed_stories=completed_stories,
            total_choices=total_choices,
            total_characters=total_characters,
            favorite_genre=favorite_genre,
            average_story_progress=avg_progress,
            total_play_time_hours=total_play_time,
            stories_this_week=stories_this_week,
            completion_rate=completion_rate
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress overview: {str(e)}"
        )

@progress_router.get("/stories", response_model=List[StoryProgressItem])
async def get_story_progress(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    completed_only: bool = Query(default=False),
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed progress for user's stories
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Build query with filters
        query = """
            SELECT s.story_id, s.title, s.genre, s.story_progress, s.last_updated,
                   COUNT(DISTINCT sc.choice_id) as choice_count
            FROM stories s
            LEFT JOIN user_choices sc ON s.story_id = sc.story_id
            WHERE s.user_id = ?
        """
        params = [current_user["user_id"]]
        
        if completed_only:
            query += " AND s.story_progress >= 1.0"
        
        query += """
            GROUP BY s.story_id, s.title, s.genre, s.story_progress, s.last_updated
            ORDER BY s.last_updated DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        stories = cursor.fetchall()
        
        conn.close()
        
        progress_items = []
        for story in stories:
            # Estimate completion time based on progress and choices
            estimated_time = "Unknown"
            if story[3] > 0:
                remaining_progress = 1.0 - story[3]
                estimated_minutes = remaining_progress * 60  # Rough estimate
                if estimated_minutes < 60:
                    estimated_time = f"{int(estimated_minutes)} minutes"
                else:
                    estimated_time = f"{estimated_minutes/60:.1f} hours"
            
            progress_items.append(StoryProgressItem(
                story_id=story[0],
                title=story[1],
                genre=story[2],
                progress=story[3],
                last_played=story[4],
                total_scenes=int(story[3] * 20),  # Estimated based on progress
                total_choices=story[5],
                estimated_completion_time=estimated_time,
                is_completed=story[3] >= 1.0
            ))
        
        return progress_items
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get story progress: {str(e)}"
        )

@progress_router.get("/achievements", response_model=List[AchievementItem])
async def get_user_achievements(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user achievements and progress
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        user_id = current_user["user_id"]
        
        # Get user statistics for achievement calculation
        cursor.execute("""
            SELECT COUNT(*) as total_stories,
                   COUNT(CASE WHEN story_progress >= 1.0 THEN 1 END) as completed_stories
            FROM stories WHERE user_id = ?
        """, (user_id,))
        
        story_stats = cursor.fetchone()
        total_stories, completed_stories = story_stats
        
        cursor.execute(
            "SELECT COUNT(*) FROM user_choices WHERE user_id = ?",
            (user_id,)
        )
        total_choices = cursor.fetchone()[0]
        
        cursor.execute(
            "SELECT COUNT(*) FROM characters WHERE user_id = ?",
            (user_id,)
        )
        total_characters = cursor.fetchone()[0]
        
        conn.close()
        
        # Define achievements
        achievements = [
            {
                "achievement_id": "first_story",
                "name": "First Steps",
                "description": "Create your first story",
                "category": "story",
                "target_value": 1,
                "progress_value": min(total_stories, 1)
            },
            {
                "achievement_id": "story_master",
                "name": "Story Master",
                "description": "Create 10 stories",
                "category": "story",
                "target_value": 10,
                "progress_value": total_stories
            },
            {
                "achievement_id": "completionist",
                "name": "Completionist",
                "description": "Complete 5 stories",
                "category": "completion",
                "target_value": 5,
                "progress_value": completed_stories
            },
            {
                "achievement_id": "decision_maker",
                "name": "Decision Maker",
                "description": "Make 100 choices",
                "category": "choices",
                "target_value": 100,
                "progress_value": total_choices
            },
            {
                "achievement_id": "character_creator",
                "name": "Character Creator",
                "description": "Create 10 characters",
                "category": "characters",
                "target_value": 10,
                "progress_value": total_characters
            }
        ]
        
        achievement_items = []
        for achievement in achievements:
            is_earned = achievement["progress_value"] >= achievement["target_value"]
            
            achievement_items.append(AchievementItem(
                achievement_id=achievement["achievement_id"],
                name=achievement["name"],
                description=achievement["description"],
                category=achievement["category"],
                earned_at=datetime.now() if is_earned else None,
                progress_value=achievement["progress_value"],
                target_value=achievement["target_value"],
                is_earned=is_earned
            ))
        
        return achievement_items
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get achievements: {str(e)}"
        )

@progress_router.get("/playtime", response_model=PlaytimeStats)
async def get_playtime_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed playtime statistics
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        user_id = current_user["user_id"]
        
        # Get choice timestamps for playtime estimation
        cursor.execute("""
            SELECT chosen_at, COUNT(*) as choices_per_day
            FROM user_choices 
            WHERE user_id = ?
            GROUP BY DATE(chosen_at)
            ORDER BY chosen_at DESC
        """, (user_id,))
        
        daily_activity = cursor.fetchall()
        
        # Calculate playtime estimates (rough calculation)
        total_hours = len(daily_activity) * 0.5  # Estimate 30 minutes per active day
        
        # This week
        week_ago = datetime.now() - timedelta(days=7)
        cursor.execute("""
            SELECT COUNT(*) FROM user_choices 
            WHERE user_id = ? AND chosen_at >= ?
        """, (user_id, week_ago))
        
        choices_this_week = cursor.fetchone()[0]
        this_week_hours = choices_this_week * 0.1  # Estimate 6 minutes per choice
        
        # This month
        month_ago = datetime.now() - timedelta(days=30)
        cursor.execute("""
            SELECT COUNT(*) FROM user_choices 
            WHERE user_id = ? AND chosen_at >= ?
        """, (user_id, month_ago))
        
        choices_this_month = cursor.fetchone()[0]
        this_month_hours = choices_this_month * 0.1
        
        conn.close()
        
        # Calculate daily breakdown
        daily_breakdown = {}
        for day_data in daily_activity[-7:]:  # Last 7 days
            date_str = day_data[0].strftime("%Y-%m-%d") if hasattr(day_data[0], 'strftime') else str(day_data[0])
            daily_breakdown[date_str] = day_data[1] * 0.1  # Estimate hours
        
        # Determine most active day
        most_active_day = "Monday"  # Default
        if daily_breakdown:
            most_active_day = max(daily_breakdown.keys(), key=lambda k: daily_breakdown[k])
        
        return PlaytimeStats(
            total_hours=total_hours,
            this_week_hours=this_week_hours,
            this_month_hours=this_month_hours,
            average_session_duration=0.5,  # Estimated
            longest_session_duration=2.0,  # Estimated
            most_active_day=most_active_day,
            daily_breakdown=daily_breakdown
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get playtime stats: {str(e)}"
        )

@progress_router.get("/genre-preferences", response_model=GenrePreferences)
async def get_genre_preferences(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's genre preferences and statistics
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        user_id = current_user["user_id"]
        
        # Get genre distribution
        cursor.execute("""
            SELECT genre, 
                   COUNT(*) as story_count,
                   AVG(story_progress) as avg_progress,
                   COUNT(CASE WHEN story_progress >= 1.0 THEN 1 END) as completed_count
            FROM stories 
            WHERE user_id = ?
            GROUP BY genre
            ORDER BY story_count DESC
        """, (user_id,))
        
        genre_stats = cursor.fetchall()
        
        conn.close()
        
        if not genre_stats:
            return GenrePreferences(
                genre_distribution={},
                favorite_genre="None",
                completion_rates_by_genre={},
                average_progress_by_genre={}
            )
        
        # Process statistics
        genre_distribution = {}
        completion_rates = {}
        average_progress = {}
        
        for stat in genre_stats:
            genre, count, avg_prog, completed = stat
            genre_distribution[genre] = count
            average_progress[genre] = avg_prog
            completion_rates[genre] = (completed / count) if count > 0 else 0.0
        
        favorite_genre = genre_stats[0][0]  # Most frequent genre
        
        return GenrePreferences(
            genre_distribution=genre_distribution,
            favorite_genre=favorite_genre,
            completion_rates_by_genre=completion_rates,
            average_progress_by_genre=average_progress
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get genre preferences: {str(e)}"
        )

@progress_router.get("/streaks")
async def get_activity_streaks(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user activity streaks
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        user_id = current_user["user_id"]
        
        # Get daily activity for streak calculation
        cursor.execute("""
            SELECT DISTINCT DATE(chosen_at) as activity_date
            FROM user_choices 
            WHERE user_id = ?
            ORDER BY activity_date DESC
        """, (user_id,))
        
        activity_dates = [row[0] for row in cursor.fetchall()]
        
        # Calculate current streak
        current_streak = 0
        if activity_dates:
            today = datetime.now().date()
            for i, date in enumerate(activity_dates):
                expected_date = today - timedelta(days=i)
                if isinstance(date, str):
                    activity_date = datetime.strptime(date, "%Y-%m-%d").date()
                else:
                    activity_date = date
                
                if activity_date == expected_date:
                    current_streak += 1
                else:
                    break
        
        # Calculate longest streak
        longest_streak = 0
        temp_streak = 0
        
        for i in range(len(activity_dates) - 1):
            current_date = activity_dates[i]
            next_date = activity_dates[i + 1]
            
            if isinstance(current_date, str):
                current_date = datetime.strptime(current_date, "%Y-%m-%d").date()
            if isinstance(next_date, str):
                next_date = datetime.strptime(next_date, "%Y-%m-%d").date()
            
            if (current_date - next_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 0
        
        longest_streak = max(longest_streak, temp_streak)
        
        conn.close()
        
        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_active_days": len(activity_dates),
            "last_activity": activity_dates[0] if activity_dates else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get activity streaks: {str(e)}"
        )