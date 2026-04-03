"""
Text processing utilities for VERSE platform
"""

import re
import html
from typing import List, Optional, Dict
import unicodedata


def clean_text(text: str) -> str:
    """
    Clean and normalize text content
    
    Args:
        text: Raw text to clean
        
    Returns:
        str: Cleaned text
    """
    if not text:
        return ""
    
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Normalize unicode characters
    text = unicodedata.normalize('NFKC', text)
    
    # Remove or replace problematic characters
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    return text

def sanitize_user_input(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize user input to prevent XSS and other issues
    
    Args:
        text: User input text
        max_length: Maximum allowed length
        
    Returns:
        str: Sanitized text
    """
    if not text:
        return ""
    
    # HTML escape
    text = html.escape(text)
    
    # Clean the text
    text = clean_text(text)
    
    # Truncate if needed
    if max_length and len(text) > max_length:
        text = text[:max_length].rstrip()
    
    return text

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """
    Extract keywords from text (simple implementation)
    
    Args:
        text: Text to extract keywords from
        max_keywords: Maximum number of keywords to return
        
    Returns:
        List[str]: List of keywords
    """
    if not text:
        return []
    
    # Convert to lowercase and split into words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Common stop words to filter out
    stop_words = {
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'can', 'this', 'that', 'these', 'those', 'you', 'your', 'him', 'her',
        'his', 'she', 'they', 'them', 'their', 'what', 'when', 'where', 'why',
        'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
        'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very'
    }
    
    # Filter out stop words and get word frequency
    word_freq = {}
    for word in words:
        if word not in stop_words and len(word) > 2:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency and return top keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_words[:max_keywords]]

def count_words(text: str) -> int:
    """
    Count words in text
    
    Args:
        text: Text to count words in
        
    Returns:
        int: Number of words
    """
    if not text:
        return 0
    
    # Split by whitespace and count non-empty strings
    words = [word for word in text.split() if word.strip()]
    return len(words)

def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text to a maximum length
    
    Args:
        text: Text to truncate
        max_length: Maximum length including suffix
        suffix: Suffix to add when truncating
        
    Returns:
        str: Truncated text
    """
    if not text or len(text) <= max_length:
        return text
    
    # Account for suffix length
    truncate_at = max_length - len(suffix)
    if truncate_at <= 0:
        return suffix[:max_length]
    
    # Try to truncate at word boundary
    truncated = text[:truncate_at].rstrip()
    if ' ' in truncated:
        last_space = truncated.rfind(' ')
        truncated = truncated[:last_space]
    
    return truncated + suffix

def format_story_content(content: str) -> str:
    """
    Format story content for display
    
    Args:
        content: Raw story content
        
    Returns:
        str: Formatted content
    """
    if not content:
        return ""
    
    # Clean the content
    content = clean_text(content)
    
    # Add proper paragraph breaks
    paragraphs = content.split('\n')
    formatted_paragraphs = []
    
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if paragraph:
            formatted_paragraphs.append(paragraph)
    
    return '\n\n'.join(formatted_paragraphs)

def validate_story_content(content: str) -> Dict[str, any]:
    """
    Validate and analyze story content
    
    Args:
        content: Story content to validate
        
    Returns:
        Dict: Validation results and statistics
    """
    if not content:
        return {
            "is_valid": False,
            "errors": ["Content cannot be empty"],
            "word_count": 0,
            "character_count": 0
        }
    
    errors = []
    
    # Check minimum length
    word_count = count_words(content)
    if word_count < 10:
        errors.append("Story content too short (minimum 10 words)")
    
    # Check maximum length
    if word_count > 5000:
        errors.append("Story content too long (maximum 5000 words)")
    
    # Check for inappropriate content patterns (basic)
    inappropriate_patterns = [
        r'\b(?:hate|violence|explicit)\b',  # Basic content filtering
    ]
    
    for pattern in inappropriate_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            errors.append("Content may contain inappropriate material")
            break
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "word_count": word_count,
        "character_count": len(content),
        "keywords": extract_keywords(content, 5)
    }

def extract_dialogue(text: str) -> List[str]:
    """
    Extract dialogue from story text
    
    Args:
        text: Story text
        
    Returns:
        List[str]: List of dialogue lines
    """
    if not text:
        return []
    
    # Simple pattern to match quoted dialogue
    dialogue_pattern = r'"([^"]*)"'
    matches = re.findall(dialogue_pattern, text)
    
    return [match.strip() for match in matches if match.strip()]

def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """
    Calculate estimated reading time for text
    
    Args:
        text: Text to analyze
        words_per_minute: Average reading speed
        
    Returns:
        int: Estimated reading time in minutes
    """
    if not text:
        return 0
    
    word_count = count_words(text)
    reading_time = max(1, round(word_count / words_per_minute))
    
    return reading_time
