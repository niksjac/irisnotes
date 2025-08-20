#!/bin/bash

# Development Database Setup Script for IrisNotes
# This script initializes the development database with sample data

set -e  # Exit on any error

DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$DEV_DIR/.." && pwd)"
DB_FILE="$DEV_DIR/notes.db"
BASE_SCHEMA="$PROJECT_ROOT/schema/base.sql"
SEED_DATA="$PROJECT_ROOT/schema/seed-dev.sql"

echo "🗄️  Setting up IrisNotes development database..."

# Remove existing database if it exists
if [ -f "$DB_FILE" ]; then
    echo "📝 Removing existing database..."
    rm "$DB_FILE"
fi

# Create new database from schema files
echo "🏗️  Creating database schema..."
sqlite3 "$DB_FILE" < "$BASE_SCHEMA"

echo "🌱 Adding development seed data..."
sqlite3 "$DB_FILE" < "$SEED_DATA"

# Verify the database was created correctly
echo "✅ Verifying database..."
ITEMS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM items;")
TAGS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM tags;")
BOOKS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM items WHERE type='book';")
SECTIONS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM items WHERE type='section';")
NOTES=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM items WHERE type='note';")

echo "📊 Database created successfully:"
echo "   • Total Items: $ITEMS"
echo "   • Books: $BOOKS"
echo "   • Sections: $SECTIONS"
echo "   • Notes: $NOTES"
echo "   • Tags: $TAGS"

echo ""
echo "🚀 Development database ready!"
echo "   Location: $DB_FILE"
echo "   Run 'pnpm tauri dev' to start the app with this database"
