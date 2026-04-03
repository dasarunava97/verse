"""
Authentication endpoints for VERSE platform
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
import sqlite3
from datetime import datetime, timedelta

from utils.auth_utils import (
    create_access_token,
    hash_password,
    verify_password,
    get_current_user
)
from utils.helpers import get_database_connection, get_config_value
from utils.validators import validate_username, validate_email, validate_password

# Initialize router
auth_router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Request/Response models
class UserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    full_name: Optional[str] = Field(None, max_length=100, description="User's full name")
    first_name: Optional[str] = Field(None, max_length=50, description="User's first name")
    last_name: Optional[str] = Field(None, max_length=50, description="User's last name")

class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="User password")

class AuthResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user_id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username"),
    first_name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    full_name: Optional[str] = Field(None, description="User's full name")
    email: Optional[str] = Field(None, description="User's email address")

class UserProfile(BaseModel):
    user_id: int
    username: str
    email: str
    full_name: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]
    story_count: int
    total_choices_made: int

@auth_router.post("/register", response_model=AuthResponse)
async def register_user(user_data: UserRegistration):
    """
    Register a new user
    """
    try:
        # Validate input data
        username_validation = validate_username(user_data.username)
        if not username_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid username: {', '.join(username_validation['errors'])}"
            )
        
        email_validation = validate_email(user_data.email)
        if not email_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid email: {', '.join(email_validation['errors'])}"
            )
        
        password_validation = validate_password(user_data.password)
        if not password_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid password: {', '.join(password_validation['errors'])}"
            )
        
        # Connect to database
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Check if username or email already exists
        cursor.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (user_data.username, user_data.email)
        )
        
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email already registered"
            )
        
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        # user_id = int(datetime.now().timestamp())
        full_name = user_data.full_name if user_data.full_name else f"{user_data.first_name or ''} {user_data.last_name or ''}".strip()
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (

            user_data.username,
            user_data.email,
            hashed_password,
            full_name,
            datetime.now()
        ))
        
        conn.commit()
        user_id = cursor.lastrowid
        print(f"User registered with ID: {user_id}")

        conn.close()
        
        # Create access token
        token_expires = timedelta(hours=get_config_value("auth.token_expiry_hours", 24))
        access_token = create_access_token(
            data={"sub": user_id, "username": user_data.username},
            expires_delta=token_expires
        )
        
        return AuthResponse(
            access_token=access_token,
            expires_in=int(token_expires.total_seconds()),
            user_id=user_id,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            full_name=full_name,
            email=user_data.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@auth_router.post("/login", response_model=AuthResponse)
async def login_user(login_data: UserLogin):
    """
    Login user and return access token
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Find user by username or email
        cursor.execute("""
            SELECT id, username, email, password_hash, full_name  
            FROM users 
            WHERE username = ? OR email = ?
        """, (login_data.username, login_data.username))
        
        user = cursor.fetchone()
        
        if not user or not verify_password(login_data.password, user[3]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        user_id, username, email, _, full_name = user
        first_name = full_name.split(' ')[0] if full_name else ''
        last_name = ' '.join(full_name.split(' ')[1:]) if full_name and len(full_name.split(' ')) > 1 else ''
        
        # Update last login
        # cursor.execute(
        #     "UPDATE users SET last_login = ? WHERE id = ?",
        #     (datetime.now(), user_id)
        # )
        #
        # conn.commit()
        conn.close()
        
        # Create access token
        token_expires = timedelta(hours=get_config_value("auth.token_expiry_hours", 24))
        access_token = create_access_token(
            data={"sub": user_id, "username": username},
            expires_delta=token_expires
        )
        
        return AuthResponse(
            access_token=access_token,
            expires_in=int(token_expires.total_seconds()),
            user_id=user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
            full_name=full_name,
            email=email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@auth_router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Get user details
        cursor.execute("""
            SELECT username, email, full_name, created_at, last_login
            FROM users 
            WHERE id = ?
        """, (current_user["user_id"],))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get user statistics
        cursor.execute(
            "SELECT COUNT(*) FROM stories WHERE id = ?",
            (current_user["user_id"],)
        )
        story_count = cursor.fetchone()[0]
        
        cursor.execute(
            "SELECT COUNT(*) FROM user_choices WHERE id = ?",
            (current_user["user_id"],)
        )
        choices_count = cursor.fetchone()[0]
        
        conn.close()
        
        return UserProfile(
            user_id=current_user["user_id"],
            username=user_data[0],
            email=user_data[1],
            full_name=user_data[2],
            created_at=user_data[3],
            last_login=user_data[4],
            story_count=story_count,
            total_choices_made=choices_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )

@auth_router.put("/profile")
async def update_user_profile(
    full_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile
    """
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        if full_name is not None:
            cursor.execute(
                "UPDATE users SET full_name = ? WHERE id = ?",
                (full_name, current_user["user_id"])
            )
        
        conn.commit()
        conn.close()
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@auth_router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """
    Logout user (client should discard token)
    """
    return {"message": "Logged out successfully"}

@auth_router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh access token
    """
    try:
        # Create new access token
        token_expires = timedelta(hours=get_config_value("auth.token_expiry_hours", 24))
        access_token = create_access_token(
            data={"sub": current_user["user_id"], "username": current_user["username"]},
            expires_delta=token_expires
        )
        
        return AuthResponse(
            access_token=access_token,
            expires_in=int(token_expires.total_seconds()),
            user_id=current_user["user_id"],
            username=current_user["username"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )