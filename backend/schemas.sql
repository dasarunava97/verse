-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    mood	TEXT,
	opening_scene	TEXT,
    suggested_next_scenes	TEXT,
    initial_conflict	TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Story nodes (scenes/chapters)
CREATE TABLE IF NOT EXISTS story_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    parent_node_id INTEGER NULL,
    node_type VARCHAR(20) NOT NULL, -- scene, choice, ending
    title VARCHAR(200),
    content TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories (id),
    FOREIGN KEY (parent_node_id) REFERENCES story_nodes (id)
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    personality_traits TEXT, -- JSON string for simple storage
    appearance TEXT,
    role VARCHAR(50), -- protagonist, antagonist, supporting, minor
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (story_id) REFERENCES stories (id)
);

-- Choices table
CREATE TABLE IF NOT EXISTS choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_node_id INTEGER NOT NULL,
    choice_text TEXT NOT NULL,
    choice_description TEXT,
    consequence_preview TEXT,
    next_node_id INTEGER NULL,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_node_id) REFERENCES story_nodes (id),
    FOREIGN KEY (next_node_id) REFERENCES story_nodes (id)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    story_id INTEGER NOT NULL,
    current_node_id INTEGER NOT NULL,
    choices_made TEXT, -- JSON string of choice IDs
    reading_time INTEGER DEFAULT 0, -- in minutes
    completion_percentage REAL DEFAULT 0.0,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (story_id) REFERENCES stories (id),
    FOREIGN KEY (current_node_id) REFERENCES story_nodes (id),
    UNIQUE(user_id, story_id)
);

-- Character states (for tracking character development)
CREATE TABLE IF NOT EXISTS character_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    story_node_id INTEGER NOT NULL,
    emotional_state TEXT, -- JSON string
    relationship_changes TEXT, -- JSON string
    knowledge_updates TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters (id),
    FOREIGN KEY (story_node_id) REFERENCES story_nodes (id)
);

-- Story sessions (for temporary data)
CREATE TABLE IF NOT EXISTS story_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    story_id INTEGER NOT NULL,
    session_data TEXT, -- JSON string for temporary AI context
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (story_id) REFERENCES stories (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_story_nodes_story_id ON story_nodes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_nodes_parent_id ON story_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_characters_story_id ON characters(story_id);
CREATE INDEX IF NOT EXISTS idx_choices_story_node_id ON choices(story_node_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_story ON user_progress(user_id, story_id);
CREATE INDEX IF NOT EXISTS idx_character_states_character_id ON character_states(character_id);
CREATE INDEX IF NOT EXISTS idx_story_sessions_user_id ON story_sessions(user_id);