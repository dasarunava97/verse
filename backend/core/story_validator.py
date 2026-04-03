"""
Content validation for VERSE platform
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

from utils.validators import (
    validate_story_content as validate_story_text,
    validate_choice_text,
    validate_username,
    ValidationError
)
from utils.text_processing import (
    clean_text,
    count_words,
    extract_keywords,
    validate_story_content as analyze_story_content,
    extract_dialogue
)
from utils.helpers import get_config_value, safe_json_loads

# Response models
class ValidationResult(BaseModel):
    """Result of content validation"""
    is_valid: bool = Field(..., description="Whether content passes validation")
    errors: List[str] = Field(default=[], description="List of validation errors")
    warnings: List[str] = Field(default=[], description="List of validation warnings")
    content_analysis: Dict[str, Any] = Field(default={}, description="Analysis of content")
    suggestions: List[str] = Field(default=[], description="Suggestions for improvement")

# Exception classes
class ContentValidationError(Exception):
    """Exception raised for content validation failures"""
    pass

class StoryValidator:
    """Main content validator for VERSE platform"""
    
    def __init__(self):
        """Initialize story validator with configuration"""
        self.max_story_length = get_config_value("story.max_story_length", 5000)
        self.max_choices_per_node = get_config_value("story.max_choices_per_node", 4)
        self.supported_genres = get_config_value("story.supported_genres", [])
        self.inappropriate_patterns = self._load_inappropriate_patterns()
        self.required_story_elements = ["character", "setting", "conflict"]
    
    def _load_inappropriate_patterns(self) -> List[str]:
        """
        Load patterns for inappropriate content detection
        
        Returns:
            List[str]: Regex patterns for inappropriate content
        """
        return [
            r'\b(?:hate|violence|explicit|graphic)\b',
            r'\b(?:kill|murder|death|blood)\b',
            r'\b(?:sex|sexual|explicit|adult)\b',
            # Add more patterns as needed for content filtering
        ]
    
    def validate_story_content(self, content: str, genre: str = None, 
                             target_audience: str = "adult") -> ValidationResult:
        """
        Validate story content for appropriateness and quality
        
        Args:
            content: Story content to validate
            genre: Story genre (optional)
            target_audience: Target audience for content filtering
            
        Returns:
            ValidationResult: Validation results and analysis
        """
        errors = []
        warnings = []
        suggestions = []
        
        # Basic content validation
        if not content or not content.strip():
            errors.append("Story content cannot be empty")
            return ValidationResult(
                is_valid=False,
                errors=errors,
                content_analysis={"word_count": 0, "character_count": 0}
            )
        
        # Clean and analyze content
        cleaned_content = clean_text(content)
        content_analysis = analyze_story_content(cleaned_content)
        
        # Check basic validation from utils
        if not content_analysis["is_valid"]:
            errors.extend(content_analysis["errors"])
        
        # Length validation
        word_count = content_analysis["word_count"]
        if word_count < 50:
            errors.append("Story content too short (minimum 50 words)")
        elif word_count > self.max_story_length:
            errors.append(f"Story content too long (maximum {self.max_story_length} words)")
        
        # Genre validation
        if genre and genre not in self.supported_genres:
            errors.append(f"Unsupported genre '{genre}'. Supported: {', '.join(self.supported_genres)}")
        
        # Content appropriateness check
        inappropriate_issues = self._check_inappropriate_content(cleaned_content, target_audience)
        if inappropriate_issues:
            errors.extend(inappropriate_issues)
        
        # Story structure validation
        structure_issues = self._validate_story_structure(cleaned_content)
        if structure_issues:
            warnings.extend(structure_issues)
        
        # Character consistency check
        character_issues = self._validate_character_consistency(cleaned_content)
        if character_issues:
            warnings.extend(character_issues)
        
        # Generate suggestions
        suggestions = self._generate_content_suggestions(cleaned_content, content_analysis)
        
        # Enhanced content analysis
        enhanced_analysis = {
            **content_analysis,
            "readability_score": self._calculate_readability(cleaned_content),
            "dialogue_percentage": self._calculate_dialogue_percentage(cleaned_content),
            "story_elements": self._identify_story_elements(cleaned_content),
            "character_mentions": self._extract_character_mentions(cleaned_content),
            "setting_descriptions": self._extract_setting_descriptions(cleaned_content)
        }
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            content_analysis=enhanced_analysis,
            suggestions=suggestions
        )
    
    def validate_character_content(self, character_data: Dict[str, Any]) -> ValidationResult:
        """
        Validate character creation/update data
        
        Args:
            character_data: Character information to validate
            
        Returns:
            ValidationResult: Validation results
        """
        errors = []
        warnings = []
        suggestions = []
        
        # Required fields validation
        required_fields = ["name", "personality_profile", "background_story"]
        for field in required_fields:
            if field not in character_data or not character_data[field]:
                errors.append(f"Character {field} is required")
        
        # Name validation
        if "name" in character_data:
            name_validation = validate_username(character_data["name"])
            if not name_validation["is_valid"]:
                errors.extend([f"Character name: {error}" for error in name_validation["errors"]])
        
        # Background story validation
        if "background_story" in character_data:
            background = character_data["background_story"]
            if isinstance(background, str):
                background_validation = validate_story_text(background)
                if not background_validation["is_valid"]:
                    warnings.extend([f"Background story: {error}" for error in background_validation["errors"]])
        
        # Personality consistency check
        if "personality_profile" in character_data:
            personality_issues = self._validate_personality_consistency(character_data["personality_profile"])
            if personality_issues:
                warnings.extend(personality_issues)
        
        # Character development suggestions
        suggestions = self._generate_character_suggestions(character_data)
        
        # Analysis
        analysis = {
            "character_complexity": self._assess_character_complexity(character_data),
            "background_depth": self._assess_background_depth(character_data.get("background_story", "")),
            "personality_balance": self._assess_personality_balance(character_data.get("personality_profile", {}))
        }
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            content_analysis=analysis,
            suggestions=suggestions
        )
    
    def validate_choice_content(self, choices: List[Dict[str, Any]], 
                              story_context: str = "") -> ValidationResult:
        """
        Validate story choice options
        
        Args:
            choices: List of choice options to validate
            story_context: Current story context for relevance checking
            
        Returns:
            ValidationResult: Validation results
        """
        errors = []
        warnings = []
        suggestions = []
        
        # Basic validation
        if not choices:
            errors.append("At least one choice option is required")
            return ValidationResult(is_valid=False, errors=errors)
        
        if len(choices) > self.max_choices_per_node:
            errors.append(f"Too many choices (maximum {self.max_choices_per_node})")
        
        # Validate each choice
        for i, choice in enumerate(choices):
            choice_errors = self._validate_single_choice(choice, i)
            errors.extend(choice_errors)
        
        # Check choice diversity
        diversity_issues = self._validate_choice_diversity(choices)
        if diversity_issues:
            warnings.extend(diversity_issues)
        
        # Check relevance to story context
        if story_context:
            relevance_issues = self._validate_choice_relevance(choices, story_context)
            if relevance_issues:
                warnings.extend(relevance_issues)
        
        # Generate suggestions
        suggestions = self._generate_choice_suggestions(choices, story_context)
        
        # Analysis
        analysis = {
            "choice_count": len(choices),
            "average_choice_length": sum(len(c.get("text", "")) for c in choices) / len(choices),
            "choice_complexity": self._assess_choice_complexity(choices),
            "consequence_clarity": self._assess_consequence_clarity(choices)
        }
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            content_analysis=analysis,
            suggestions=suggestions
        )
    
    def validate_dialogue_content(self, dialogue_data: Dict[str, Any], 
                                character_context: Dict[str, Any] = None) -> ValidationResult:
        """
        Validate dialogue content for character consistency
        
        Args:
            dialogue_data: Dialogue information to validate
            character_context: Character information for consistency checking
            
        Returns:
            ValidationResult: Validation results
        """
        errors = []
        warnings = []
        suggestions = []
        
        # Required fields
        required_fields = ["dialogue_text", "speaker_character"]
        for field in required_fields:
            if field not in dialogue_data or not dialogue_data[field]:
                errors.append(f"Dialogue {field} is required")
        
        # Dialogue text validation
        if "dialogue_text" in dialogue_data:
            dialogue_text = dialogue_data["dialogue_text"]
            
            # Length check
            if len(dialogue_text) < 5:
                errors.append("Dialogue too short")
            elif len(dialogue_text) > 500:
                warnings.append("Dialogue very long, consider breaking up")
            
            # Appropriateness check
            inappropriate_issues = self._check_inappropriate_content(dialogue_text, "adult")
            if inappropriate_issues:
                errors.extend([f"Dialogue: {issue}" for issue in inappropriate_issues])
        
        # Character consistency check
        if character_context and "speaker_character" in dialogue_data:
            consistency_issues = self._validate_dialogue_character_consistency(
                dialogue_data, character_context
            )
            if consistency_issues:
                warnings.extend(consistency_issues)
        
        # Generate suggestions
        suggestions = self._generate_dialogue_suggestions(dialogue_data, character_context)
        
        # Analysis
        analysis = {
            "dialogue_length": len(dialogue_data.get("dialogue_text", "")),
            "emotional_tone": self._analyze_dialogue_tone(dialogue_data.get("dialogue_text", "")),
            "character_voice_strength": self._assess_character_voice(dialogue_data, character_context)
        }
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            content_analysis=analysis,
            suggestions=suggestions
        )
    
    # Private helper methods
    def _check_inappropriate_content(self, content: str, target_audience: str) -> List[str]:
        """Check for inappropriate content based on target audience"""
        issues = []
        
        content_lower = content.lower()
        
        for pattern in self.inappropriate_patterns:
            if re.search(pattern, content_lower):
                issues.append(f"Content may contain inappropriate material for {target_audience} audience")
                break
        
        return issues
    
    def _validate_story_structure(self, content: str) -> List[str]:
        """Validate basic story structure elements"""
        warnings = []
        
        # Check for basic story elements
        has_character = bool(re.search(r'\b(?:he|she|they|character|protagonist)\b', content, re.IGNORECASE))
        has_setting = bool(re.search(r'\b(?:in|at|on|place|location|room|house|city)\b', content, re.IGNORECASE))
        has_action = bool(re.search(r'\b(?:walked|ran|said|looked|went|came|did)\b', content, re.IGNORECASE))
        
        if not has_character:
            warnings.append("Story lacks clear character references")
        if not has_setting:
            warnings.append("Story lacks clear setting descriptions")
        if not has_action:
            warnings.append("Story lacks action or movement")
        
        return warnings
    
    def _validate_character_consistency(self, content: str) -> List[str]:
        """Check for character consistency issues"""
        warnings = []
        
        # Check for pronoun consistency
        if "he" in content.lower() and "she" in content.lower():
            warnings.append("Mixed pronouns detected - ensure character consistency")
        
        return warnings
    
    def _generate_content_suggestions(self, content: str, analysis: Dict[str, Any]) -> List[str]:
        """Generate suggestions for improving content"""
        suggestions = []
        
        word_count = analysis.get("word_count", 0)
        
        if word_count < 100:
            suggestions.append("Consider adding more descriptive details to enhance the scene")
        
        if not extract_dialogue(content):
            suggestions.append("Consider adding dialogue to make the story more engaging")
        
        keywords = analysis.get("keywords", [])
        if len(keywords) < 3:
            suggestions.append("Add more specific details to make the story more vivid")
        
        return suggestions
    
    def _calculate_readability(self, content: str) -> str:
        """Calculate basic readability assessment"""
        word_count = count_words(content)
        avg_word_length = sum(len(word) for word in content.split()) / max(word_count, 1)
        
        if avg_word_length < 4:
            return "Easy"
        elif avg_word_length < 6:
            return "Medium"
        else:
            return "Advanced"
    
    def _calculate_dialogue_percentage(self, content: str) -> float:
        """Calculate percentage of content that is dialogue"""
        dialogue_lines = extract_dialogue(content)
        dialogue_words = sum(count_words(line) for line in dialogue_lines)
        total_words = count_words(content)
        
        return (dialogue_words / max(total_words, 1)) * 100
    
    def _identify_story_elements(self, content: str) -> List[str]:
        """Identify story elements present in content"""
        elements = []
        
        if re.search(r'\b(?:character|protagonist|hero|villain)\b', content, re.IGNORECASE):
            elements.append("character")
        if re.search(r'\b(?:setting|place|location|scene)\b', content, re.IGNORECASE):
            elements.append("setting")
        if re.search(r'\b(?:conflict|problem|challenge|obstacle)\b', content, re.IGNORECASE):
            elements.append("conflict")
        if re.search(r'"[^"]*"', content):
            elements.append("dialogue")
        
        return elements
    
    def _extract_character_mentions(self, content: str) -> List[str]:
        """Extract character names and references"""
        # Simple implementation - look for capitalized words that could be names
        potential_names = re.findall(r'\b[A-Z][a-z]+\b', content)
        
        # Filter out common words that aren't likely names
        common_words = {"The", "And", "But", "This", "That", "When", "Where", "How", "Why"}
        names = [name for name in potential_names if name not in common_words]
        
        return list(set(names))
    
    def _extract_setting_descriptions(self, content: str) -> List[str]:
        """Extract setting and location descriptions"""
        # Look for location-indicating phrases
        location_patterns = [
            r'in the \w+',
            r'at the \w+', 
            r'on the \w+',
            r'inside \w+',
            r'outside \w+'
        ]
        
        descriptions = []
        for pattern in location_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            descriptions.extend(matches)
        
        return list(set(descriptions))
    
    def _validate_single_choice(self, choice: Dict[str, Any], index: int) -> List[str]:
        """Validate a single choice option"""
        errors = []
        
        if "text" not in choice or not choice["text"]:
            errors.append(f"Choice {index + 1} is missing text")
            return errors
        
        choice_validation = validate_choice_text(choice["text"])
        if not choice_validation["is_valid"]:
            errors.extend([f"Choice {index + 1}: {error}" for error in choice_validation["errors"]])
        
        return errors
    
    def _validate_choice_diversity(self, choices: List[Dict[str, Any]]) -> List[str]:
        """Check if choices offer meaningful diversity"""
        warnings = []
        
        choice_texts = [choice.get("text", "") for choice in choices]
        
        # Check for very similar choices
        for i, text1 in enumerate(choice_texts):
            for j, text2 in enumerate(choice_texts[i+1:], i+1):
                if self._calculate_text_similarity(text1, text2) > 0.8:
                    warnings.append(f"Choices {i+1} and {j+1} are very similar")
        
        return warnings
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity between two strings"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def _validate_choice_relevance(self, choices: List[Dict[str, Any]], story_context: str) -> List[str]:
        """Check if choices are relevant to story context"""
        warnings = []
        # Implementation for context relevance checking
        # This is a placeholder for more sophisticated analysis
        return warnings
    
    def _generate_choice_suggestions(self, choices: List[Dict[str, Any]], story_context: str) -> List[str]:
        """Generate suggestions for improving choices"""
        suggestions = []
        
        if len(choices) < 3:
            suggestions.append("Consider adding more choice options for greater player agency")
        
        return suggestions
    
    def _assess_choice_complexity(self, choices: List[Dict[str, Any]]) -> str:
        """Assess the complexity level of choices"""
        avg_length = sum(len(choice.get("text", "")) for choice in choices) / len(choices)
        
        if avg_length < 30:
            return "Simple"
        elif avg_length < 60:
            return "Medium"
        else:
            return "Complex"
    
    def _assess_consequence_clarity(self, choices: List[Dict[str, Any]]) -> str:
        """Assess how clear the consequences of choices are"""
        # Placeholder implementation
        return "Medium"
    
    def _validate_personality_consistency(self, personality: Dict[str, Any]) -> List[str]:
        """Validate personality traits for consistency"""
        warnings = []
        # Implementation for personality consistency checking
        return warnings
    
    def _generate_character_suggestions(self, character_data: Dict[str, Any]) -> List[str]:
        """Generate suggestions for character improvement"""
        suggestions = []
        
        if not character_data.get("fears_and_flaws"):
            suggestions.append("Consider adding character flaws and fears for more depth")
        
        return suggestions
    
    def _assess_character_complexity(self, character_data: Dict[str, Any]) -> str:
        """Assess character complexity level"""
        complexity_factors = 0
        
        if character_data.get("background_story"):
            complexity_factors += 1
        if character_data.get("personality_profile"):
            complexity_factors += 1
        if character_data.get("fears_and_flaws"):
            complexity_factors += 1
        if character_data.get("relationships"):
            complexity_factors += 1
        
        if complexity_factors >= 3:
            return "High"
        elif complexity_factors >= 2:
            return "Medium"
        else:
            return "Low"
    
    def _assess_background_depth(self, background: str) -> str:
        """Assess the depth of character background"""
        word_count = count_words(background) if background else 0
        
        if word_count >= 100:
            return "Deep"
        elif word_count >= 50:
            return "Medium"
        else:
            return "Shallow"
    
    def _assess_personality_balance(self, personality: Dict[str, Any]) -> str:
        """Assess balance of personality traits"""
        # Placeholder implementation
        return "Balanced"
    
    def _validate_dialogue_character_consistency(self, dialogue_data: Dict[str, Any], 
                                               character_context: Dict[str, Any]) -> List[str]:
        """Check dialogue consistency with character"""
        warnings = []
        # Implementation for dialogue-character consistency checking
        return warnings
    
    def _generate_dialogue_suggestions(self, dialogue_data: Dict[str, Any], 
                                     character_context: Dict[str, Any]) -> List[str]:
        """Generate suggestions for dialogue improvement"""
        suggestions = []
        
        if not dialogue_data.get("emotional_undertone"):
            suggestions.append("Consider adding emotional undertone to make dialogue more engaging")
        
        return suggestions
    
    def _analyze_dialogue_tone(self, dialogue_text: str) -> str:
        """Analyze the emotional tone of dialogue"""
        # Simple tone analysis based on keywords
        positive_words = ["happy", "excited", "pleased", "wonderful", "great"]
        negative_words = ["sad", "angry", "frustrated", "terrible", "awful"]
        
        text_lower = dialogue_text.lower()
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "Positive"
        elif negative_count > positive_count:
            return "Negative"
        else:
            return "Neutral"
    
    def _assess_character_voice(self, dialogue_data: Dict[str, Any], 
                              character_context: Dict[str, Any]) -> str:
        """Assess how well dialogue matches character voice"""
        # Placeholder implementation
        return "Strong"

# Singleton instance
_story_validator_instance: Optional[StoryValidator] = None

def get_story_validator() -> StoryValidator:
    """
    Get or create story validator singleton
    
    Returns:
        StoryValidator: Configured validator instance
    """
    global _story_validator_instance
    
    if _story_validator_instance is None:
        _story_validator_instance = StoryValidator()
    
    return _story_validator_instance

def reset_story_validator():
    """Reset story validator singleton (useful for testing)"""
    global _story_validator_instance
    _story_validator_instance = None

# Convenience functions for direct use
def validate_story_content(content: str, genre: str = None, 
                         target_audience: str = "adult") -> ValidationResult:
    """Validate story content using default validator"""
    validator = get_story_validator()
    return validator.validate_story_content(content, genre, target_audience)

def validate_character_content(character_data: Dict[str, Any]) -> ValidationResult:
    """Validate character content using default validator"""
    validator = get_story_validator()
    return validator.validate_character_content(character_data)

def validate_choice_content(choices: List[Dict[str, Any]], 
                          story_context: str = "") -> ValidationResult:
    """Validate choice content using default validator"""
    validator = get_story_validator()
    return validator.validate_choice_content(choices, story_context)

def validate_dialogue_content(dialogue_data: Dict[str, Any], 
                            character_context: Dict[str, Any] = None) -> ValidationResult:
    """Validate dialogue content using default validator"""
    validator = get_story_validator()
    return validator.validate_dialogue_content(dialogue_data, character_context)
