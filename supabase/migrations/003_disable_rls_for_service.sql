-- Disable RLS for backend service to allow article tracking and achievements
-- The app uses backend service authentication, not Supabase Auth

-- Drop existing auth-based RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;
DROP POLICY IF EXISTS "Users can view own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can insert own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own reviews" ON review_schedule;
DROP POLICY IF EXISTS "Users can insert own reviews" ON review_schedule;
DROP POLICY IF EXISTS "Users can update own reviews" ON review_schedule;
DROP POLICY IF EXISTS "Users can view own xp" ON xp_transactions;
DROP POLICY IF EXISTS "Users can insert own xp" ON xp_transactions;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view own quest progress" ON user_quest_progress;
DROP POLICY IF EXISTS "Users can insert own quest progress" ON user_quest_progress;
DROP POLICY IF EXISTS "Users can update own quest progress" ON user_quest_progress;
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
DROP POLICY IF EXISTS "Users can view own collection articles" ON collection_articles;
DROP POLICY IF EXISTS "Users can insert own collection articles" ON collection_articles;
DROP POLICY IF EXISTS "Users can delete own collection articles" ON collection_articles;
DROP POLICY IF EXISTS "Users can view own category mastery" ON category_mastery;
DROP POLICY IF EXISTS "Users can insert own category mastery" ON category_mastery;
DROP POLICY IF EXISTS "Users can update own category mastery" ON category_mastery;
DROP POLICY IF EXISTS "Users can view own daily stats" ON daily_stats;
DROP POLICY IF EXISTS "Users can insert own daily stats" ON daily_stats;
DROP POLICY IF EXISTS "Users can update own daily stats" ON daily_stats;

-- Disable RLS on all tables to allow backend service access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE category_mastery DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats DISABLE ROW LEVEL SECURITY;

-- Note: Application security is handled at the backend API level
