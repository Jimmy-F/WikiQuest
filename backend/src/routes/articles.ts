import { Router, Request, Response } from 'express';
import { supabase } from '../server';
import { checkAllAchievements } from '../services/achievementService';

const router = Router();

// Start tracking an article
router.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      wikipediaUrl,
      wikipediaTitle,
      wikipediaCategories,
      totalParagraphs
    } = req.body;

    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .eq('wikipedia_url', wikipediaUrl)
      .single();

    if (existing) {
      // Update visit count and last accessed
      const { data: updated, error: updateError } = await supabase
        .from('articles')
        .update({
          last_accessed: new Date().toISOString(),
          visit_count: (existing.visit_count || 0) + 1
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.json({
        message: 'Article already tracked',
        article: updated
      });
    }

    // Create new article
    const { data, error } = await supabase
      .from('articles')
      .insert({
        user_id: userId,
        wikipedia_url: wikipediaUrl,
        wikipedia_title: wikipediaTitle,
        wikipedia_categories: wikipediaCategories || [],
        total_paragraphs: totalParagraphs
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Article tracking started',
      article: data
    });
  } catch (error: any) {
    console.error('Error starting article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update reading progress
router.patch('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paragraphsRead, readingTimeSeconds } = req.body;

    const { data, error } = await supabase
      .from('articles')
      .update({
        paragraphs_read: paragraphsRead,
        reading_time_seconds: readingTimeSeconds
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Progress updated',
      article: data
    });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete an article with quiz
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { userId, article, questId, golden, score } = req.body;

    // Track in article_reads table if it exists
    try {
      await supabase
        .from('article_reads')
        .insert({
          user_id: userId,
          article_title: article,
          read_at: new Date().toISOString(),
          quiz_score: score,
          golden_completion: golden
        });
    } catch (err) {
      console.log('Could not track in article_reads:', err);
    }

    // Update user stats
    const { data: userData } = await supabase
      .from('users')
      .select('articles_read, total_xp')
      .eq('id', userId)
      .single();

    if (userData) {
      const xpGained = golden ? 20 : 10; // Bonus XP for golden completion

      await supabase
        .from('users')
        .update({
          articles_read: (userData.articles_read || 0) + 1,
          total_xp: (userData.total_xp || 0) + xpGained
        })
        .eq('id', userId);
    }

    res.json({
      success: true,
      message: golden ? 'Golden completion! 🏆' : 'Article completed! ✅',
      xpGained: golden ? 20 : 10,
      score
    });
  } catch (error: any) {
    console.error('Error completing article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete an article (old version)
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, comprehensionScore } = req.body;

    // Update article as completed
    const { data: article, error } = await supabase
      .from('articles')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        comprehension_score: comprehensionScore,
        xp_earned: 10 // Base XP for reading an article
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Award XP to user
    await supabase.rpc('add_xp', {
      p_user_id: userId,
      p_amount: 10,
      p_reason: 'article_read',
      p_article_id: id
    });

    // Create XP transaction
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: 10,
      reason: 'article_read',
      article_id: id
    });

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('increment_daily_stat', {
      p_user_id: userId,
      p_date: today,
      p_stat_name: 'articles_read'
    });

    // Check for achievement unlocks
    const achievementResult = await checkAllAchievements(userId, {
      readingTime: article.reading_time_seconds
    });

    res.json({
      message: 'Article completed! +10 XP 🎉',
      article,
      xpEarned: 10,
      achievements: achievementResult.newUnlocks,
      achievementMessage: achievementResult.message
    });
  } catch (error: any) {
    console.error('Error completing article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's reading history with enhanced stats
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    // Get articles with quiz attempts
    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        *,
        quiz_attempts (
          score,
          total_questions,
          xp_earned,
          attempted_at
        )
      `)
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    // Calculate stats for each article
    const articlesWithStats = articles?.map(article => {
      const quizzes = article.quiz_attempts || [];
      const bestQuiz = quizzes.reduce((best: any, quiz: any) => {
        const percentage = (quiz.score / quiz.total_questions) * 100;
        return percentage > (best?.percentage || 0) ? { ...quiz, percentage } : best;
      }, null);

      return {
        ...article,
        completion_percentage: article.total_paragraphs > 0
          ? Math.round((article.paragraphs_read / article.total_paragraphs) * 100)
          : 0,
        best_quiz_score: bestQuiz?.percentage || 0,
        total_xp_earned: quizzes.reduce((sum: number, q: any) => sum + (q.xp_earned || 0), 0),
        quiz_count: quizzes.length
      };
    });

    res.json({
      articles: articlesWithStats || [],
      count: articlesWithStats?.length || 0
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reading statistics
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId);

    if (articlesError) throw articlesError;

    // Get quiz stats
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId);

    if (quizzesError) throw quizzesError;

    // Calculate category stats
    const categoryCount: Record<string, number> = {};
    articles?.forEach(article => {
      (article.wikipedia_categories || []).forEach((cat: string) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Calculate reading streak
    const uniqueDays = new Set(
      articles?.map(a => new Date(a.last_accessed || a.created_at).toDateString()) || []
    );

    // Calculate stats
    const stats = {
      total_articles: articles?.length || 0,
      total_reading_time: Math.round((articles?.reduce((sum, a) => sum + (a.reading_time_seconds || 0), 0) || 0) / 60), // in minutes
      total_quizzes: quizzes?.length || 0,
      average_quiz_score: quizzes?.length
        ? Math.round(quizzes.reduce((sum, q) => sum + ((q.score / q.total_questions) * 100), 0) / quizzes.length)
        : 0,
      favorite_categories: topCategories,
      unique_reading_days: uniqueDays.size,
      articles_this_week: articles?.filter(a => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(a.last_accessed || a.created_at) > weekAgo;
      }).length || 0
    };

    res.json({ stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific article
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ article: data });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
