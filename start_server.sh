#!/bin/bash

# Start the smart auto-terminating server
echo "🚀 Starting smart server..."
echo "Server will auto-quit when browser closes or quit button is clicked"
echo ""

# Make the Python script executable
chmod +x smart_server.py

# Start the smart server
python3 smart_server.py 8080