import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Join matchmaking queue
router.post('/queue/join', async (req: Request, res: Response) => {
  try {
    const { userId, difficulty, isRanked = true } = req.body;

    // Get user's MMR
    const { data: stats } = await supabase
      .from('battle_stats')
      .select('mmr')
      .eq('user_id', userId)
      .single();

    const userMmr = stats?.mmr || 1000;

    // Check if already in queue
    const { data: existing } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'searching')
      .single();

    if (existing) {
      return res.json({ message: 'Already in queue', queueEntry: existing });
    }

    // Add to queue
    const { data: queueEntry, error } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: userId,
        mmr: userMmr,
        difficulty,
        preferred_race_id: null,
        status: 'searching',
        is_ranked: isRanked,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Joined matchmaking queue', queueEntry });
  } catch (error: any) {
    console.error('Error joining queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check queue status and find match
router.get('/queue/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user's queue entry
    const { data: userQueue } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'searching')
      .single();

    if (!userQueue) {
      return res.json({ inQueue: false, matched: false });
    }

    // Check if already matched
    if (userQueue.status === 'matched') {
      return res.json({ inQueue: true, matched: true, matchId: userQueue.id });
    }

    // Look for opponent (±100 MMR range, ignore difficulty - MMR-based matching)
    const { data: opponents } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'searching')
      .neq('user_id', userId)
      .gte('mmr', userQueue.mmr - 100)
      .lte('mmr', userQueue.mmr + 100)
      .order('created_at', { ascending: true })
      .limit(1);

    if (opponents && opponents.length > 0) {
      const opponent = opponents[0];

      // Select race based on average MMR
      const avgMmr = (userQueue.mmr + opponent.mmr) / 2;
      let difficulty = 'medium';
      let races: any[] = [];

      if (avgMmr < 900) {
        difficulty = 'easy';
        races = [
          { id: 'easy-1', start: 'Water', end: 'Ocean', optimalPath: 3 },
          { id: 'easy-2', start: 'Sun', end: 'Solar System', optimalPath: 2 },
          { id: 'easy-3', start: 'Dog', end: 'Wolf', optimalPath: 2 }
        ];
      } else if (avgMmr < 1100) {
        difficulty = 'medium';
        races = [
          { id: 'medium-1', start: 'Pizza', end: 'Italy', optimalPath: 3 },
          { id: 'medium-2', start: 'Guitar', end: 'Music', optimalPath: 2 },
          { id: 'medium-3', start: 'Coffee', end: 'Brazil', optimalPath: 3 }
        ];
      } else {
        difficulty = 'hard';
        races = [
          { id: 'hard-1', start: 'Mathematics', end: 'Pizza', optimalPath: 5 },
          { id: 'hard-2', start: 'Ancient Egypt', end: 'Computer', optimalPath: 6 },
          { id: 'hard-3', start: 'Philosophy', end: 'Technology', optimalPath: 5 }
        ];
      }

      const selectedRace = races[Math.floor(Math.random() * races.length)];

      // Create battle match
      const { data: match, error: matchError } = await supabase
        .from('battle_matches')
        .insert({
          match_type: 'pvp',
          race_id: selectedRace.id,
          start_article: selectedRace.start,
          end_article: selectedRace.end,
          difficulty,
          player1_id: userId,
          player1_mmr: userQueue.mmr,
          player2_id: opponent.user_id,
          player2_mmr: opponent.mmr,
          player2_is_bot: false,
          is_ranked: userQueue.is_ranked || true,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Update both queue entries to matched
      await supabase
        .from('matchmaking_queue')
        .update({ status: 'matched' })
        .in('user_id', [userId, opponent.user_id]);

      return res.json({
        inQueue: true,
        matched: true,
        match,
        opponent: { userId: opponent.user_id, mmr: opponent.mmr }
      });
    }

    // Still searching
    res.json({ inQueue: true, matched: false, waitTime: Math.floor((Date.now() - new Date(userQueue.created_at).getTime()) / 1000) });
  } catch (error: any) {
    console.error('Error checking queue status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel matchmaking
router.post('/queue/cancel', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    await supabase
      .from('matchmaking_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'searching');

    res.json({ message: 'Left matchmaking queue' });
  } catch (error: any) {
    console.error('Error canceling queue:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
