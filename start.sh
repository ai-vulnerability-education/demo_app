#!/bin/bash
# Quick start script for AAD Framework backend

echo "Starting AAD Framework Backend..."

DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DIR/backend"

eval "$(conda shell.bash hook)"
conda activate common_lt

if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

echo "Backend server starting..."
echo "API Documentation: http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo ""

python main.py
