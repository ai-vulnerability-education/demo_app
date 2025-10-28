#!/bin/bash
# Quick start script - runs both backend and frontend

echo "🚀 Starting AAD Framework..."

# Get the script directory
DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend
echo "📡 Starting backend server..."
cd "$DIR/backend"

# Activate conda and start backend in background
eval "$(conda shell.bash hook)"
conda activate common_lt

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📥 Installing backend dependencies..."
    pip install -r requirements.txt
fi

python main.py &
BACKEND_PID=$!

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
wait $BACKEND_PID
