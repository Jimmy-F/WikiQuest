import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get due reviews for a user
router.get('/due', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('review_schedule')
      .select('*, articles(*)')
      .eq('user_id', userId)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });

    if (error) throw error;

    res.json({
      reviews: data,
      count: data.length
    });
  } catch (error: any) {
    console.error('Error fetching due reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a review
router.post('/:articleId/complete', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { userId, score } = req.body;

    // SM-2 algorithm implementation
    const { data: review } = await supabase
      .from('review_schedule')
      .select('*')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .single();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Calculate new values based on SM-2
    let newEF = review.easiness_factor;
    let newInterval = review.interval_days;
    let newRepetitions = review.repetitions;

    if (score >= 60) {
      // Correct response
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(review.interval_days * newEF);
      }
      newRepetitions++;
    } else {
      // Incorrect - reset
      newRepetitions = 0;
      newInterval = 1;
    }

    // Update EF
    const quality = score / 20 - 1; // Convert to 0-5 scale
    newEF = newEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF);

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update review schedule
    const { data, error } = await supabase
      .from('review_schedule')
      .update({
        easiness_factor: newEF,
        interval_days: newInterval,
        repetitions: newRepetitions,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        last_reviewed_at: new Date().toISOString(),
        last_score: score
      })
      .eq('id', review.id)
      .select()
      .single();

    if (error) throw error;

    // Award XP for review
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: 15,
      reason: 'review_completed',
      article_id: articleId
    });

    res.json({
      message: 'Review completed! +15 XP 🎉',
      nextReviewDate,
      xpEarned: 15
    });
  } catch (error: any) {
    console.error('Error completing review:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
