import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get user dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // Get user profile with XP and streak
    const { data: user } = await supabase
      .from('users')
      .select('total_xp, current_level, current_streak, longest_streak')
      .eq('id', userId)
      .single();

    // Get this week's stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weekStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekAgo.toISOString().split('T')[0]);

    // Calculate totals
    const totalArticles = weekStats?.reduce((sum, stat) => sum + stat.articles_read, 0) || 0;
    const totalQuizzes = weekStats?.reduce((sum, stat) => sum + stat.quizzes_completed, 0) || 0;
    const totalXP = weekStats?.reduce((sum, stat) => sum + stat.xp_earned, 0) || 0;

    if (!user) {
      // User doesn't exist yet, return default data
      return res.json({
        user: {
          total_xp: 0,
          current_level: 1,
          current_streak: 0,
          longest_streak: 0,
          xpToNextLevel: 100
        },
        thisWeek: {
          articlesRead: totalArticles,
          quizzesCompleted: totalQuizzes,
          xpEarned: totalXP,
          dailyStats: weekStats || []
        }
      });
    }

    res.json({
      user: {
        ...user,
        xpToNextLevel: ((user.current_level) * 100) - user.total_xp
      },
      thisWeek: {
        articlesRead: totalArticles,
        quizzesCompleted: totalQuizzes,
        xpEarned: totalXP,
        dailyStats: weekStats || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get category mastery
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('category_mastery')
      .select('*')
      .eq('user_id', userId)
      .order('articles_read', { ascending: false });

    if (error) throw error;

    res.json({ categories: data });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
