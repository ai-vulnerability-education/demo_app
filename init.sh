#!/bin/bash
# AAD Framework initialization script

echo "================================================================"
echo "   AAD Framework - Adversarial Assessment Design System"
echo "   Complete Setup & Initialization"
echo "================================================================"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/3] Checking prerequisites..."
echo ""

# Check Python
if ! command -v python &> /dev/null; then
    echo "[ERROR] Python not found. Please install Python 3.11+"
    exit 1
fi
echo "[OK] Python found: $(python --version)"

# Check conda
if ! command -v conda &> /dev/null; then
    echo "[WARN] Conda not found. Trying to continue anyway..."
else
    echo "[OK] Conda found: $(conda --version)"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[WARN] Node.js not found. Frontend setup will be skipped."
    echo "       Install Node.js 18+ from https://nodejs.org/"
    NODE_AVAILABLE=false
else
    echo "[OK] Node.js found: $(node --version)"
    NODE_AVAILABLE=true
fi

echo ""
echo "----------------------------------------------------------------"
echo ""

echo "[2/3] Setting up Backend (FastAPI)..."
echo ""

cd "$DIR/backend"

if command -v conda &> /dev/null; then
    echo "Activating conda environment: common_lt"
    eval "$(conda shell.bash hook)"
    conda activate common_lt
fi

echo "Installing Python packages..."
pip install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo "[OK] Backend dependencies installed"
else
    echo "[ERROR] Failed to install backend dependencies"
    exit 1
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo "[OK] Created .env file"
fi

mkdir -p data

echo ""
echo "----------------------------------------------------------------"
echo ""

if [ "$NODE_AVAILABLE" = true ]; then
    echo "[3/3] Setting up Frontend (Next.js)..."
    echo ""
    
    cd "$DIR/frontend"
    
    echo "Installing Node packages..."
    npm install --silent
    
    if [ $? -eq 0 ]; then
        echo "[OK] Frontend dependencies installed"
    else
        echo "[ERROR] Failed to install frontend dependencies"
        exit 1
    fi
    
    if [ ! -f .env.local ]; then
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
        echo "[OK] Created .env.local file"
    fi
else
    echo "[3/3] Skipping frontend setup (Node.js not available)"
fi

echo ""
echo "================================================================"
echo "   Setup Complete!"
echo "================================================================"
echo ""
echo "Start Backend:"
echo "  cd $DIR/backend"
echo "  conda activate common_lt"
echo "  python main.py"
echo ""
echo "  Backend: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""

if [ "$NODE_AVAILABLE" = true ]; then
    echo "Start Frontend (new terminal):"
    echo "  cd $DIR/frontend"
    echo "  npm run dev"
    echo ""
    echo "  Frontend: http://localhost:3000"
    echo ""
fi

echo "Documentation:"
echo "  README.md - Main documentation"
echo "  DEPLOYMENT_GUIDE.md - Cloud deployment"
echo "  RENDER_NOTES.md - Data persistence notes"
echo ""
