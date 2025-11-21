-- Create daily_challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    challenges JSONB NOT NULL,
    completed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Add missing columns to articles table if they don't exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 1;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to quiz_attempts table if they don't exist
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 3;

-- Create a proper categories mapping table
CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest_progress table for the quest mode
CREATE TABLE IF NOT EXISTS quest_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quest_id VARCHAR(100) NOT NULL,
    current_stage INTEGER DEFAULT 1,
    completed_stages INTEGER[] DEFAULT '{}',
    total_xp_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, quest_id)
);

-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL,
    stages JSONB NOT NULL,
    total_xp_reward INTEGER NOT NULL,
    prerequisites VARCHAR(100)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample quests
INSERT INTO quests (id, name, description, difficulty, stages, total_xp_reward, prerequisites) VALUES
(
    'beginner_journey',
    'The Knowledge Seeker',
    'Begin your journey through human knowledge. Start with fundamental concepts.',
    'beginner',
    '[
        {
            "stage": 1,
            "title": "The Basics of Science",
            "description": "Learn about fundamental scientific concepts",
            "articles": ["Atom", "Water", "Photosynthesis"],
            "xp_reward": 50
        },
        {
            "stage": 2,
            "title": "World Geography",
            "description": "Explore the continents and oceans",
            "articles": ["Earth", "Continent", "Ocean"],
            "xp_reward": 60
        },
        {
            "stage": 3,
            "title": "Ancient Civilizations",
            "description": "Discover the roots of human civilization",
            "articles": ["Ancient Egypt", "Ancient Greece", "Roman Empire"],
            "xp_reward": 70
        }
    ]'::jsonb,
    180,
    '{}'
),
(
    'science_explorer',
    'The Scientific Method',
    'Dive deeper into the world of science and discovery.',
    'intermediate',
    '[
        {
            "stage": 1,
            "title": "Physics Fundamentals",
            "description": "Understand the laws that govern our universe",
            "articles": ["Newton''s laws of motion", "Gravity", "Energy"],
            "xp_reward": 80
        },
        {
            "stage": 2,
            "title": "Chemistry Basics",
            "description": "Explore the building blocks of matter",
            "articles": ["Periodic table", "Chemical reaction", "Molecule"],
            "xp_reward": 90
        },
        {
            "stage": 3,
            "title": "Biology Essentials",
            "description": "Learn about life and living organisms",
            "articles": ["Cell", "DNA", "Evolution"],
            "xp_reward": 100
        }
    ]'::jsonb,
    270,
    '{"beginner_journey"}'
),
(
    'history_master',
    'Through the Ages',
    'Journey through human history from ancient to modern times.',
    'advanced',
    '[
        {
            "stage": 1,
            "title": "Medieval Period",
            "description": "Explore the Middle Ages",
            "articles": ["Middle Ages", "Crusades", "Black Death"],
            "xp_reward": 100
        },
        {
            "stage": 2,
            "title": "Renaissance and Enlightenment",
            "description": "Witness the rebirth of knowledge",
            "articles": ["Renaissance", "Age of Enlightenment", "Scientific Revolution"],
            "xp_reward": 120
        },
        {
            "stage": 3,
            "title": "Modern History",
            "description": "Understand the shaping of the modern world",
            "articles": ["World War I", "World War II", "Cold War"],
            "xp_reward": 150
        }
    ]'::jsonb,
    370,
    '{"beginner_journey"}'
) ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON daily_challenges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_article ON article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_user ON quest_progress(user_id);