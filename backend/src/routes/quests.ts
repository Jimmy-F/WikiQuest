import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Quest definitions with progressive difficulty
const QUEST_LIBRARY = [
  {
    id: 'beginner_journey',
    name: 'The Knowledge Seeker',
    description: 'Begin your journey through human knowledge. Start with fundamental concepts that everyone should know.',
    difficulty: 'beginner',
    icon: '🌱',
    stages: [
      {
        stage: 1,
        title: 'First Steps',
        description: 'Start with the absolute basics',
        story: 'Every journey begins with a single step. Let\'s start with the simplest concepts.',
        articles: ['Water', 'Air', 'Fire'],
        xp_reward: 30,
        badge: '💧',
        icon: '🚶'
      },
      {
        stage: 2,
        title: 'Building Blocks',
        description: 'Understand what everything is made of',
        story: 'Now let\'s dive deeper into what makes up our world.',
        articles: ['Atom', 'Molecule', 'Element'],
        xp_reward: 40,
        badge: '⚛️',
        icon: '🧱'
      },
      {
        stage: 3,
        title: 'Life Basics',
        description: 'How does life work?',
        story: 'Life is all around us. Let\'s understand its fundamentals.',
        articles: ['Cell', 'DNA', 'Photosynthesis'],
        xp_reward: 40,
        badge: '🌿',
        icon: '🌱'
      },
      {
        stage: 4,
        title: 'Forces of Nature',
        description: 'Discover the forces that shape our world',
        story: 'Invisible forces govern everything. Time to understand them.',
        articles: ['Gravity', 'Energy', 'Light'],
        xp_reward: 50,
        badge: '⚡',
        icon: '🌪️'
      },
      {
        stage: 5,
        title: 'Our Planet',
        description: 'Explore Earth, our home',
        story: 'Let\'s explore the planet we call home.',
        articles: ['Earth', 'Atmosphere', 'Climate'],
        xp_reward: 50,
        badge: '🌍',
        icon: '🌏'
      },
      {
        stage: 6,
        title: 'Land and Sea',
        description: 'Discover Earth\'s geography',
        story: 'From the highest peaks to the deepest oceans.',
        articles: ['Continent', 'Ocean', 'Island'],
        xp_reward: 60,
        badge: '🗺️',
        icon: '⛰️'
      },
      {
        stage: 7,
        title: 'Ancient Beginnings',
        description: 'Where civilization began',
        story: 'Journey back to where human civilization first emerged.',
        articles: ['Mesopotamia', 'Ancient Egypt', 'Indus Valley Civilisation'],
        xp_reward: 70,
        badge: '🏺',
        icon: '🏛️'
      },
      {
        stage: 8,
        title: 'Classical World',
        description: 'The foundations of Western civilization',
        story: 'Explore the civilizations that shaped the modern world.',
        articles: ['Ancient Greece', 'Roman Empire', 'Byzantine Empire'],
        xp_reward: 80,
        badge: '🏛️',
        icon: '⚔️'
      }
    ],
    total_xp_reward: 420,
    completion_badge: '👑',
    next_quest: 'intermediate_explorer'
  },
  {
    id: 'intermediate_explorer',
    name: 'The Scholar\'s Path',
    description: 'Deepen your understanding with more complex topics across multiple disciplines.',
    difficulty: 'intermediate',
    icon: '📚',
    stages: [
      {
        stage: 1,
        title: 'Scientific Revolution',
        description: 'Explore the discoveries that changed our understanding',
        story: 'The Renaissance brought a new way of thinking. Discover the minds that revolutionized science.',
        articles: ['Isaac Newton', 'Galileo Galilei', 'Scientific method', 'Telescope', 'Microscope'],
        xp_reward: 80,
        badge: '🔬'
      },
      {
        stage: 2,
        title: 'World Wars and Peace',
        description: 'Understand the conflicts that shaped the modern world',
        story: 'The 20th century brought unprecedented conflict and change. Learn from history\'s darkest hours.',
        articles: ['World War I', 'World War II', 'United Nations', 'Cold War', 'Berlin Wall'],
        xp_reward: 90,
        badge: '🕊️'
      },
      {
        stage: 3,
        title: 'Technological Revolution',
        description: 'From industrial to digital age',
        story: 'Witness humanity\'s greatest leap forward - the age of technology.',
        articles: ['Industrial Revolution', 'Computer', 'Internet', 'Artificial intelligence', 'Space exploration'],
        xp_reward: 100,
        badge: '🚀'
      }
    ],
    total_xp_reward: 270,
    completion_badge: '🎓',
    prerequisites: ['beginner_journey'],
    next_quest: 'advanced_master'
  },
  {
    id: 'advanced_master',
    name: 'The Master\'s Challenge',
    description: 'Master complex topics and become a true knowledge champion.',
    difficulty: 'advanced',
    icon: '🏆',
    stages: [
      {
        stage: 1,
        title: 'Quantum Realm',
        description: 'Dive into the mysteries of quantum physics',
        story: 'At the smallest scales, reality behaves in ways that defy intuition.',
        articles: ['Quantum mechanics', 'Schrödinger\'s cat', 'Quantum entanglement', 'Heisenberg uncertainty principle', 'Wave–particle duality'],
        xp_reward: 120,
        badge: '🌌'
      },
      {
        stage: 2,
        title: 'Philosophy of Mind',
        description: 'Explore consciousness and the nature of thought',
        story: 'What is consciousness? What makes you, you? Dive into humanity\'s deepest questions.',
        articles: ['Consciousness', 'Philosophy of mind', 'Artificial consciousness', 'Free will', 'Mind–body problem'],
        xp_reward: 130,
        badge: '🧠'
      },
      {
        stage: 3,
        title: 'Future of Humanity',
        description: 'Explore what lies ahead for our species',
        story: 'The final frontier - not just space, but the future of humanity itself.',
        articles: ['Climate change', 'Genetic engineering', 'Transhumanism', 'Space colonization', 'Technological singularity'],
        xp_reward: 150,
        badge: '🔮'
      }
    ],
    total_xp_reward: 400,
    completion_badge: '💎',
    prerequisites: ['intermediate_explorer']
  }
];

// Get available quests for a user
router.get('/available/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // For now, return all quests since quest_progress table might not exist yet
    // In production, check user's completed quests
    res.json({ quests: QUEST_LIBRARY });
  } catch (error: any) {
    console.error('Error fetching available quests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active quests
router.get('/', async (req: Request, res: Response) => {
  try {
    // Return the quest library
    res.json({ quests: QUEST_LIBRARY });
  } catch (error: any) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user quest progress
router.get('/progress/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // For now return empty progress since tables might not exist
    // In production, fetch from quest_progress table
    res.json({
      progress: [],
      active_quests: []
    });
  } catch (error: any) {
    console.error('Error fetching quest progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start a quest
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, questId } = req.body;

    // Check if quest exists
    const quest = QUEST_LIBRARY.find(q => q.id === questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // For now, just return the quest
    // In production, create progress entry in database
    res.json({
      message: 'Quest started!',
      quest,
      progress: {
        user_id: userId,
        quest_id: questId,
        current_stage: 1,
        completed_stages: [],
        total_xp_earned: 0
      }
    });
  } catch (error: any) {
    console.error('Error starting quest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track article completion for quest progress
router.post('/article-completed', async (req: Request, res: Response) => {
  try {
    const { userId, articleTitle } = req.body;

    console.log(`Quest progress check for user ${userId}: ${articleTitle}`);

    // Get user's active quest progress from database or session
    // For now, we'll check all quests to find if this article is part of any stage
    let questProgress = null;
    let questUpdated = false;

    for (const quest of QUEST_LIBRARY) {
      for (const stage of quest.stages) {
        // Check if the article matches any in the current stage (case-insensitive)
        const hasArticle = stage.articles.some(
          (article: string) => article.toLowerCase() === articleTitle.toLowerCase()
        );

        if (hasArticle) {
          console.log(`Found article "${articleTitle}" in quest "${quest.name}", stage ${stage.stage}: ${stage.title}`);

          // Here you would update the database with the progress
          // For now, we'll just return the match
          questProgress = {
            questId: quest.id,
            questName: quest.name,
            stageNumber: stage.stage,
            stageTitle: stage.title,
            articleCompleted: articleTitle,
            remainingArticles: stage.articles.filter(
              (a: string) => a.toLowerCase() !== articleTitle.toLowerCase()
            ),
            stageComplete: false, // Would check if all articles in stage are complete
            xpEarned: 0 // Would calculate based on completion
          };

          questUpdated = true;
          break;
        }
      }
      if (questUpdated) break;
    }

    if (questProgress) {
      res.json({
        success: true,
        message: `Article "${articleTitle}" completed!`,
        questProgress
      });
    } else {
      res.json({
        success: false,
        message: `Article "${articleTitle}" is not part of any active quest stage`
      });
    }
  } catch (error: any) {
    console.error('Error tracking article completion:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;