#!/bin/sh
echo "⌛ Waiting for Kong to start..."
sleep 10  # Wait for Kong Admin API to be available

echo "🚀 Registering API services with Kong..."
npm run setup:kong

echo "✅ Kong configuration completed."

# Start the backend API server
echo "🚀 Starting Backend API..."
npm start  # ✅ Keeps the container running
