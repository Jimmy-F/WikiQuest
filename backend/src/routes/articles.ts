import { Router, Request, Response } from 'express';
import { supabase } from '../server';

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
      return res.json({
        message: 'Article already tracked',
        article: existing
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

// Complete an article
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
    // TODO: Implement achievement checking logic

    res.json({
      message: 'Article completed! +10 XP 🎉',
      article,
      xpEarned: 10
    });
  } catch (error: any) {
    console.error('Error completing article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's reading history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    res.json({
      articles: data,
      count: data.length
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
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
