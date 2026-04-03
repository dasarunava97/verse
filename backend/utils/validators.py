"""
Input validation utilities for VERSE platform
"""

import re
from typing import List, Optional, Dict, Any
from email_validator import validate_email as email_validate, EmailNotValidError
import yaml
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))


# Load configuration
def load_config():
    config_path = os.path.join(CURRENT_DIR, "..", "config.yaml")
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

config = load_config()

# Custom exception classes
class ValidationError(Exception):
    """Base validation error"""
    pass

class UserValidationError(ValidationError):
    """User data validation error"""
    pass

class StoryValidationError(ValidationError):
    """Story data validation error"""
    pass

# Username validation
def validate_username(username: str) -> Dict[str, Any]:
    """
    Validate username
    
    Args:
        username: Username to validate
        
    Returns:
        Dict: Validation result with is_valid and errors
    """
    errors = []
    
    if not username:
        errors.append("Username is required")
        return {"is_valid": False, "errors": errors}
    
    # Length check
    if len(username) < 3:
        errors.append("Username must be at least 3 characters long")
    
    if len(username) > 50:
        errors.append("Username cannot exceed 50 characters")
    
    # Character validation
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        errors.append("Username can only contain letters, numbers, hyphens, and underscores")
    
    # Cannot start or end with special characters
    if username.startswith(('_', '-')) or username.endswith(('_', '-')):
        errors.append("Username cannot start or end with special characters")
    
    # Reserved usernames
    reserved_usernames = {
        'admin', 'administrator', 'root', 'user', 'guest', 'api', 'system',
        'support', 'help', 'info', 'test', 'demo', 'verse', 'story'
    }
    
    if username.lower() in reserved_usernames:
        errors.append("This username is reserved")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }

# Email validation
def validate_email(email: str) -> Dict[str, Any]:
    """
    Validate email address
    
    Args:
        email: Email to validate
        
    Returns:
        Dict: Validation result with is_valid and errors
    """
    errors = []
    
    if not email:
        errors.append("Email is required")
        return {"is_valid": False, "errors": errors}
    
    try:
        # Use email-validator library
        validated_email = email_validate(email)
        email = validated_email.email
    except EmailNotValidError as e:
        errors.append(f"Invalid email format: {str(e)}")
    
    # Additional length check
    if len(email) > 100:
        errors.append("Email cannot exceed 100 characters")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "normalized_email": email.lower() if len(errors) == 0 else None
    }

# Password validation
def validate_password(password: str) -> Dict[str, Any]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
        
    Returns:
        Dict: Validation result with is_valid, errors, and strength
    """
    errors = []
    
    if not password:
        errors.append("Password is required")
        return {"is_valid": False, "errors": errors, "strength": "weak"}
    
    # Length requirements
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if len(password) > 128:
        errors.append("Password cannot exceed 128 characters")
    
    # Character requirements
    has_lower = re.search(r'[a-z]', password)
    has_upper = re.search(r'[A-Z]', password)
    has_digit = re.search(r'\d', password)
    has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
    
    if not has_lower:
        errors.append("Password must contain at least one lowercase letter")
    
    if not has_upper:
        errors.append("Password must contain at least one uppercase letter")
    
    if not has_digit:
        errors.append("Password must contain at least one number")
    
    if not has_special:
        errors.append("Password must contain at least one special character")
    
    # Common passwords check (basic)
    common_passwords = {
        'password', '12345678', 'password123', 'admin123', 'qwerty123',
        'letmein', 'welcome', 'monkey123', 'dragon123'
    }
    
    if password.lower() in common_passwords:
        errors.append("Password is too common")
    
    # Calculate strength
    strength_score = 0
    if has_lower: strength_score += 1
    if has_upper: strength_score += 1
    if has_digit: strength_score += 1
    if has_special: strength_score += 1
    if len(password) >= 12: strength_score += 1
    
    if strength_score >= 4:
        strength = "strong"
    elif strength_score >= 3:
        strength = "medium"
    else:
        strength = "weak"
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "strength": strength
    }

# Story title validation
def validate_story_title(title: str) -> Dict[str, Any]:
    """
    Validate story title
    
    Args:
        title: Story title to validate
        
    Returns:
        Dict: Validation result
    """
    errors = []
    
    if not title:
        errors.append("Story title is required")
        return {"is_valid": False, "errors": errors}
    
    # Clean title
    title = title.strip()
    
    # Length validation
    if len(title) < 3:
        errors.append("Story title must be at least 3 characters long")
    
    if len(title) > 200:
        errors.append("Story title cannot exceed 200 characters")
    
    # Character validation (allow more characters for titles)
    if not re.match(r'^[a-zA-Z0-9\s\-_.,!?:()\'\"]+$', title):
        errors.append("Story title contains invalid characters")
    
    # Check for inappropriate content (basic)
    inappropriate_words = ['hate', 'explicit', 'violence']  # Basic list
    title_lower = title.lower()
    
    for word in inappropriate_words:
        if word in title_lower:
            errors.append("Story title may contain inappropriate content")
            break
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "cleaned_title": title if len(errors) == 0 else None
    }

# Genre validation
def validate_genre(genre: str) -> Dict[str, Any]:
    """
    Validate story genre
    
    Args:
        genre: Genre to validate
        
    Returns:
        Dict: Validation result
    """
    errors = []
    
    if not genre:
        errors.append("Genre is required")
        return {"is_valid": False, "errors": errors}
    
    # Get supported genres from config
    supported_genres = config.get('story', {}).get('supported_genres', [])
    
    if genre not in supported_genres:
        errors.append(f"Unsupported genre. Supported genres: {', '.join(supported_genres)}")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "supported_genres": supported_genres
    }

# Story content validation
def validate_story_content(content: str, max_length: Optional[int] = None) -> Dict[str, Any]:
    """
    Validate story content
    
    Args:
        content: Story content to validate
        max_length: Maximum allowed length
        
    Returns:
        Dict: Validation result
    """
    errors = []
    
    if not content:
        errors.append("Story content is required")
        return {"is_valid": False, "errors": errors}
    
    # Clean content
    content = content.strip()
    
    # Length validation
    if len(content) < 50:
        errors.append("Story content must be at least 50 characters long")
    
    max_story_length = max_length or config.get('story', {}).get('max_story_length', 5000)
    if len(content) > max_story_length:
        errors.append(f"Story content cannot exceed {max_story_length} characters")
    
    # Word count validation
    word_count = len(content.split())
    if word_count < 10:
        errors.append("Story content must contain at least 10 words")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "word_count": word_count,
        "character_count": len(content)
    }

# Choice validation
def validate_choice_text(choice_text: str) -> Dict[str, Any]:
    """
    Validate choice text
    
    Args:
        choice_text: Choice text to validate
        
    Returns:
        Dict: Validation result
    """
    errors = []
    
    if not choice_text:
        errors.append("Choice text is required")
        return {"is_valid": False, "errors": errors}
    
    # Clean text
    choice_text = choice_text.strip()
    
    # Length validation
    if len(choice_text) < 5:
        errors.append("Choice text must be at least 5 characters long")
    
    if len(choice_text) > 200:
        errors.append("Choice text cannot exceed 200 characters")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "cleaned_text": choice_text if len(errors) == 0 else None
    }

# Validation helper functions
def validate_positive_integer(value: Any, field_name: str = "value") -> Dict[str, Any]:
    """
    Validate positive integer
    
    Args:
        value: Value to validate
        field_name: Name of the field for error messages
        
    Returns:
        Dict: Validation result
    """
    errors = []
    
    try:
        int_value = int(value)
        if int_value <= 0:
            errors.append(f"{field_name} must be a positive integer")
    except (ValueError, TypeError):
        errors.append(f"{field_name} must be a valid integer")
        int_value = None
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "value": int_value
    }

def validate_id_list(id_list: List[Any], field_name: str = "IDs") -> Dict[str, Any]:
    """
    Validate list of IDs
    
    Args:
        id_list: List of IDs to validate
        field_name: Name of the field for error messages
        
    Returns:
        Dict: Validation result
    """
    errors = []
    validated_ids = []
    
    if not isinstance(id_list, list):
        errors.append(f"{field_name} must be a list")
        return {"is_valid": False, "errors": errors}
    
    for i, id_value in enumerate(id_list):
        try:
            validated_id = int(id_value)
            if validated_id <= 0:
                errors.append(f"{field_name}[{i}] must be a positive integer")
            else:
                validated_ids.append(validated_id)
        except (ValueError, TypeError):
            errors.append(f"{field_name}[{i}] must be a valid integer")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "validated_ids": validated_ids
    }
