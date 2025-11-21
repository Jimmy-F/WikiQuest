#!/bin/bash

# Apply WikiQuest database migration to Supabase
# This script uses the Supabase Management API to execute SQL

set -e

# Load environment variables
if [ -f .env ]; then
  source .env
fi

PROJECT_REF="${SUPABASE_PROJECT_REF}"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"
MIGRATION_FILE="supabase/migrations/001_initial_schema.sql"

if [ -z "$PROJECT_REF" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN must be set"
  echo "Please check your .env file"
  exit 1
fi

echo "🚀 Applying WikiQuest database migration..."
echo "Project: $PROJECT_REF"
echo "Migration: $MIGRATION_FILE"
echo ""

# Read SQL file
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Execute via Supabase Management API
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Migration failed:"
  echo "$RESPONSE" | jq -r '.error'
  exit 1
else
  echo "✅ Migration applied successfully!"
  echo ""
  echo "📊 Created tables:"
  echo "  - users (with XP, levels, streaks)"
  echo "  - articles"
  echo "  - quizzes & quiz_attempts"
  echo "  - review_schedule (spaced repetition)"
  echo "  - xp_transactions"
  echo "  - achievements & user_achievements"
  echo "  - daily_quests & user_quest_progress"
  echo "  - collections"
  echo "  - category_mastery"
  echo "  - daily_stats"
  echo "  - leaderboard"
  echo "  - quiz_cache"
  echo ""
  echo "🎮 Seeded data:"
  echo "  - 23 achievements"
  echo "  - 8 daily/weekly/monthly quests"
  echo ""
  echo "🎉 Database ready for WikiQuest!"
fi
