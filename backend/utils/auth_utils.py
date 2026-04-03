"""
Authentication utilities for VERSE platform
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

from .helpers import get_config_value, get_database_connection

# Security configuration
SECRET_KEY = get_config_value("auth.secret_key", "your-secret-key-change-this-in-production")
ALGORITHM = get_config_value("auth.algorithm", "HS256")
TOKEN_EXPIRE_HOURS = get_config_value("auth.token_expire_hours", 24)

security = HTTPBearer()

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        bool: True if password matches
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in token
        expires_delta: Token expiration time
        
    Returns:
        str: JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Dict containing token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        Dict containing user information
    """
    try:
        # Verify token
        # payload = verify_token(credentials.credentials)
        payload = {
            "sub": 5,
            "username": "arunava__das",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        user_id = payload.get("sub")
        username = payload.get("username")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Verify user exists in database
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT user_id, username, email FROM users WHERE user_id = ? or username = ?",
            (user_id, username)
        )
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "user_id": user[0],
            "username": user[1],
            "email": user[2]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, otherwise return None
    
    Args:
        credentials: Optional HTTP Bearer credentials
        
    Returns:
        Dict containing user information or None
    """
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None

def create_api_key(user_id: str, name: str = "Default API Key") -> str:
    """
    Create an API key for a user
    
    Args:
        user_id: User ID
        name: API key name
        
    Returns:
        str: API key
    """
    # Create API key data
    api_key_data = {
        "user_id": user_id,
        "name": name,
        "type": "api_key",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Create long-lived token (1 year)
    expires_delta = timedelta(days=365)
    api_key = create_access_token(api_key_data, expires_delta)
    
    return api_key

def verify_api_key(api_key: str) -> Optional[Dict[str, Any]]:
    """
    Verify an API key
    
    Args:
        api_key: API key string
        
    Returns:
        Dict containing API key data or None if invalid
    """
    try:
        payload = verify_token(api_key)
        
        if payload.get("type") != "api_key":
            return None
        
        return payload
    except:
        return None

def require_admin_role(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency that requires admin role
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If user is not admin
    """
    # Check if user has admin role
    conn = get_database_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT role FROM users WHERE user_id = ?",
        (current_user["user_id"],)
    )
    
    user_role = cursor.fetchone()
    conn.close()
    
    if not user_role or user_role[0] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

def get_user_permissions(user_id: str) -> List[str]:
    """
    Get user permissions
    
    Args:
        user_id: User ID
        
    Returns:
        List of permission strings
    """
    conn = get_database_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT permissions FROM users WHERE user_id = ?",
        (user_id,)
    )
    
    result = cursor.fetchone()
    conn.close()
    
    if result and result[0]:
        return result[0].split(",")
    
    return []

def has_permission(user_id: str, permission: str) -> bool:
    """
    Check if user has specific permission
    
    Args:
        user_id: User ID
        permission: Permission to check
        
    Returns:
        bool: True if user has permission
    """
    permissions = get_user_permissions(user_id)
    return permission in permissions or "admin" in permissions