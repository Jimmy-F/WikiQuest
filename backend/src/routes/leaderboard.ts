import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get leaderboard for a specific period
router.get('/:periodType', async (req: Request, res: Response) => {
  try {
    const { periodType } = req.params;
    const { limit = 100, userId } = req.query;

    // Validate period type
    if (!['daily', 'weekly', 'monthly', 'all_time'].includes(periodType)) {
      return res.status(400).json({ error: 'Invalid period type. Must be one of: daily, weekly, monthly, all_time' });
    }

    // Get current period dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let startDate = today;

    if (periodType === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      startDate = weekStart.toISOString().split('T')[0];
    } else if (periodType === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = monthStart.toISOString().split('T')[0];
    } else if (periodType === 'all_time') {
      startDate = '2000-01-01';
    }

    // Get leaderboard entries for the current period
    const { data: entries, error } = await supabase
      .from('leaderboard')
      .select(`
        *,
        users (
          id,
          username,
          display_name,
          current_level
        )
      `)
      .eq('period_type', periodType)
      .gte('period_start', startDate)
      .lte('period_end', today)
      .order('rank', { ascending: true })
      .limit(Number(limit));

    if (error) throw error;

    // If userId is provided, get their rank and stats
    let userRank = null;
    if (userId) {
      const { data: userEntry } = await supabase
        .from('leaderboard')
        .select(`
          *,
          users (
            id,
            username,
            display_name,
            current_level
          )
        `)
        .eq('period_type', periodType)
        .gte('period_start', startDate)
        .lte('period_end', today)
        .eq('user_id', userId)
        .single();

      userRank = userEntry;
    }

    res.json({
      periodType,
      startDate,
      endDate: today,
      entries: entries || [],
      totalEntries: entries?.length || 0,
      userRank,
      topUser: entries?.[0] || null
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's ranking across all periods
router.get('/user/:userId/ranks', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get rankings for all periods
    const periods = ['daily', 'weekly', 'monthly', 'all_time'];
    const rankings: any = {};

    for (const period of periods) {
      let startDate = today;

      if (period === 'weekly') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        startDate = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
      } else if (period === 'all_time') {
        startDate = '2000-01-01';
      }

      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('period_type', period)
        .gte('period_start', startDate)
        .lte('period_end', today)
        .eq('user_id', userId)
        .single();

      rankings[period] = data || null;
    }

    res.json({
      userId,
      rankings,
      hasRankings: Object.values(rankings).some(r => r !== null)
    });
  } catch (error: any) {
    console.error('Error fetching user rankings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top performers by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    // Get users who have excelled in this category
    const { data: articles, error } = await supabase
      .from('articles')
      .select('user_id, wikipedia_categories, xp_earned')
      .eq('completed', true);

    if (error) throw error;

    // Filter and aggregate by category
    const userStats: any = {};

    articles?.forEach(article => {
      const categories = article.wikipedia_categories || [];
      if (categories.some((c: string) => c.toLowerCase().includes(category.toLowerCase()))) {
        if (!userStats[article.user_id]) {
          userStats[article.user_id] = {
            user_id: article.user_id,
            articles_count: 0,
            total_xp: 0
          };
        }
        userStats[article.user_id].articles_count++;
        userStats[article.user_id].total_xp += article.xp_earned || 0;
      }
    });

    // Convert to array and sort
    const leaderboard = Object.values(userStats)
      .sort((a: any, b: any) => b.total_xp - a.total_xp)
      .slice(0, Number(limit));

    // Get user details
    for (const entry of leaderboard as any[]) {
      const { data: user } = await supabase
        .from('users')
        .select('id, username, display_name, current_level')
        .eq('id', entry.user_id)
        .single();

      entry.user = user;
    }

    res.json({
      category,
      leaderboard,
      totalUsers: leaderboard.length
    });
  } catch (error: any) {
    console.error('Error fetching category leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical rankings for a user
router.get('/user/:userId/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { periodType = 'weekly', limit = 12 } = req.query;

    // Get historical rankings
    const { data: history, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .order('period_end', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    // Calculate trends
    const trends = {
      rankTrend: history && history.length >= 2
        ? history[0].rank - history[1].rank
        : 0,
      xpTrend: history && history.length >= 2
        ? ((history[0].xp_earned - history[1].xp_earned) / history[1].xp_earned) * 100
        : 0
    };

    res.json({
      userId,
      periodType,
      history: history || [],
      trends
    });
  } catch (error: any) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;