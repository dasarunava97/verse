"""
API module for VERSE - Virtual Experience Reactive Story Engine
"""

from .auth import auth_router
from .stories import stories_router
from .characters import characters_router
from .choices import choices_router
from .progress import progress_router
from .generate import generate_router

__all__ = [
    "auth_router",
    "stories_router", 
    "characters_router",
    "choices_router",
    "progress_router",
    "generate_router"
]