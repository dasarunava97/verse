"""
Helper utilities for VERSE platform
"""

import os
import yaml
import sqlite3
import logging
import uuid
from datetime import datetime
from typing import Any, Optional, Dict, Union
from pathlib import Path
import json
import logging.handlers
import httpx
import re
from langchain_openai import ChatOpenAI


CURRENT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Configuration cache
_config_cache: Optional[Dict[str, Any]] = None

def load_config() -> Dict[str, Any]:
    """
    Load configuration from config.yaml
    
    Returns:
        Dict containing configuration data
    """
    global _config_cache
    
    if _config_cache is not None:
        return _config_cache

    config_path = os.path.join(CURRENT_DIRECTORY, "..", "config.yaml")

    try:
        with open(config_path, 'r', encoding='utf-8') as file:
            _config_cache = yaml.safe_load(file) or {}
    except FileNotFoundError:
        # Create default config if file doesn't exist
        _config_cache = create_default_config()
        save_config(_config_cache)
    except Exception as e:
        logging.error(f"Failed to load config: {str(e)}")
        _config_cache = create_default_config()
    
    return _config_cache

_llm_client = None

def get_llm_client() -> ChatOpenAI:
    """
    Get or create LLM client instance (singleton pattern)
    
    Returns:
        ChatOpenAI: Configured LLM client
    """
    global _llm_client
    
    if _llm_client is None:
        ai_config = _config_cache.get('ai', {})
        client = httpx.Client(verify=False)
        
        # Get API key from environment or config
        api_key = ai_config.get('api_key', '')
        if not api_key or api_key.startswith('${'):
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
        # print(f"Ai config {ai_config}")
        _llm_client = ChatOpenAI(
            model=ai_config.get('model', 'gpt-3.5-turbo'),
            # temperature=ai_config.get('temperature', 0.1),
            # max_tokens=ai_config.get('max_tokens', 1000),
            api_key=api_key,
            base_url=ai_config.get('base_url', 'https://api.openai.com/v1'),
            http_client=client
        )
    
    return _llm_client

def clean_llm_json_output(output):
    if output.startswith("'''"):
        output = output.lstrip("'''").rstrip("'''").strip()
    
    if "```" in output:
        output = output.split("```", 1)[1].rstrip("```").lstrip('```').lstrip('json').strip()
    
    return output

def parse_response_content(content: str) -> Dict[str, Any]:
    """
    Parse AI response content, handling both JSON and plain text
    
    Args:
        content: Raw response content
        
    Returns:
        Dict: Parsed content
    """
    # Remove code block markers if present
    if "```json" in content:
        # Extract content between json code block markers
        pattern = r"```json\n(.*?)```"
        matches = re.findall(pattern, content, re.DOTALL)
        if matches:
            content = matches[0]
    
    # Try to parse as JSON first
    parsed_json = safe_json_loads(content)
    if parsed_json is not None:
        return parsed_json
    
    # If not JSON, return as plain text
    return {"text": content.strip()}

def reset_llm_client():
    """Reset the LLM client (useful for testing or config changes)"""
    global _llm_client
    _llm_client = None

def create_default_config() -> Dict[str, Any]:
    """
    Create default configuration
    
    Returns:
        Dict containing default configuration
    """
    return {
        "app": {
            "name": "VERSE",
            "version": "1.0.0",
            "debug": True,
            "reload": True,
            "log_level": "INFO"
        },
        "api": {
            "host": "localhost",
            "port": 8000,
            "cors_origins": ["http://localhost:3000", "http://localhost:8080"],
            "trusted_hosts": ["localhost", "127.0.0.1"],
            "max_request_size": 10485760  # 10MB
        },
        "auth": {
            "secret_key": "your-secret-key-change-this-in-production",
            "algorithm": "HS256",
            "token_expire_hours": 24
        },
        "database": {
            "path": "verse.db",
            "timeout": 30,
            "check_same_thread": False
        },
        "ai": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "max_tokens": 2000,
            "temperature": 0.7,
            "timeout": 30
        },
        "story": {
            "supported_genres": [
                "fantasy", "sci-fi", "mystery", "romance", "horror", 
                "adventure", "drama", "comedy", "thriller", "historical"
            ],
            "max_story_length": 5000,
            "max_scenes_per_story": 20,
            "default_choice_count": 3
        },
        "logging": {
            "level": "INFO",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "file": "logs/verse.log",
            "max_file_size": 10485760,  # 10MB
            "backup_count": 5
        }
    }

def save_config(config: Dict[str, Any]) -> None:
    """
    Save configuration to config.yaml
    
    Args:
        config: Configuration dictionary to save
    """
    config_path = Path(__file__).parent.parent / "config.yaml"
    
    try:
        with open(config_path, 'w', encoding='utf-8') as file:
            yaml.dump(config, file, default_flow_style=False, indent=2)
    except Exception as e:
        logging.error(f"Failed to save config: {str(e)}")

def get_config_value(key: str, default: Any = None) -> Any:
    """
    Get configuration value using dot notation
    
    Args:
        key: Configuration key (e.g., 'api.host')
        default: Default value if key not found
        
    Returns:
        Configuration value or default
    """
    config = load_config()
    
    try:
        keys = key.split('.')
        value = config
        
        for k in keys:
            value = value[k]
        
        return value
    except (KeyError, TypeError):
        return default

def get_database_connection() -> sqlite3.Connection:
    """
    Get database connection with proper configuration
    
    Returns:
        sqlite3.Connection: Database connection
    """
    db_path = get_config_value("database.path", "verse.db")
    timeout = get_config_value("database.timeout", 30)
    check_same_thread = get_config_value("database.check_same_thread", False)
    
    # Ensure database file exists
    db_full_path = Path(__file__).parent.parent / db_path
    
    if not db_full_path.exists():
        # Create database if it doesn't exist
        from create_db import create_database
        create_database()
    
    # Create connection
    conn = sqlite3.connect(
        str(db_full_path),
        timeout=timeout,
        check_same_thread=check_same_thread
    )
    
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    
    # Set row factory for easier access
    conn.row_factory = sqlite3.Row
    
    return conn

def setup_logging() -> None:
    """
    Setup logging configuration
    """
    log_level = get_config_value("logging.level", "INFO")
    log_format = get_config_value("logging.format", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    log_file = get_config_value("logging.file", "logs/verse.log")
    max_file_size = get_config_value("logging.max_file_size", 10485760)
    backup_count = get_config_value("logging.backup_count", 5)
    
    # Create logs directory if it doesn't exist
    log_path = Path(__file__).parent.parent / log_file
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=[
            logging.StreamHandler(),  # Console output
            logging.handlers.RotatingFileHandler(
                log_path,
                maxBytes=max_file_size,
                backupCount=backup_count
            )
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)

def generate_unique_id(prefix: str = "") -> str:
    """
    Generate a unique identifier
    
    Args:
        prefix: Optional prefix for the ID
        
    Returns:
        str: Unique identifier
    """
    unique_id = str(uuid.uuid4()).replace('-', '')
    return f"{prefix}_{unique_id}" if prefix else unique_id

def get_current_timestamp() -> datetime:
    """
    Get current timestamp
    
    Returns:
        datetime: Current UTC timestamp
    """
    return datetime.utcnow()

def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """
    Safely load JSON string
    
    Args:
        json_str: JSON string to parse
        default: Default value if parsing fails
        
    Returns:
        Parsed JSON or default value
    """
    try:
        return json.loads(json_str) if json_str else default
    except (json.JSONDecodeError, TypeError):
        return default

def safe_json_dumps(obj: Any, default: str = "{}") -> str:
    """
    Safely dump object to JSON string
    
    Args:
        obj: Object to serialize
        default: Default JSON string if serialization fails
        
    Returns:
        JSON string or default
    """
    try:
        return json.dumps(obj, default=str)
    except (TypeError, ValueError):
        return default

def ensure_directory_exists(path: Union[str, Path]) -> Path:
    """
    Ensure directory exists, create if it doesn't
    
    Args:
        path: Directory path
        
    Returns:
        Path: Path object for the directory
    """
    path_obj = Path(path)
    path_obj.mkdir(parents=True, exist_ok=True)
    return path_obj

def get_file_size(file_path: Union[str, Path]) -> int:
    """
    Get file size in bytes
    
    Args:
        file_path: Path to file
        
    Returns:
        int: File size in bytes
    """
    try:
        return Path(file_path).stat().st_size
    except (OSError, FileNotFoundError):
        return 0

def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        str: Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix

def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human readable format
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        str: Formatted duration
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing invalid characters
    
    Args:
        filename: Original filename
        
    Returns:
        str: Sanitized filename
    """
    import re
    
    # Remove invalid characters
    sanitized = re.sub(r'[^\w\s\-_\.]', '', filename)
    
    # Replace spaces with underscores
    sanitized = re.sub(r'\s+', '_', sanitized)
    
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    
    return sanitized.strip('_')

def get_environment() -> str:
    """
    Get current environment (development, staging, production)
    
    Returns:
        str: Environment name
    """
    return os.environ.get("VERSE_ENV", "development").lower()

def is_development() -> bool:
    """
    Check if running in development environment
    
    Returns:
        bool: True if development environment
    """
    return get_environment() == "development"

def is_production() -> bool:
    """
    Check if running in production environment
    
    Returns:
        bool: True if production environment
    """
    return get_environment() == "production"

def get_app_version() -> str:
    """
    Get application version
    
    Returns:
        str: Application version
    """
    return get_config_value("app.version", "1.0.0")

def create_response_metadata(
    page: int = 1,
    limit: int = 10,
    total: int = 0,
    has_next: bool = False,
    has_prev: bool = False
) -> Dict[str, Any]:
    """
    Create pagination metadata for API responses
    
    Args:
        page: Current page number
        limit: Items per page
        total: Total number of items
        has_next: Whether there's a next page
        has_prev: Whether there's a previous page
        
    Returns:
        Dict containing pagination metadata
    """
    total_pages = (total + limit - 1) // limit if total > 0 else 0
    
    return {
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        },
        "timestamp": get_current_timestamp().isoformat()
    }
