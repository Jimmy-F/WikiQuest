-- Add comprehensive achievements to the achievements table
INSERT INTO achievements (key, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity, sort_order) VALUES
-- Reading Achievements
('first_article', 'First Steps', 'Read your first Wikipedia article', '📖', 'reading', 'articles_read', 1, 10, 'common', 1),
('bookworm', 'Bookworm', 'Read 10 Wikipedia articles', '📚', 'reading', 'articles_read', 10, 50, 'common', 2),
('scholar', 'Scholar', 'Read 25 Wikipedia articles', '🎓', 'reading', 'articles_read', 25, 100, 'rare', 3),
('knowledge_seeker', 'Knowledge Seeker', 'Read 50 Wikipedia articles', '🔍', 'reading', 'articles_read', 50, 200, 'epic', 4),
('wikipedia_master', 'Wikipedia Master', 'Read 100 Wikipedia articles', '🏛️', 'reading', 'articles_read', 100, 500, 'legendary', 5),
('speed_reader', 'Speed Reader', 'Complete an article in under 2 minutes', '⚡', 'reading', 'speed_read', 1, 30, 'rare', 6),
('deep_diver', 'Deep Diver', 'Spend 10+ minutes on a single article', '🏊', 'reading', 'deep_read', 1, 30, 'rare', 7),

-- Quiz Mastery Achievements
('first_quiz', 'Quiz Beginner', 'Complete your first quiz', '❓', 'mastery', 'quizzes_completed', 1, 10, 'common', 10),
('quiz_streak_3', 'On Fire!', 'Get 100% on 3 quizzes in a row', '🔥', 'mastery', 'perfect_streak', 3, 50, 'rare', 11),
('quiz_master', 'Quiz Master', 'Complete 50 quizzes', '🧠', 'mastery', 'quizzes_completed', 50, 150, 'epic', 12),
('perfectionist', 'Perfectionist', 'Get 100% on 10 quizzes', '💯', 'mastery', 'perfect_scores', 10, 100, 'rare', 13),
('unstoppable', 'Unstoppable', 'Get 100% on 25 quizzes', '🌟', 'mastery', 'perfect_scores', 25, 250, 'epic', 14),
('golden_scholar', 'Golden Scholar', 'Achieve 5 golden completions', '🏆', 'mastery', 'golden_completions', 5, 200, 'epic', 15),
('legendary_learner', 'Legendary Learner', 'Achieve 15 golden completions', '👑', 'mastery', 'golden_completions', 15, 500, 'legendary', 16),

-- Streak Achievements
('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', '📅', 'streak', 'current_streak', 7, 70, 'common', 20),
('dedicated', 'Dedicated', 'Maintain a 14-day streak', '💪', 'streak', 'current_streak', 14, 150, 'rare', 21),
('committed', 'Committed', 'Maintain a 30-day streak', '🎯', 'streak', 'current_streak', 30, 300, 'epic', 22),
('unstoppable_force', 'Unstoppable Force', 'Maintain a 60-day streak', '🚀', 'streak', 'current_streak', 60, 600, 'legendary', 23),
('comeback_kid', 'Comeback Kid', 'Restore a lost streak', '🔄', 'streak', 'streak_restored', 1, 50, 'rare', 24),

-- Category/Subject Achievements
('history_buff', 'History Buff', 'Read 10 history articles', '📜', 'subject', 'history_articles', 10, 75, 'rare', 30),
('scientist', 'Scientist', 'Read 10 science articles', '🔬', 'subject', 'science_articles', 10, 75, 'rare', 31),
('tech_guru', 'Tech Guru', 'Read 10 technology articles', '💻', 'subject', 'tech_articles', 10, 75, 'rare', 32),
('culture_enthusiast', 'Culture Enthusiast', 'Read 10 culture articles', '🎭', 'subject', 'culture_articles', 10, 75, 'rare', 33),
('nature_lover', 'Nature Lover', 'Read 10 nature articles', '🌿', 'subject', 'nature_articles', 10, 75, 'rare', 34),
('sports_fan', 'Sports Fan', 'Read 10 sports articles', '⚽', 'subject', 'sports_articles', 10, 75, 'rare', 35),
('art_appreciator', 'Art Appreciator', 'Read 10 art articles', '🎨', 'subject', 'art_articles', 10, 75, 'rare', 36),
('music_maven', 'Music Maven', 'Read 10 music articles', '🎵', 'subject', 'music_articles', 10, 75, 'rare', 37),
('polymath', 'Polymath', 'Master 5 different categories', '🌐', 'subject', 'categories_mastered', 5, 300, 'epic', 38),
('renaissance_mind', 'Renaissance Mind', 'Master 10 different categories', '🏛️', 'subject', 'categories_mastered', 10, 600, 'legendary', 39),

-- Special Achievements (Adventure/Explorer Mode)
('adventurer', 'Adventurer', 'Complete your first quest', '🗺️', 'special', 'quests_completed', 1, 50, 'common', 40),
('quest_master', 'Quest Master', 'Complete 10 quests', '⚔️', 'special', 'quests_completed', 10, 200, 'epic', 41),
('explorer', 'Explorer', 'Unlock Explorer Mode', '🧭', 'special', 'explorer_unlocked', 1, 100, 'rare', 42),
('pathfinder', 'Pathfinder', 'Complete all beginner paths', '🛤️', 'special', 'beginner_paths', 1, 150, 'rare', 43),
('trailblazer', 'Trailblazer', 'Complete all intermediate paths', '🏔️', 'special', 'intermediate_paths', 1, 250, 'epic', 44),
('pioneer', 'Pioneer', 'Complete all advanced paths', '🚁', 'special', 'advanced_paths', 1, 400, 'legendary', 45),
('completionist', 'Completionist', 'Complete an entire category', '✅', 'special', 'category_completed', 1, 300, 'epic', 46),
('early_bird', 'Early Bird', 'Complete a daily challenge before 9 AM', '🌅', 'special', 'early_challenge', 1, 30, 'rare', 47),
('night_owl', 'Night Owl', 'Study after midnight', '🦉', 'special', 'late_study', 1, 30, 'rare', 48),
('weekend_warrior', 'Weekend Warrior', 'Study on both Saturday and Sunday', '🏖️', 'special', 'weekend_study', 1, 40, 'rare', 49),

-- Level-based Achievements
('level_5', 'Rising Star', 'Reach Level 5', '⭐', 'special', 'level_reached', 5, 50, 'common', 50),
('level_10', 'Knowledge Keeper', 'Reach Level 10', '📚', 'special', 'level_reached', 10, 100, 'rare', 51),
('level_25', 'Wisdom Seeker', 'Reach Level 25', '🧙', 'special', 'level_reached', 25, 250, 'epic', 52),
('level_50', 'Master Scholar', 'Reach Level 50', '🎩', 'special', 'level_reached', 50, 500, 'legendary', 53),
('level_100', 'Grand Master', 'Reach Level 100', '👨‍🎓', 'special', 'level_reached', 100, 1000, 'legendary', 54),

-- Heart System Achievements
('survivor', 'Survivor', 'Complete a quiz with only 1 heart left', '❤️', 'special', 'low_heart_win', 1, 50, 'rare', 55),
('heartbreaker', 'Heartbreaker', 'Lose all hearts in one day', '💔', 'special', 'hearts_lost_day', 5, 20, 'common', 56),
('heart_guardian', 'Heart Guardian', 'Go a week without losing a heart', '💖', 'special', 'no_hearts_lost', 7, 100, 'rare', 57),
('phoenix', 'Phoenix', 'Recover from 0 hearts to full', '🔥', 'special', 'hearts_recovered', 1, 75, 'rare', 58),

-- Social/Community Achievements
('top_10', 'Top 10', 'Reach top 10 on weekly leaderboard', '🏅', 'special', 'leaderboard_rank', 10, 150, 'epic', 60),
('champion', 'Champion', 'Reach #1 on weekly leaderboard', '🥇', 'special', 'leaderboard_rank', 1, 300, 'legendary', 61),
('consistent', 'Consistent', 'Stay in top 50 for 4 weeks', '📊', 'special', 'leaderboard_consistency', 4, 200, 'epic', 62)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward;