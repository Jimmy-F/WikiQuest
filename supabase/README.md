# WikiQuest Database Schema

## Overview

This directory contains the Supabase database migrations for WikiQuest.

## Schema Highlights

### Core Tables
- `users` - User profiles with XP, levels, streaks
- `articles` - Wikipedia articles read with comprehension tracking
- `quizzes` - AI-generated quizzes
- `quiz_attempts` - Quiz performance history

### Gamification Tables
- `xp_transactions` - XP audit log
- `achievements` - Achievement definitions
- `user_achievements` - User achievement unlocks
- `daily_quests` - Quest definitions
- `user_quest_progress` - Quest tracking
- `category_mastery` - Subject mastery levels
- `daily_stats` - Daily activity aggregation
- `leaderboard` - Global/category rankings

### Learning Tables
- `review_schedule` - Spaced repetition (SM-2 algorithm)
- `quiz_cache` - Pre-generated quizzes for popular articles
- `collections` - User study collections

## XP System

### XP Rewards
- Read article: **+10 XP**
- Complete quiz: **+5 XP per question**
- Perfect score (100%): **+25 bonus XP**
- Daily login: **+5 XP**
- Review completed: **+15 XP**
- Quest completed: **Variable XP**
- Achievement unlocked: **Variable XP**

### Level Formula
```
Level = floor(XP / 100) + 1
```

Example:
- 0-99 XP = Level 1
- 100-199 XP = Level 2
- 1000-1099 XP = Level 11

## Applying Migrations

### Method 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/ghmidhpmfbxonhcqtcmo/sql
2. Copy the contents of `001_initial_schema.sql`
3. Paste into SQL Editor
4. Click "Run"

### Method 2: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref ghmidhpmfbxonhcqtcmo

# Apply migration
supabase db push
```

### Method 3: Direct SQL (using psql)
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.ghmidhpmfbxonhcqtcmo.supabase.co:5432/postgres" < supabase/migrations/001_initial_schema.sql
```

## Row Level Security (RLS)

All user data tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Reference tables (achievements, quests) are publicly readable
- Leaderboard is public (opt-in handled at application level)

## Indexes

Optimized indexes for:
- User queries (by user_id)
- Article lookups (by user + completion status)
- Review scheduling (by user + due date)
- Leaderboard queries (by period + rank)
- Category searches (GIN index on categories array)

## Functions & Triggers

- `calculate_level(xp)` - Calculates user level from XP
- `update_user_level()` - Auto-updates level when XP changes
- `update_updated_at()` - Auto-updates timestamps

## Initial Data

The migration includes:
- **23 achievements** (reading milestones, streaks, subject mastery)
- **8 daily/weekly/monthly quests**

## Schema Diagram

```
users (XP, level, streak)
  ↓
articles (reading progress)
  ↓
quizzes → quiz_attempts (scores, XP)
  ↓
xp_transactions (audit log)
  ↓
user_achievements (unlocks)
category_mastery (subject expertise)
daily_stats (aggregated metrics)
```

## Next Steps

After applying the migration:
1. Verify tables in Supabase Dashboard
2. Test RLS policies
3. Seed additional test data if needed
4. Configure Supabase Auth for user registration
