#!/bin/bash

# Build script for PPM 3.0

echo "Building PPM 3.0..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Build frontend
echo "Building frontend..."
cd client
npm run build
cd ..

# Build backend (if needed)
echo "Building backend..."
cd server
# No build step needed for Node.js, but we can run tests
npm test
cd ..

echo "Build completed successfully!"