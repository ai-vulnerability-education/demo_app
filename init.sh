#!/bin/bash
# Complete initialization script for AAD Framework

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   AAD Framework - Adversarial Assessment Design System        ║"
echo "║   Complete Setup & Initialization                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get the script directory
DIR="$(cd "$(dirname "$0")" && pwd)"

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python found: $(python --version)"

# Check conda
if ! command -v conda &> /dev/null; then
    echo "⚠️  Conda not found. Trying to continue anyway..."
else
    echo "✅ Conda found: $(conda --version)"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Frontend setup will be skipped."
    echo "   Install Node.js 18+ from https://nodejs.org/"
    NODE_AVAILABLE=false
else
    echo "✅ Node.js found: $(node --version)"
    NODE_AVAILABLE=true
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend setup
echo "📦 Setting up Backend (FastAPI)..."
echo ""

cd "$DIR/backend"

# Activate conda environment
if command -v conda &> /dev/null; then
    echo "Activating conda environment: common_lt"
    eval "$(conda shell.bash hook)"
    conda activate common_lt
fi

# Install Python dependencies
echo "Installing Python packages..."
pip install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create .env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Create data directory
mkdir -p data

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Frontend setup (if Node.js available)
if [ "$NODE_AVAILABLE" = true ]; then
    echo "🎨 Setting up Frontend (Next.js)..."
    echo ""
    
    cd "$DIR/frontend"
    
    # Install dependencies
    echo "Installing Node packages (this may take a moment)..."
    npm install --silent
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend dependencies installed"
    else
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
    
    # Create .env.local
    if [ ! -f .env.local ]; then
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
        echo "✅ Created .env.local file"
    fi
else
    echo "⏭️  Skipping frontend setup (Node.js not available)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "✨ Setup Complete!"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Quick Start Guide                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📡 Start Backend:"
echo "   cd $DIR/backend"
echo "   conda activate common_lt"
echo "   python main.py"
echo ""
echo "   Backend will run at: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

if [ "$NODE_AVAILABLE" = true ]; then
    echo "🎨 Start Frontend (in a new terminal):"
    echo "   cd $DIR/frontend"
    echo "   npm run dev"
    echo ""
    echo "   Frontend will run at: http://localhost:3000"
    echo ""
fi

echo "📚 Documentation:"
echo "   • README: $DIR/README.md"
echo "   • Quick Start: $DIR/QUICKSTART.md"
echo "   • Project Summary: $DIR/PROJECT_SUMMARY.md"
echo ""
echo "🎯 Sample Features:"
echo "   • 30 NLP questions pre-loaded"
echo "   • ES calculation algorithm working"
echo "   • AI testing (mock mode - no API key needed)"
echo "   • Statistical analysis"
echo "   • Data export (JSON/CSV)"
echo ""
echo "Happy assessing! 🎓"
