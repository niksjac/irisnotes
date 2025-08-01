#!/bin/bash

BIOME_CONFIG="biome.json"
SELECTED_TEXT="$1"

# If no text provided, exit
if [ -z "$SELECTED_TEXT" ]; then
    echo "Error: No text provided. Use with VSCode task that passes selected text."
    exit 1
fi

# Function to calculate visual width of a line (accounting for tabs)
calculate_visual_width() {
    local line="$1"
    local width=0
    local i=0

    while [ $i -lt ${#line} ]; do
        char="${line:$i:1}"
        if [ "$char" = $'\t' ]; then
            # Tab expands to next multiple of 8
            width=$(( (width + 8) / 8 * 8 ))
        else
            width=$((width + 1))
        fi
        i=$((i + 1))
    done

    echo $width
}

# Analyze selected text to detect current formatting width
echo "Analyzing selected code formatting..."

# Split into lines and find the longest visual line width
max_width=0
line_count=0

while IFS= read -r line; do
    if [ -n "$line" ]; then  # Skip empty lines
        visual_width=$(calculate_visual_width "$line")
        if [ $visual_width -gt $max_width ]; then
            max_width=$visual_width
        fi
        line_count=$((line_count + 1))
    fi
done <<< "$SELECTED_TEXT"

echo "Detected maximum line width: $max_width columns across $line_count lines"

# Determine current formatting width and toggle
if [ $max_width -le 80 ]; then
    TARGET_WIDTH=120
    echo "Code appears formatted for ≤80 columns - toggling to 120"
elif [ $max_width -le 120 ]; then
    TARGET_WIDTH=80
    echo "Code appears formatted for >80 columns - toggling to 80"
else
    TARGET_WIDTH=80
    echo "Code exceeds 120 columns - setting to 80 for better formatting"
fi

# Get current lineWidth from biome.json
CURRENT_WIDTH=$(grep -o '"lineWidth": [0-9]*' "$BIOME_CONFIG" | grep -o '[0-9]*')

if [ "$CURRENT_WIDTH" = "$TARGET_WIDTH" ]; then
    echo "✓ LineWidth already set to $TARGET_WIDTH"
else
    echo "Changing lineWidth from $CURRENT_WIDTH to $TARGET_WIDTH..."

    # Update lineWidth in biome.json
    sed -i "s/\"lineWidth\": [0-9]*/\"lineWidth\": $TARGET_WIDTH/" "$BIOME_CONFIG"

    echo "✓ Updated biome.json lineWidth to $TARGET_WIDTH"
fi