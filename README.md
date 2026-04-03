# VERSE - Virtual Experience Reactive Story Engine


**VERSE** is an AI-powered interactive storytelling platform that creates dynamic, branching narratives with character development, plot consistency, and meaningful user choice integration. Built with React frontend and Python FastAPI backend.

## 🌟 Features

### Core Capabilities
- **AI-Generated Stories**: Dynamic story creation using advanced language models
- **Interactive Branching**: Meaningful choices that affect story progression
- **Character Development**: Consistent character evolution and relationship tracking
- **Multiple Genres**: Fantasy, Sci-Fi, Mystery, Romance, Adventure, Horror
- **User Progress Tracking**: Save and resume stories across sessions
- **Real-time Generation**: On-demand content creation based on user decisions

### MVP Features (Version 1.0)
- ✅ Basic story generation with AI
- ✅ Simple binary choice system (A or B decisions)
- ✅ User authentication and profile management
- ✅ 3-5 predefined story templates
- ✅ Basic character creation and tracking
- ✅ Story progress saving and loading
- ✅ Clean, responsive UI for story reading

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│
│   (Port 3000)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       │        │        │
              ┌─────────────┐   │   ┌─────────────┐
              │  SQLite DB  │   │   │ OpenAI API  │
              │  (Local)    │   │   │ (External)  │
              └─────────────┘   │   └─────────────┘
                                │
                       ┌─────────────┐
                       │   Config    │
                       │ (YAML-based)│
                       └─────────────┘
```

## 📁 Project Structure

```
Story Teller - Hackathon/

frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Basic shared components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loading.jsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   └── story/           # Story-specific components
│   │       ├── StoryCard.jsx
│   │       ├── ChoiceButton.jsx
│   │       └── SceneDisplay.jsx
│   ├── pages/               # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── StoryCreate.jsx
│   │   └── StoryPlay.jsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── useStory.js
│   ├── services/            # API service functions
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── stories.js
│   ├── styles/              # CSS and styling
│   │   ├── globals.css
│   │   ├── theme.css
│   │   └── components.css
│   ├── utils/               # Utility functions
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx              # Main app component
│   └── index.js             # Entry point
├── package.json
├── package-lock.json
└── README.md
│
├── backend/                    # Python FastAPI Application
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── stories.py    # Story CRUD operations
│   │   │   ├── characters.py # Character management
│   │   │   ├── choices.py    # Choice handling
│   │   │   ├── progress.py   # User progress tracking
│   │   │   └── generate.py   # AI generation endpoints
│   │   │
│   │   ├── core/             # Core AI logic
│   │   │   ├── story_generator.py    # Main story generation
│   │   │   ├── character_manager.py  # Character consistency
│   │   │   ├── choice_processor.py   # Choice consequences
│   │   │   ├── ai_client.py         # AI API integration
│   │   │   └── story_validator.py    # Content validation
│   │   │
│   │   ├── prompts/          # AI prompt templates
│   │   │   ├── story_generation.py
│   │   │   ├── character_creation.py
│   │   │   ├── choice_generation.py
│   │   │   └── dialogue_generation.py
│   │   │
│   │   ├── utils/            # Utility functions
│   │   │   ├── auth_utils.py     # Authentication utilities
│   │   │   ├── text_processing.py # Text processing
│   │   │   ├── validators.py     # Input validation
│   │   │   └── helpers.py        # General helpers
│   │   │
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Configuration loader
│   │   ├── database.py       # Database operations
│   │   ├── models.py         # Data models/schemas
│   │   └── dependencies.py   # FastAPI dependencies
│   │
│   ├── config.yaml           # Application configuration
│   ├── requirements.txt      # Python dependencies
│   ├── create_db.py         # Database setup script
│   ├── run.py               # Application runner
│   └── database.db          # SQLite database (auto-created)
│
├── docs/                     # Documentation
├── .gitignore
├── .env.example             # Environment variables template
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.13.5+
- **OpenAI API Key** (for AI story generation)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Story Teller - Hackathon/backend"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file or set environment variable
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

5. **Initialize database**
   ```bash
   python create_db.py
   ```

6. **Update configuration**
   ```bash
   # Edit config.yaml and add your secret key
   nano config.yaml
   ```

7. **Run the backend server**
   ```bash
   python run.py
   # or
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   Backend will be available at: `http://127.0.0.1:8000`
   API Documentation: `http://127.0.0.1:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd "../frontend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env.local file
   echo "REACT_APP_API_URL=http://127.0.0.1:8000" > .env.local
   ```

4. **Start development server**
   ```bash
   npm start
   ```

   Frontend will be available at: `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration (`config.yaml`)

```yaml
app:
  name: "VERSE - Virtual Experience Reactive Story Engine"
  version: "1.0.0"
  debug: true
  host: "127.0.0.1"
  port: 8000

database:
  url: "sqlite:///./database.db"

security:
  secret_key: "your-secret-key-here"
  access_token_expire_minutes: 3600

ai:
  api_key: "${OPENAI_API_KEY}"
  model: "gpt-3.5-turbo"
  temperature: 0.1
  max_tokens: 1000

story:
  max_story_length: 5000
  max_choices_per_node: 4
  supported_genres:
    - "fantasy"
    - "sci-fi"
    - "mystery"
    - "romance"
    - "adventure"
    - "horror"
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
DATABASE_URL=sqlite:///./database.db
SECRET_KEY=your_jwt_secret_key_here
DEBUG=true
```

## 📊 Database Schema

### Core Tables
- **users** - User authentication and profiles
- **stories** - Story metadata and settings
- **story_nodes** - Individual story scenes/chapters
- **characters** - Character definitions and traits
- **choices** - Available choices at decision points
- **user_progress** - User's story progression tracking
- **character_states** - Character development over time
- **story_sessions** - Temporary AI context storage

### Key Relationships
```sql
users (1) ──→ (∞) stories
stories (1) ──→ (∞) story_nodes
stories (1) ──→ (∞) characters
story_nodes (1) ──→ (∞) choices
users + stories ──→ user_progress
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Stories
- `GET /api/stories/` - List user's stories
- `POST /api/stories/` - Create new story
- `GET /api/stories/{story_id}` - Get story details
- `PUT /api/stories/{story_id}` - Update story
- `DELETE /api/stories/{story_id}` - Delete story

### Story Generation
- `POST /api/generate/story` - Generate story content
- `POST /api/generate/choices` - Generate choice options
- `POST /api/generate/character` - Generate character details

### Progress
- `GET /api/progress/{story_id}` - Get user progress
- `POST /api/progress/{story_id}` - Save progress
- `POST /api/choices/{choice_id}/select` - Make story choice

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Development
- Backend: `uvicorn app.main:app --reload`
- Frontend: `npm start`

### Production
```bash
# Backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend
npm run build
# Serve build/ directory with nginx or Apache
```

## 🛣️ Roadmap

### Version 1.0 (Current MVP) ✅
- Basic story generation and choice system
- User authentication and progress tracking
- Simple character management
- Core API endpoints

### Version 2.0 (Planned)
- 🔄 Advanced character development and relationships
- 🌍 Rich world-building capabilities
- 🎨 Visual character and scene representations
- 📱 Mobile application (React Native)

### Version 3.0 (Future)
- 👥 Collaborative storytelling features
- 🗣️ Voice narration generation
- 🎨 AI-generated scene artwork
- 🌐 Multilingual story support
- 📊 Advanced analytics and recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Write tests for new features
- Update documentation for API changes
- Use conventional commits format

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (requires 3.13.5+)
- Verify OpenAI API key is set
- Ensure all dependencies are installed
- Check database.db file permissions

**Frontend build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)
- Verify API_URL in environment variables

**AI generation not working:**
- Verify OpenAI API key is valid and has credits
- Check rate limiting in config.yaml
- Review API logs for error messages

**Database errors:**
- Delete database.db and run `python create_db.py`
- Check SQLite installation
- Verify file permissions in project directory

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT API that powers story generation
- **FastAPI** for the excellent async Python framework
- **React** for the frontend framework
- **LangChain** for LLM integration utilities
- **SQLite** for the lightweight database solution

## 📞 Support

For support and questions:
- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 📖 Documentation: [Project Wiki](link-to-wiki)

---

**Built with ❤️ for interactive storytelling enthusiasts**

*VERSE - Where every choice writes a new story*