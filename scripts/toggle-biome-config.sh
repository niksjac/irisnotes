#!/bin/bash

SETTINGS_FILE=".vscode/settings.json"

# Check current biome config path
current_config=$(grep -o '"biome.configurationPath": "[^"]*"' "$SETTINGS_FILE" | grep -o '\./biome[^"]*')

if [ "$current_config" = "./biome80.json" ]; then
    echo "Switching to biome120.json..."
    sed -i 's/"biome.configurationPath": ".\/biome80.json"/"biome.configurationPath": ".\/biome120.json"/' "$SETTINGS_FILE"
    echo "✓ Switched to 120 line width config"
elif [ "$current_config" = "./biome120.json" ]; then
    echo "Switching to biome80.json..."
    sed -i 's/"biome.configurationPath": ".\/biome120.json"/"biome.configurationPath": ".\/biome80.json"/' "$SETTINGS_FILE"
    echo "✓ Switched to 80 line width config"
else
    echo "Unknown config ($current_config), defaulting to biome120.json..."
    sed -i 's/"biome.configurationPath": "[^"]*"/"biome.configurationPath": ".\/biome120.json"/' "$SETTINGS_FILE"
    echo "✓ Set to 120 line width config"
fi

# VSCode formatting will be triggered by keybinding sequence