#!/bin/bash
# Setup script for AAD Framework Backend

echo "🚀 Setting up AAD Framework Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "❌ Conda not found. Please install Anaconda or Miniconda."
    exit 1
fi

# Activate conda environment
echo "📦 Activating conda environment: common_lt"
eval "$(conda shell.bash hook)"
conda activate common_lt

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OPENROUTER_API_KEY (optional)"
fi

# Create data directory
mkdir -p data

echo "✅ Backend setup complete!"
echo ""
echo "To start the server:"
echo "  conda activate common_lt"
echo "  python main.py"
echo ""
echo "Or:"
echo "  conda activate common_lt"
echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
