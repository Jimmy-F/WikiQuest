import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Challenge templates
const CHALLENGE_TEMPLATES = [
  {
    type: 'articles_read',
    title: 'Knowledge Explorer',
    description: 'Read {target} articles today',
    icon: '📚',
    targets: [3, 5, 7],
    xp_rewards: [30, 50, 100]
  },
  {
    type: 'perfect_quiz',
    title: 'Quiz Master',
    description: 'Score 100% on {target} quizzes',
    icon: '💯',
    targets: [1, 2, 3],
    xp_rewards: [40, 80, 150]
  },
  {
    type: 'category_explorer',
    title: 'Topic Adventurer',
    description: 'Read articles from {target} different categories',
    icon: '🗺️',
    targets: [2, 3, 5],
    xp_rewards: [35, 60, 120]
  },
  {
    type: 'reading_time',
    title: 'Dedicated Reader',
    description: 'Spend {target} minutes reading',
    icon: '⏱️',
    targets: [10, 20, 30],
    xp_rewards: [25, 50, 100]
  },
  {
    type: 'streak_builder',
    title: 'Consistency Champion',
    description: 'Maintain a {target} day reading streak',
    icon: '🔥',
    targets: [3, 5, 7],
    xp_rewards: [50, 100, 200]
  },
  {
    type: 'science_focus',
    title: 'Science Scholar',
    description: 'Read {target} science articles',
    icon: '🔬',
    targets: [2, 3, 5],
    xp_rewards: [35, 60, 110]
  },
  {
    type: 'history_buff',
    title: 'History Buff',
    description: 'Read {target} history articles',
    icon: '📜',
    targets: [2, 3, 5],
    xp_rewards: [35, 60, 110]
  },
  {
    type: 'quiz_streak',
    title: 'Quiz Streak',
    description: 'Answer {target} quiz questions correctly in a row',
    icon: '⚡',
    targets: [5, 10, 15],
    xp_rewards: [30, 60, 120]
  }
];

// Generate daily challenges for a user
function generateDailyChallenges(userLevel: number = 1): any[] {
  const challenges = [];
  const templates = [...CHALLENGE_TEMPLATES];

  // Pick 3 random challenges
  for (let i = 0; i < 3 && templates.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * templates.length);
    const template = templates.splice(randomIndex, 1)[0];

    // Select difficulty based on user level
    const difficultyIndex = Math.min(Math.floor((userLevel - 1) / 5), 2);
    const target = template.targets[difficultyIndex];
    const xpReward = template.xp_rewards[difficultyIndex];

    challenges.push({
      type: template.type,
      title: template.title,
      description: template.description.replace('{target}', String(target)),
      icon: template.icon,
      target,
      xp_reward: xpReward,
      progress: 0,
      completed: false,
      difficulty: ['easy', 'medium', 'hard'][difficultyIndex]
    });
  }

  return challenges;
}

// Get today's challenges for a user
router.get('/daily/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Check if challenges already exist for today
    const { data: existing, error: existingError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing && !existingError) {
      return res.json({ challenges: existing.challenges });
    }

    // Get user level
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('current_level')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Generate new challenges
    const challenges = generateDailyChallenges(user?.current_level || 1);

    // Save challenges
    const { data: saved, error: saveError } = await supabase
      .from('daily_challenges')
      .insert({
        user_id: userId,
        date: today,
        challenges,
        completed_count: 0
      })
      .select()
      .single();

    if (saveError) throw saveError;

    res.json({ challenges });
  } catch (error: any) {
    console.error('Error getting daily challenges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update challenge progress
router.patch('/progress/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { challengeType, increment = 1 } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Get current challenges
    const { data: current, error: getError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (getError) throw getError;

    // Update progress for matching challenge
    const updatedChallenges = current.challenges.map((challenge: any) => {
      if (challenge.type === challengeType && !challenge.completed) {
        challenge.progress = Math.min(challenge.progress + increment, challenge.target);

        // Check if completed
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
          challenge.completed_at = new Date().toISOString();
        }
      }
      return challenge;
    });

    // Count completed
    const completedCount = updatedChallenges.filter((c: any) => c.completed).length;

    // Update in database
    const { data: updated, error: updateError } = await supabase
      .from('daily_challenges')
      .update({
        challenges: updatedChallenges,
        completed_count: completedCount
      })
      .eq('user_id', userId)
      .eq('date', today)
      .select()
      .single();

    if (updateError) throw updateError;

    // Award XP for completed challenges
    const newlyCompleted = updatedChallenges.filter((c: any) =>
      c.completed && c.completed_at === new Date().toISOString()
    );

    for (const challenge of newlyCompleted) {
      // Award XP
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const newTotalXp = (user.total_xp || 0) + challenge.xp_reward;
      const newLevel = Math.floor(newTotalXp / 100) + 1;

      await supabase
        .from('users')
        .update({
          total_xp: newTotalXp,
          current_level: newLevel
        })
        .eq('id', userId);

      // Log XP transaction
      await supabase.from('xp_transactions').insert({
        user_id: userId,
        amount: challenge.xp_reward,
        reason: `challenge_${challenge.type}`,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      challenges: updatedChallenges,
      completed_count: completedCount,
      xp_earned: newlyCompleted.reduce((sum: number, c: any) => sum + c.xp_reward, 0)
    });
  } catch (error: any) {
    console.error('Error updating challenge progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get challenge history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 7 } = req.query;

    const { data: history, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ history: history || [] });
  } catch (error: any) {
    console.error('Error fetching challenge history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;