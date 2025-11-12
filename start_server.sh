#!/bin/bash
# Convenience script to start the Sinatra backend server

cd "$(dirname "$0")"
echo "Starting Foosball Tournament backend server..."
bundle exec ruby web_router.rb
