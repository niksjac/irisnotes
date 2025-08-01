#!/bin/bash

# Check current line width in biome.json
current_width=$(grep -o '"lineWidth": [0-9]*' biome.json | grep -o '[0-9]*')

if [ "$current_width" = "80" ]; then
    echo "Switching to 120 line width..."
    cp biome-120.json biome.json
    echo "✓ Switched to 120"
elif [ "$current_width" = "120" ]; then
    echo "Switching to 80 line width..."
    cp biome-80.json biome.json
    echo "✓ Switched to 80"
else
    echo "Unknown line width ($current_width), defaulting to 120..."
    cp biome-120.json biome.json
    echo "✓ Set to 120"
fi