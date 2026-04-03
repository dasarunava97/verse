"""
Utilities package for VERSE platform
"""

from .auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
    get_current_user,
    get_current_user_optional,
    create_api_key,
    verify_api_key,
    require_admin_role,
    get_user_permissions,
    has_permission
)

from .helpers import (
    load_config,
    get_config_value,
    get_database_connection,
    setup_logging,
    generate_unique_id,
    get_current_timestamp,
    safe_json_loads,
    safe_json_dumps,
    ensure_directory_exists,
    get_file_size,
    truncate_text,
    format_duration,
    sanitize_filename,
    get_environment,
    is_development,
    is_production,
    get_app_version,
    create_response_metadata
)

from .validators import (
    validate_email,
    validate_username,
    validate_password,
    validate_story_content,
    # validate_character_name,
    validate_choice_text,
    validate_genre,
    # validate_json_structure,
    # ValidationResult
)

from .text_processing import (
    clean_text,
    extract_keywords,
    count_words,
    # count_sentences,
    # analyze_sentiment,
    # detect_language,
    # summarize_text,
    # calculate_readability_score,
    # format_story_text,
    extract_dialogue,
    # remove_profanity,
    # TextAnalysisResult
)

__all__ = [
    # Auth utilities
    "hash_password",
    "verify_password", 
    "create_access_token",
    "verify_token",
    "get_current_user",
    "get_current_user_optional",
    "create_api_key",
    "verify_api_key",
    "require_admin_role",
    "get_user_permissions",
    "has_permission",
    
    # Helper utilities
    "load_config",
    "get_config_value",
    "get_database_connection",
    "setup_logging",
    "generate_unique_id",
    "get_current_timestamp",
    "safe_json_loads",
    "safe_json_dumps",
    "ensure_directory_exists",
    "get_file_size",
    "truncate_text",
    "format_duration",
    "sanitize_filename",
    "get_environment",
    "is_development",
    "is_production",
    "get_app_version",
    "create_response_metadata",
    
    # Validators
    "validate_email",
    "validate_username",
    "validate_password",
    "validate_story_content",
    "validate_character_name",
    "validate_choice_text",
    "validate_genre",
    "validate_json_structure",
    "ValidationResult",
    
    # Text processing
    "clean_text",
    "extract_keywords",
    "count_words",
    "count_sentences",
    "analyze_sentiment",
    "detect_language",
    "summarize_text",
    "calculate_readability_score",
    "format_story_text",
    "extract_dialogue",
    "remove_profanity",
    "TextAnalysisResult"
]