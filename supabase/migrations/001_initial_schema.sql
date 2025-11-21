-- WikiQuest Database Schema
-- Phase 1: MVP with Full Gamification Support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,

  -- Gamification Core
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_available BOOLEAN DEFAULT false,

  -- Subscription
  subscription_tier TEXT DEFAULT 'free', -- free, student, pro
  subscription_status TEXT DEFAULT 'inactive',
  stripe_customer_id TEXT,

  -- Settings
  settings JSONB DEFAULT '{
    "quiz_frequency": 2,
    "notifications_enabled": true,
    "auto_review_enabled": true,
    "sound_effects": true,
    "theme": "default",
    "quiz_difficulty": "medium"
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ARTICLES TABLE
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Wikipedia Data
  wikipedia_url TEXT NOT NULL,
  wikipedia_title TEXT NOT NULL,
  wikipedia_page_id TEXT,
  wikipedia_categories TEXT[], -- Array of categories
  article_length INTEGER, -- Character count

  -- Reading Progress
  paragraphs_read INTEGER DEFAULT 0,
  total_paragraphs INTEGER,
  reading_time_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Performance
  quiz_count INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  comprehension_score FLOAT, -- 0-100

  -- XP Earned
  xp_earned INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_user_article UNIQUE(user_id, wikipedia_url)
);

CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_completed ON articles(user_id, completed);
CREATE INDEX idx_articles_categories ON articles USING GIN(wikipedia_categories);

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Quiz Content
  paragraph_range TEXT, -- e.g., "5-7"
  questions JSONB NOT NULL, -- [{question, options, correct_answer, explanation}]

  -- Generation
  model_used TEXT DEFAULT 'haiku', -- haiku or sonnet
  is_cached BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Performance
  total_questions INTEGER,

  CONSTRAINT check_model CHECK (model_used IN ('haiku', 'sonnet'))
);

CREATE INDEX idx_quizzes_article ON quizzes(article_id);
CREATE INDEX idx_quizzes_user ON quizzes(user_id);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,

  -- Answers
  answers JSONB NOT NULL, -- [{question_id, user_answer, is_correct}]
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  score FLOAT NOT NULL, -- 0-100

  -- XP Reward
  xp_earned INTEGER DEFAULT 0,

  -- Timing
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_article ON quiz_attempts(article_id);

-- ============================================
-- SPACED REPETITION SCHEDULE
-- ============================================
CREATE TABLE review_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,

  -- SM-2 Algorithm Fields
  next_review_date DATE NOT NULL,
  interval_days INTEGER DEFAULT 1,
  easiness_factor FLOAT DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,

  -- Status
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  last_score FLOAT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_article_review UNIQUE(user_id, article_id)
);

CREATE INDEX idx_review_schedule_due ON review_schedule(user_id, next_review_date);
CREATE INDEX idx_review_schedule_user ON review_schedule(user_id);

-- ============================================
-- XP TRANSACTIONS (Audit Log)
-- ============================================
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Transaction Details
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'article_read', 'quiz_completed', 'perfect_score', 'daily_login', 'review_completed', 'quest_completed', 'achievement_unlocked'

  -- References
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  achievement_id UUID, -- Will reference achievements table
  quest_id UUID, -- Will reference quests table

  -- Metadata
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Achievement Definition
  key TEXT UNIQUE NOT NULL, -- e.g., 'first_article', 'bookworm_10'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Emoji or icon name
  category TEXT NOT NULL, -- 'reading', 'mastery', 'streak', 'special'

  -- Requirements
  requirement_type TEXT NOT NULL, -- 'article_count', 'streak_days', 'category_mastery', 'perfect_scores', 'custom'
  requirement_value INTEGER,
  requirement_metadata JSONB,

  -- Rewards
  xp_reward INTEGER DEFAULT 0,

  -- Metadata
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
  sort_order INTEGER DEFAULT 0,

  CONSTRAINT check_category CHECK (category IN ('reading', 'mastery', 'streak', 'special', 'subject')),
  CONSTRAINT check_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- ============================================
-- USER ACHIEVEMENTS (Unlocked)
-- ============================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,

  -- Progress
  progress INTEGER DEFAULT 0, -- For tracking partial progress
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, unlocked);

-- ============================================
-- DAILY QUESTS
-- ============================================
CREATE TABLE daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quest Definition
  key TEXT UNIQUE NOT NULL, -- e.g., 'read_3_articles'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,

  -- Requirements
  quest_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  requirement_type TEXT NOT NULL, -- 'articles_read', 'quizzes_completed', 'reviews_completed', 'perfect_scores'
  requirement_count INTEGER NOT NULL,
  requirement_metadata JSONB,

  -- Rewards
  xp_reward INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  CONSTRAINT check_quest_type CHECK (quest_type IN ('daily', 'weekly', 'monthly'))
);

-- ============================================
-- USER QUEST PROGRESS
-- ============================================
CREATE TABLE user_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES daily_quests(id) ON DELETE CASCADE NOT NULL,

  -- Progress
  current_progress INTEGER DEFAULT 0,
  required_progress INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Period Tracking
  period_start DATE NOT NULL, -- When this quest period started
  period_end DATE NOT NULL, -- When this quest period ends

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_quest_period UNIQUE(user_id, quest_id, period_start)
);

CREATE INDEX idx_user_quest_progress_user ON user_quest_progress(user_id, period_end);
CREATE INDEX idx_user_quest_progress_active ON user_quest_progress(user_id, completed, period_end);

-- ============================================
-- STUDY COLLECTIONS
-- ============================================
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Collection Details
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Hex color
  icon TEXT, -- Emoji

  -- Stats
  article_count INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_collections_user ON collections(user_id);

-- ============================================
-- COLLECTION ARTICLES (Many-to-Many)
-- ============================================
CREATE TABLE collection_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,

  CONSTRAINT unique_collection_article UNIQUE(collection_id, article_id)
);

CREATE INDEX idx_collection_articles_collection ON collection_articles(collection_id);
CREATE INDEX idx_collection_articles_article ON collection_articles(article_id);

-- ============================================
-- CATEGORY MASTERY
-- ============================================
CREATE TABLE category_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Category
  category_name TEXT NOT NULL,

  -- Progress
  articles_read INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  average_score FLOAT DEFAULT 0,
  mastery_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert, master

  -- XP
  total_xp_earned INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_category UNIQUE(user_id, category_name),
  CONSTRAINT check_mastery_level CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master'))
);

CREATE INDEX idx_category_mastery_user ON category_mastery(user_id);
CREATE INDEX idx_category_mastery_level ON category_mastery(user_id, mastery_level);

-- ============================================
-- DAILY STATS (Aggregated)
-- ============================================
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,

  -- Activity
  articles_read INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,

  -- Performance
  average_quiz_score FLOAT,
  perfect_scores INTEGER DEFAULT 0,

  -- Time
  total_reading_time_seconds INTEGER DEFAULT 0,

  -- XP
  xp_earned INTEGER DEFAULT 0,

  -- Streak
  maintained_streak BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_stats_user ON daily_stats(user_id, date DESC);
CREATE INDEX idx_daily_stats_streak ON daily_stats(user_id, maintained_streak, date);

-- ============================================
-- QUIZ CACHE (Pre-generated for popular articles)
-- ============================================
CREATE TABLE quiz_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Article Reference
  wikipedia_url TEXT NOT NULL,
  wikipedia_page_id TEXT,
  paragraph_range TEXT NOT NULL,

  -- Quiz Content
  questions JSONB NOT NULL,
  model_used TEXT DEFAULT 'haiku',

  -- Usage Stats
  hit_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For cache invalidation

  CONSTRAINT unique_cache_entry UNIQUE(wikipedia_url, paragraph_range)
);

CREATE INDEX idx_quiz_cache_url ON quiz_cache(wikipedia_url);
CREATE INDEX idx_quiz_cache_usage ON quiz_cache(hit_count DESC, last_used_at DESC);

-- ============================================
-- LEADERBOARD (Materialized View - Updated Periodically)
-- ============================================
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Period
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Stats
  rank INTEGER,
  xp_earned INTEGER DEFAULT 0,
  articles_read INTEGER DEFAULT 0,
  average_score FLOAT,

  -- Category (optional - for category leaderboards)
  category_name TEXT,

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_leaderboard_entry UNIQUE(user_id, period_type, period_start, category_name),
  CONSTRAINT check_period_type CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time'))
);

CREATE INDEX idx_leaderboard_period ON leaderboard(period_type, period_start, rank);
CREATE INDEX idx_leaderboard_user ON leaderboard(user_id, period_type);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_category_mastery_updated_at BEFORE UPDATE ON category_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Simple level formula: Level = floor(XP / 100) + 1
  -- Can be adjusted for different XP curves
  RETURN GREATEST(1, FLOOR(xp / 100.0) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update user level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_level = calculate_level(NEW.total_xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_level_trigger BEFORE UPDATE ON users FOR EACH ROW WHEN (OLD.total_xp IS DISTINCT FROM NEW.total_xp) EXECUTE FUNCTION update_user_level();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own articles" ON articles FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view own quizzes" ON quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reviews" ON review_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reviews" ON review_schedule FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own XP" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own XP" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quests" ON user_quest_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quests" ON user_quest_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own collections" ON collections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own collection articles" ON collection_articles FOR SELECT USING (
  EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_articles.collection_id AND collections.user_id = auth.uid())
);
CREATE POLICY "Users can manage own collection articles" ON collection_articles FOR ALL USING (
  EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_articles.collection_id AND collections.user_id = auth.uid())
);

CREATE POLICY "Users can view own category mastery" ON category_mastery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own category mastery" ON category_mastery FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for reference tables
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view quests" ON daily_quests FOR SELECT USING (true);

-- Leaderboard is public (opt-in handled at application level)
CREATE POLICY "Anyone can view leaderboard" ON leaderboard FOR SELECT USING (true);

-- Quiz cache is public (read-only for users, write for service)
CREATE POLICY "Anyone can view quiz cache" ON quiz_cache FOR SELECT USING (true);

-- ============================================
-- INITIAL DATA: ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (key, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity, sort_order) VALUES
-- Reading Milestones
('first_article', 'First Steps', 'Read your first article', '📚', 'reading', 'article_count', 1, 10, 'common', 1),
('bookworm_10', 'Bookworm', 'Read 10 articles', '📖', 'reading', 'article_count', 10, 50, 'common', 2),
('scholar_50', 'Scholar', 'Read 50 articles', '🎓', 'reading', 'article_count', 50, 200, 'rare', 3),
('professor_100', 'Professor', 'Read 100 articles', '👨‍🏫', 'reading', 'article_count', 100, 500, 'epic', 4),
('librarian_500', 'Librarian', 'Read 500 articles', '🏛️', 'reading', 'article_count', 500, 2000, 'legendary', 5),

-- Perfect Scores
('perfectionist_5', 'Perfectionist', 'Get 100% on 5 quizzes', '💯', 'mastery', 'perfect_scores', 5, 50, 'common', 10),
('sharp_mind_20', 'Sharp Mind', 'Get 100% on 20 quizzes', '🎯', 'mastery', 'perfect_scores', 20, 200, 'rare', 11),
('genius_100', 'Genius', 'Get 100% on 100 quizzes', '🧠', 'mastery', 'perfect_scores', 100, 1000, 'legendary', 12),

-- Streaks
('on_fire_7', 'On Fire', 'Maintain a 7-day streak', '🔥', 'streak', 'streak_days', 7, 100, 'common', 20),
('unstoppable_30', 'Unstoppable', 'Maintain a 30-day streak', '⚡', 'streak', 'streak_days', 30, 500, 'rare', 21),
('legend_100', 'Legend', 'Maintain a 100-day streak', '👑', 'streak', 'streak_days', 100, 2000, 'epic', 22),
('eternal_365', 'Eternal', 'Maintain a 365-day streak', '💎', 'streak', 'streak_days', 365, 10000, 'legendary', 23),

-- Subject Mastery
('scientist_20', 'Scientist', 'Read 20 science articles', '🔬', 'subject', 'category_mastery', 20, 150, 'common', 30),
('historian_20', 'Historian', 'Read 20 history articles', '🏛️', 'subject', 'category_mastery', 20, 150, 'common', 31),
('techie_20', 'Techie', 'Read 20 technology articles', '💻', 'subject', 'category_mastery', 20, 150, 'common', 32),
('artist_20', 'Artist', 'Read 20 art articles', '🎨', 'subject', 'category_mastery', 20, 150, 'common', 33),

-- Special
('world_explorer', 'World Explorer', 'Read articles about 50 different countries', '🌍', 'special', 'custom', 50, 500, 'rare', 40),
('time_traveler', 'Time Traveler', 'Read articles spanning 10 different centuries', '⏰', 'special', 'custom', 10, 300, 'rare', 41),
('jack_of_all_trades', 'Jack of All Trades', 'Master 10 different categories', '🎲', 'special', 'custom', 10, 1000, 'epic', 42);

-- ============================================
-- INITIAL DATA: DAILY QUESTS
-- ============================================
INSERT INTO daily_quests (key, name, description, icon, quest_type, requirement_type, requirement_count, xp_reward, is_active, sort_order) VALUES
-- Daily Quests
('daily_read_3', 'Knowledge Seeker', 'Read 3 articles today', '📚', 'daily', 'articles_read', 3, 50, true, 1),
('daily_perfect_1', 'Perfect Practice', 'Get 100% on any quiz today', '💯', 'daily', 'perfect_scores', 1, 30, true, 2),
('daily_review_5', 'Diligent Reviewer', 'Complete 5 reviews today', '🔄', 'daily', 'reviews_completed', 5, 75, true, 3),

-- Weekly Quests
('weekly_read_20', 'Weekly Reader', 'Read 20 articles this week', '📖', 'weekly', 'articles_read', 20, 200, true, 10),
('weekly_categories_5', 'Subject Explorer', 'Read from 5 different categories this week', '🎯', 'weekly', 'articles_read', 5, 150, true, 11),
('weekly_quizzes_30', 'Quiz Champion', 'Complete 30 quizzes this week', '🏆', 'weekly', 'quizzes_completed', 30, 250, true, 12),

-- Monthly Quests
('monthly_read_50', 'Marathon Reader', 'Read 50 articles this month', '🏃', 'monthly', 'articles_read', 50, 500, true, 20),
('monthly_streak_30', 'Consistency Master', 'Maintain a 30-day streak', '⚡', 'monthly', 'streak_days', 30, 1000, true, 21);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'User profiles with gamification stats';
COMMENT ON TABLE articles IS 'Wikipedia articles read by users with comprehension tracking';
COMMENT ON TABLE quizzes IS 'Generated quizzes for article sections';
COMMENT ON TABLE quiz_attempts IS 'User quiz attempt history with XP tracking';
COMMENT ON TABLE review_schedule IS 'Spaced repetition schedule using SM-2 algorithm';
COMMENT ON TABLE xp_transactions IS 'XP transaction audit log for all XP gains';
COMMENT ON TABLE achievements IS 'Achievement definitions (badges, trophies)';
COMMENT ON TABLE user_achievements IS 'User achievement unlocks and progress';
COMMENT ON TABLE daily_quests IS 'Daily, weekly, monthly quest definitions';
COMMENT ON TABLE user_quest_progress IS 'User quest progress tracking';
COMMENT ON TABLE collections IS 'User-created study collections';
COMMENT ON TABLE category_mastery IS 'User mastery level per Wikipedia category';
COMMENT ON TABLE daily_stats IS 'Aggregated daily statistics per user';
COMMENT ON TABLE leaderboard IS 'Leaderboard rankings (updated periodically)';
