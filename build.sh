#!/bin/bash
set -e

echo "=== MemoryShield AI Build Script ==="

# Build backend
echo "Building backend..."
cd backend
pip install -r requirements.txt

# Create necessary directories
mkdir -p app/{routes,engines,services,utils,database}

# Build frontend
echo "Building frontend..."
cd ../frontend
npm install --legacy-peer-deps
npm run build

echo "=== Build Complete ==="
echo "Backend: Ready"
echo "Frontend: Built to dist/"
