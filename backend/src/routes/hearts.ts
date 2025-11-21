import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Get user's heart status
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // First check for heart regeneration
    await checkHeartRegeneration(userId);

    const { data, error } = await supabase
      .from('users')
      .select('hearts, max_hearts, heart_refill_time, last_heart_lost_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Calculate time until next heart
    let timeUntilNextHeart = null;
    if (data.hearts < data.max_hearts && data.heart_refill_time) {
      const nextRefillTime = new Date(data.heart_refill_time);
      nextRefillTime.setHours(nextRefillTime.getHours() + 1);
      timeUntilNextHeart = Math.max(0, nextRefillTime.getTime() - Date.now());
    }

    res.json({
      hearts: data.hearts,
      maxHearts: data.max_hearts,
      timeUntilNextHeart,
      canPlay: data.hearts > 0
    });
  } catch (error: any) {
    console.error('Error fetching hearts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lose a heart (called when quiz score < 75%)
router.post('/lose', async (req: Request, res: Response) => {
  try {
    const { userId, quizId, score } = req.body;

    // Get current hearts
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('hearts, hearts_lost_today')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (userData.hearts <= 0) {
      return res.status(403).json({
        error: 'No hearts remaining',
        message: 'Wait for hearts to regenerate or complete daily challenges',
        heartsRemaining: 0
      });
    }

    // Deduct a heart
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        hearts: userData.hearts - 1,
        last_heart_lost_at: new Date().toISOString(),
        hearts_lost_today: (userData.hearts_lost_today || 0) + 1
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the transaction
    await supabase
      .from('heart_transactions')
      .insert({
        user_id: userId,
        amount: -1,
        reason: 'quiz_failed',
        quiz_id: quizId
      });

    const heartsRemaining = updatedUser.hearts;

    res.json({
      success: true,
      heartsRemaining,
      message: heartsRemaining === 0
        ? 'Last heart lost! No more attempts until refill.'
        : heartsRemaining === 1
        ? 'Careful! Only 1 heart remaining!'
        : `Heart lost! ${heartsRemaining} hearts remaining.`,
      canContinue: heartsRemaining > 0
    });
  } catch (error: any) {
    console.error('Error losing heart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check and regenerate hearts (1 heart per hour)
async function checkHeartRegeneration(userId: string) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('hearts, max_hearts, heart_refill_time')
      .eq('id', userId)
      .single();

    if (error || !user) return;

    // Already at max hearts
    if (user.hearts >= user.max_hearts) return;

    const now = new Date();
    const lastRefill = user.heart_refill_time ? new Date(user.heart_refill_time) : new Date(0);
    const hoursSinceRefill = (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRefill >= 1) {
      const heartsToAdd = Math.min(
        Math.floor(hoursSinceRefill),
        user.max_hearts - user.hearts
      );

      if (heartsToAdd > 0) {
        await supabase
          .from('users')
          .update({
            hearts: user.hearts + heartsToAdd,
            heart_refill_time: now.toISOString()
          })
          .eq('id', userId);

        // Log the regeneration
        await supabase
          .from('heart_transactions')
          .insert({
            user_id: userId,
            amount: heartsToAdd,
            reason: 'time_refill'
          });
      }
    }
  } catch (error) {
    console.error('Error regenerating hearts:', error);
  }
}

// Refill hearts (for purchases or rewards)
router.post('/refill', async (req: Request, res: Response) => {
  try {
    const { userId, amount = 5, reason = 'purchase' } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        hearts: amount,
        heart_refill_time: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the transaction
    await supabase
      .from('heart_transactions')
      .insert({
        user_id: userId,
        amount,
        reason
      });

    res.json({
      success: true,
      hearts: data.hearts,
      message: `Hearts refilled! You now have ${data.hearts} hearts.`
    });
  } catch (error: any) {
    console.error('Error refilling hearts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get heart transaction history
router.get('/:userId/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('heart_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ transactions: data || [] });
  } catch (error: any) {
    console.error('Error fetching heart history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;