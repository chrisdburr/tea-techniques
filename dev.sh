#!/bin/bash

# This script starts both frontend and backend in development mode

# Function to clean up on exit
cleanup() {
  echo "Stopping all processes..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Setup trap for clean exit
trap cleanup SIGINT SIGTERM

# Check if Python virtual environment is active
if [ -z "$VIRTUAL_ENV" ]; then
  echo "Activating Python virtual environment..."
  if [ -d ".venv" ]; then
    source .venv/bin/activate
  else
    echo "No .venv directory found. Running poetry env use to create it..."
    poetry env use python
    source $(poetry env info --path)/bin/activate
  fi
else
  echo "Virtual environment already active: $VIRTUAL_ENV"
fi

# Start Django backend in the background
echo "Starting Django backend server..."
cd backend
USE_SQLITE=True python manage.py runserver &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start Next.js frontend in the background
echo "Starting Next.js frontend..."
cd frontend
npm run dev --turbopack &
FRONTEND_PID=$!
cd ..

echo "Development environment running."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all services."

# Wait for all background processes to finish
wait