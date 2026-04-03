# VERSE Installation Guide

**Comprehensive setup instructions for VERSE - Virtual Experience Reactive Story Engine on Linux (Ubuntu/Debian)**

## 📋 Prerequisites

Before starting the installation, ensure your system meets these requirements:

- **Operating System**: Ubuntu 20.04+ / Debian 11+ / Pop!_OS / Linux Mint
- **Internet Connection**: Required for downloading packages and dependencies
- **Administrative Access**: sudo privileges for system-wide installations
- **Storage Space**: ~2GB free space for all dependencies

---

## 🐧 System Preparation

## 🐍 Python 3.13.5 Installation (Can be ignored if done already)

### Option A: Install from Source (Recommended for exact version)

```bash
# Download Python 3.13.5 source code
cd /tmp
wget https://www.python.org/ftp/python/3.13.5/Python-3.13.5.tar.xz
tar -xf Python-3.13.5.tar.xz
cd Python-3.13.5

# Configure and compile Python
./configure --enable-optimizations --with-ensurepip=install
make -j $(nproc)
sudo make altinstall

# Verify installation
python3.13 --version
# Expected output: Python 3.13.5
```

## 📦 Node.js 22.19.0 Installation

### Method 1: Using NodeSource Repository (Recommended)

```bash
# Download and install NodeSource GPG key
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Add NodeSource repository for Node.js 22.x
NODE_MAJOR=22
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Update package list and install Node.js
sudo apt update
sudo apt install -y nodejs

# Verify installation
node --version
# Expected output: v22.19.0 (or v22.x.x)
npm --version
```

## 🎨 Font Installation for Emoji Support

### Install Emoji Fonts

```bash
# Install comprehensive emoji font support
sudo apt install -y \
    fonts-noto-color-emoji \
    fonts-symbola \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf

# Install additional Unicode fonts
sudo apt install -y \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-noto-extra

# Clear and rebuild font cache
sudo fc-cache -fv
fc-cache -fv
```

## 📁 Project Setup

### 2. Project Structure Verification

```bash
# Verify project structure
ls -la
# You should see: backend/ frontend/ README.md

# Check backend structure
ls -la backend/
# You should see: api/ core/ prompts/ utils/ config.yaml requirements.txt run.py

# Check frontend structure
ls -la frontend/
# You should see: src/ public/ package.json
```

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
pwd
# Should show: /home/username/VERSE-Project/backend
```

### 2. Create Python Virtual Environment

```bash
# Create virtual environment using Python 3.13
python3.13 -m venv venv

# Alternative if python3.13 is your default python3
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify virtual environment
which python
# Should show: /home/username/VERSE-Project/backend/venv/bin/python

python --version
# Should show: Python 3.13.5
```

### 3. Upgrade pip and Install Dependencies

```bash
# Upgrade pip to latest version
python -m pip install --upgrade pip

# Install wheel for better package compilation
pip install wheel

# Install all backend dependencies
pip install -r requirements.txt

# Verify key packages are installed
pip list | grep fastapi
pip list | grep uvicorn
```

### 5. Configure Application Settings (Can be ignored)

```bash
# Backup original config
cp config.yaml config.yaml.backup

# Update config.yaml with your settings
cat > config.yaml << 'EOF'
app:
  name: "VERSE - Virtual Experience Reactive Story Engine"
  version: "1.0.0"
  debug: true
  host: "127.0.0.1"
  port: 8000

database:
  url: "sqlite:///./verse.db"

security:
  secret_key: "${SECRET_KEY}"
  access_token_expire_minutes: 3600

ai:
  api_key: "${OPENAI_API_KEY}"
  model: "gpt-3.5-turbo"
  temperature: 0.7
  max_tokens: 1500

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

cors:
  origins:
    - "http://localhost:3000"
    - "http://127.0.0.1:3000"
EOF
```

### 6. Initialize Database

```bash
# Create database and tables
python create_db.py

# Verify database creation
ls -la verse.db
# Should show: verse.db file with recent timestamp

# Check database schema (optional)
sqlite3 verse.db ".schema"
```

### 7. Test Backend Installation

```bash
# Test backend server startup
python run.py &
BACKEND_PID=$!

# Wait for server to start
sleep 5

# Test API endpoint
curl http://127.0.0.1:8000/health
# Expected: {"status": "healthy"}

# Test API documentation access
curl -s http://127.0.0.1:8000/docs | grep -q "FastAPI" && echo "✅ API docs accessible" || echo "❌ API docs failed"

# Stop test server
kill $BACKEND_PID

echo "✅ Backend setup completed successfully!"
```

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../frontend
pwd
# Should show: /home/username/VERSE-Project/frontend
```

### 2. Install Frontend Dependencies

```bash
# Clear npm cache (preventive measure)
npm cache clean --force

# Install all frontend dependencies
npm install

# Alternative if you encounter permission issues
npm install --no-optional

# Verify installation
npm list --depth=0
```

## 🚀 Running the Application

### 1. Start Backend Server

```bash
# Navigate to backend directory
cd ~/VERSE-Project/backend

# Activate virtual environment
source venv/bin/activate

# Start backend server
python run.py

# Backend will be available at:
# - API: http://127.0.0.1:8000
# - Documentation: http://127.0.0.1:8000/docs
# - Interactive API: http://127.0.0.1:8000/redoc
```

### 2. Start Frontend Server (New Terminal)

```bash
# Open new terminal and navigate to frontend
cd ~/VERSE-Project/frontend

# Start development server
npm start

# Frontend will be available at:
# - Application: http://localhost:3000
```

### 3. Application Access Points

Once both servers are running:

- **Main Application**: http://localhost:3000
- **API Endpoint**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **API Interactive Docs**: http://127.0.0.1:8000/redoc

---

## 🎯 Next Steps

After successful installation:

1. **Set up OpenAI API Key**: Edit `backend/.env` with your actual API key
2. **Create your first story**: Access http://localhost:3000 and register
3. **Explore API documentation**: Visit http://127.0.0.1:8000/docs
4. **Customize configuration**: Modify `backend/config.yaml` as needed
5. **Set up development workflow**: Configure your IDE with the installed tools

---

## 📞 Support

If you encounter issues during installation:

1. **Check system requirements**: Ensure Ubuntu 20.04+ / Debian 11+
2. **Review error messages**: Most errors indicate missing dependencies
3. **Check logs**: Review backend logs in `backend/app.log`
4. **Verify network**: Ensure internet access for package downloads
5. **Free space**: Ensure at least 2GB free disk space

For additional help:
- 📖 **Documentation**: Refer to main README.md
- 🐛 **Issues**: Check project issue tracker
- 💬 **Community**: Join project discussions

---

**Installation completed successfully! 🎉**

*Welcome to VERSE - Where every choice writes a new story!*