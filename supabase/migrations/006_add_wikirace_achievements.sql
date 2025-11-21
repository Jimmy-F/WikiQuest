-- Add Wiki Race Achievements
INSERT INTO achievements (key, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity, sort_order) VALUES
-- First Race
('first_race', 'Race Debut', 'Complete your first Wiki Race', '🏁', 'wikirace', 'races_completed', 1, 25, 'common', 100),

-- Race Completion Milestones
('racer_10', 'Amateur Racer', 'Complete 10 Wiki Races', '🏎️', 'wikirace', 'races_completed', 10, 100, 'common', 101),
('racer_25', 'Pro Racer', 'Complete 25 Wiki Races', '🏆', 'wikirace', 'races_completed', 25, 250, 'rare', 102),
('racer_50', 'Expert Racer', 'Complete 50 Wiki Races', '🥇', 'wikirace', 'races_completed', 50, 500, 'epic', 103),
('racer_100', 'Racing Legend', 'Complete 100 Wiki Races', '👑', 'wikirace', 'races_completed', 100, 1000, 'legendary', 104),

-- Medal Achievements
('gold_medal', 'Golden Touch', 'Win a gold medal in any race', '🥇', 'wikirace', 'gold_medals', 1, 50, 'common', 110),
('gold_10', 'Gold Standard', 'Win 10 gold medals', '🌟', 'wikirace', 'gold_medals', 10, 250, 'rare', 111),
('gold_25', 'Golden Champion', 'Win 25 gold medals', '⭐', 'wikirace', 'gold_medals', 25, 500, 'epic', 112),

-- Speed Achievements
('speedster', 'Speedster', 'Complete a race in under 60 seconds', '⚡', 'wikirace', 'speed_record', 60, 100, 'rare', 120),
('lightning_fast', 'Lightning Fast', 'Complete a race in under 30 seconds', '🌩️', 'wikirace', 'speed_record', 30, 250, 'epic', 121),

-- Efficiency Achievements
('efficient_5', 'Pathfinder', 'Complete 5 races at optimal path', '🎯', 'wikirace', 'optimal_races', 5, 150, 'rare', 130),
('efficient_20', 'Perfect Navigator', 'Complete 20 races at optimal path', '🧭', 'wikirace', 'optimal_races', 20, 500, 'epic', 131),

-- Difficulty Achievements
('easy_master', 'Easy Master', 'Complete all easy races with gold', '🎓', 'wikirace', 'difficulty_master_easy', 3, 100, 'common', 140),
('medium_master', 'Medium Master', 'Complete all medium races with gold', '🏅', 'wikirace', 'difficulty_master_medium', 3, 200, 'rare', 141),
('hard_master', 'Hard Master', 'Complete all hard races with gold', '💪', 'wikirace', 'difficulty_master_hard', 3, 400, 'epic', 142),
('expert_master', 'Expert Master', 'Complete all expert races with gold', '🧠', 'wikirace', 'difficulty_master_expert', 3, 800, 'legendary', 143),

-- Special Achievements
('perfect_score', 'Perfectionist', 'Score 100/100 in any race', '💯', 'wikirace', 'perfect_score', 1, 100, 'rare', 150),
('comeback', 'Comeback King', 'Win a race after taking more than 2x optimal clicks', '↩️', 'wikirace', 'custom', 1, 150, 'rare', 151),
('explorer', 'Wiki Explorer', 'Complete races in all difficulty levels', '🗺️', 'wikirace', 'all_difficulties', 4, 200, 'rare', 152);
