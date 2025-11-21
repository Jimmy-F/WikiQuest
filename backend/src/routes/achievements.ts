import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get all achievements
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ achievements: data });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all achievements with user progress
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order');

    if (achievementsError) throw achievementsError;

    // Get user's achievement progress
    const { data: userAchievements, error: userError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (userError) throw userError;

    // Merge achievements with user progress
    const achievementMap = new Map();
    userAchievements?.forEach(ua => {
      achievementMap.set(ua.achievement_id, ua);
    });

    const mergedAchievements = achievements?.map(achievement => {
      const userProgress = achievementMap.get(achievement.id);
      return {
        ...achievement,
        unlocked: userProgress?.unlocked || false,
        progress: userProgress?.progress || 0,
        unlocked_at: userProgress?.unlocked_at || null
      };
    });

    // Group by category
    const groupedAchievements = mergedAchievements?.reduce((acc: any, achievement) => {
      const category = achievement.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(achievement);
      return acc;
    }, {});

    res.json({
      achievements: groupedAchievements || {},
      total: achievements?.length || 0,
      unlocked: userAchievements?.filter(a => a.unlocked).length || 0
    });
  } catch (error: any) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
