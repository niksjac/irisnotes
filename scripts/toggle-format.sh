#!/bin/bash

STATE_FILE=".vscode/linewidth-state"
TARGET_FILE="$1"

# Create state file if it doesn't exist (default to 120)
if [ ! -f "$STATE_FILE" ]; then
    echo "120" > "$STATE_FILE"
fi

# Read current state
current_state=$(cat "$STATE_FILE")

# Toggle and format
if [ "$current_state" = "80" ]; then
    echo "120" > "$STATE_FILE"
    echo "Formatting with 120 line width..."
    npx biome format --config-path biome-120.json --write "$TARGET_FILE"
else
    echo "80" > "$STATE_FILE"
    echo "Formatting with 80 line width..."
    npx biome format --config-path biome-80.json --write "$TARGET_FILE"
fi