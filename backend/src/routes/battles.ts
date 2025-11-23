import { Router, Request, Response } from 'express';
import { supabase } from '../server';
import { WikiRaceBot } from '../services/botService';

const router = Router();

// Get player's battle stats
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('battle_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching battle stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get battle leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('battle_stats')
      .select(`
        *,
        users!inner(id, email)
      `)
      .order('mmr', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ leaderboard: data });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a battle vs bot
router.post('/vs-bot', async (req: Request, res: Response) => {
  try {
    const { userId, raceId, startArticle, endArticle, difficulty } = req.body;

    // Get user's MMR
    const { data: userStats } = await supabase
      .from('battle_stats')
      .select('mmr')
      .eq('user_id', userId)
      .single();

    const userMmr = userStats?.mmr || 1000;

    // Select bot difficulty based on user MMR
    const botDifficulty = selectBotDifficulty(userMmr);

    // Create battle match
    const { data: match, error } = await supabase
      .from('battle_matches')
      .insert({
        match_type: 'async',
        race_id: raceId,
        start_article: startArticle,
        end_article: endArticle,
        difficulty,
        player1_id: userId,
        player1_mmr: userMmr,
        player2_is_bot: true,
        player2_bot_difficulty: botDifficulty,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      match,
      botDifficulty,
      message: `Battle started vs 🤖 ${botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1)} Bot`
    });
  } catch (error: any) {
    console.error('Error creating bot battle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete player's side of battle
router.post('/:matchId/complete', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { userId, time, clicks, path } = req.body;

    // Get match details
    const { data: match } = await supabase
      .from('battle_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Determine if this user is player1 or player2
    const isPlayer1 = match.player1_id === userId;
    const isPlayer2 = match.player2_id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: 'Not a participant in this match' });
    }

    // Update the correct player's completion
    if (isPlayer1) {
      await supabase
        .from('battle_matches')
        .update({
          player1_time: time,
          player1_clicks: clicks,
          player1_path: path,
          player1_completed_at: new Date().toISOString()
        })
        .eq('id', matchId);
    } else {
      await supabase
        .from('battle_matches')
        .update({
          player2_time: time,
          player2_clicks: clicks,
          player2_path: path,
          player2_completed_at: new Date().toISOString()
        })
        .eq('id', matchId);
    }

    // Reload match to get updated data
    const { data: updatedMatch } = await supabase
      .from('battle_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    // If opponent is a bot, run bot race now
    if (match.player2_is_bot) {
      const bot = new WikiRaceBot(match.player2_bot_difficulty || 'medium');
      const botResult = await bot.raceAgainst(match.start_article, match.end_article);

      // Update bot's completion
      await supabase
        .from('battle_matches')
        .update({
          player2_time: botResult.timeSeconds,
          player2_clicks: botResult.clicks,
          player2_path: botResult.path,
          player2_completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      // Determine winner
      const winner = determineWinner(
        { time, clicks },
        { time: botResult.timeSeconds, clicks: botResult.clicks }
      );

      // Calculate MMR changes only for ranked matches
      const isRanked = match.is_ranked !== false; // Default to true if not set
      const mmrChange = isRanked ? calculateMMRChange(
        match.player1_mmr,
        getBotMMR(match.player2_bot_difficulty || 'medium'),
        winner === 'player1'
      ) : 0;

      // Update match with winner and MMR changes
      await supabase
        .from('battle_matches')
        .update({
          winner_id: winner === 'player1' ? match.player1_id : null,
          is_draw: winner === 'draw',
          player1_mmr_change: mmrChange,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      // Update player's battle stats (only update MMR for ranked)
      await updateBattleStats(match.player1_id, winner === 'player1', winner === 'draw', mmrChange, isRanked);

      // Get updated stats
      const { data: updatedStats } = await supabase
        .from('battle_stats')
        .select('*')
        .eq('user_id', match.player1_id)
        .single();

      return res.json({
        result: winner,
        playerTime: time,
        playerClicks: clicks,
        opponentTime: botResult.timeSeconds,
        opponentClicks: botResult.clicks,
        opponentName: `${match.player2_bot_difficulty} Bot`,
        isBot: true,
        mmrChange,
        newMMR: updatedStats?.mmr,
        newTier: updatedStats?.tier,
        message: winner === 'player1'
          ? `🏆 Victory! You beat the ${match.player2_bot_difficulty} bot!`
          : winner === 'draw'
          ? '🤝 Draw! You tied with the bot!'
          : `💪 Good try! The bot was faster this time.`
      });
    }

    // PvP match - check if both players have finished
    if (!updatedMatch) {
      return res.json({ message: 'Your race completed. Waiting for opponent...' });
    }

    const bothPlayersCompleted = updatedMatch.player1_completed_at && updatedMatch.player2_completed_at;

    if (!bothPlayersCompleted) {
      return res.json({
        message: 'Your race completed. Waiting for opponent...',
        yourTime: isPlayer1 ? updatedMatch.player1_time : updatedMatch.player2_time,
        yourClicks: isPlayer1 ? updatedMatch.player1_clicks : updatedMatch.player2_clicks
      });
    }

    // Both players finished - determine winner
    const winner = determineWinner(
      { time: updatedMatch.player1_time, clicks: updatedMatch.player1_clicks },
      { time: updatedMatch.player2_time, clicks: updatedMatch.player2_clicks }
    );

    // Calculate MMR changes only for ranked matches
    const isRanked = updatedMatch.is_ranked !== false;
    const player1Won = winner === 'player1';
    const player2Won = winner === 'player2';
    const isDraw = winner === 'draw';

    const player1MmrChange = isRanked ? calculateMMRChange(
      updatedMatch.player1_mmr,
      updatedMatch.player2_mmr,
      player1Won
    ) : 0;

    const player2MmrChange = isRanked ? calculateMMRChange(
      updatedMatch.player2_mmr,
      updatedMatch.player1_mmr,
      player2Won
    ) : 0;

    // Update match with results
    await supabase
      .from('battle_matches')
      .update({
        winner_id: isDraw ? null : (player1Won ? updatedMatch.player1_id : updatedMatch.player2_id),
        is_draw: isDraw,
        player1_mmr_change: player1MmrChange,
        player2_mmr_change: player2MmrChange,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', matchId);

    // Update both players' stats
    await updateBattleStats(updatedMatch.player1_id, player1Won, isDraw, player1MmrChange, isRanked);
    await updateBattleStats(updatedMatch.player2_id, player2Won, isDraw, player2MmrChange, isRanked);

    // Get updated stats for the current user
    const { data: updatedStats } = await supabase
      .from('battle_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentPlayerWon = (isPlayer1 && player1Won) || (isPlayer2 && player2Won);
    const mmrChange = isPlayer1 ? player1MmrChange : player2MmrChange;

    res.json({
      result: currentPlayerWon ? 'victory' : isDraw ? 'draw' : 'defeat',
      playerTime: isPlayer1 ? updatedMatch.player1_time : updatedMatch.player2_time,
      playerClicks: isPlayer1 ? updatedMatch.player1_clicks : updatedMatch.player2_clicks,
      opponentTime: isPlayer1 ? updatedMatch.player2_time : updatedMatch.player1_time,
      opponentClicks: isPlayer1 ? updatedMatch.player2_clicks : updatedMatch.player1_clicks,
      opponentName: 'Opponent',
      isBot: false,
      mmrChange,
      newMMR: updatedStats?.mmr,
      newTier: updatedStats?.tier,
      message: currentPlayerWon
        ? '🏆 Victory! You beat your opponent!'
        : isDraw
        ? '🤝 Draw! You tied with your opponent!'
        : '💪 Good effort! Your opponent was faster this time.'
    });
  } catch (error: any) {
    console.error('Error completing battle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get battle history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('battle_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ battles: data });
  } catch (error: any) {
    console.error('Error fetching battle history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active battle
router.get('/active/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('battle_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ activeBattle: data || null });
  } catch (error: any) {
    console.error('Error fetching active battle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update race progress (for PvP)
router.post('/:matchId/update', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { userId, currentArticle, clicks, timeElapsed } = req.body;

    // Get match
    const { data: match } = await supabase
      .from('battle_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Determine which player
    const isPlayer1 = match.player1_id === userId;
    const isPlayer2 = match.player2_id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: 'Not in this match' });
    }

    // Update progress
    const updates: any = {};
    if (isPlayer1) {
      updates.player1_current_article = currentArticle;
      updates.player1_clicks = clicks;
      updates.player1_time = timeElapsed;
      updates.player1_last_update = new Date().toISOString();
    } else {
      updates.player2_current_article = currentArticle;
      updates.player2_clicks = clicks;
      updates.player2_time = timeElapsed;
      updates.player2_last_update = new Date().toISOString();
    }

    const { error } = await supabase
      .from('battle_matches')
      .update(updates)
      .eq('id', matchId);

    if (error) throw error;

    res.json({ message: 'Progress updated' });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forfeit a battle (quit mid-race)
router.post('/:matchId/forfeit', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { userId } = req.body;

    // Get match
    const { data: match } = await supabase
      .from('battle_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Determine which player is forfeiting
    const isPlayer1 = match.player1_id === userId;
    const isPlayer2 = match.player2_id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: 'Not in this match' });
    }

    // Determine winner (opponent wins by forfeit)
    const winnerId = isPlayer1 ? match.player2_id : match.player1_id;
    const loserId = userId;

    // Calculate MMR changes (forfeiter loses more)
    const isRanked = match.is_ranked !== false;
    const forfeitPenalty = isRanked ? -25 : 0; // Bigger penalty for forfeiting
    const opponentGain = isRanked ? 15 : 0;

    // Update match as completed with forfeit
    await supabase
      .from('battle_matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        player1_mmr_change: isPlayer1 ? forfeitPenalty : opponentGain,
        player2_mmr_change: isPlayer2 ? forfeitPenalty : opponentGain
      })
      .eq('id', matchId);

    // Update stats
    await updateBattleStats(loserId, false, false, forfeitPenalty, isRanked);
    await updateBattleStats(winnerId, true, false, opponentGain, isRanked);

    res.json({ message: 'Battle forfeited' });
  } catch (error: any) {
    console.error('Error forfeiting battle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get race progress (for opponent polling)
router.get('/:matchId/progress', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const { data: match, error } = await supabase
      .from('battle_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) throw error;

    res.json({
      player1: {
        currentArticle: match.player1_current_article,
        clicks: match.player1_clicks,
        time: match.player1_time,
        lastUpdate: match.player1_last_update
      },
      player2: {
        currentArticle: match.player2_current_article,
        clicks: match.player2_clicks,
        time: match.player2_time,
        lastUpdate: match.player2_last_update
      },
      status: match.status
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper Functions

function selectBotDifficulty(userMmr: number): string {
  if (userMmr < 500) return 'easy';
  if (userMmr < 1000) return 'medium';
  if (userMmr < 1500) return 'hard';
  if (userMmr < 2000) return 'expert';
  return 'master';
}

function getBotMMR(difficulty: string): number {
  const botMMR: {[key: string]: number} = {
    'easy': 500,
    'medium': 1000,
    'hard': 1500,
    'expert': 2000,
    'master': 2500
  };
  return botMMR[difficulty] || 1000;
}

function determineWinner(
  player1: { time: number; clicks: number },
  player2: { time: number; clicks: number }
): 'player1' | 'player2' | 'draw' {
  // Winner is determined by: 1) Fewer clicks, 2) Faster time (if tied)
  if (player1.clicks < player2.clicks) return 'player1';
  if (player2.clicks < player1.clicks) return 'player2';

  // Clicks are equal, check time
  if (player1.time < player2.time) return 'player1';
  if (player2.time < player1.time) return 'player2';

  return 'draw';
}

function calculateMMRChange(playerMMR: number, opponentMMR: number, playerWon: boolean): number {
  const K = 32; // K-factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  const actualScore = playerWon ? 1 : 0;
  const change = Math.round(K * (actualScore - expectedScore));

  return change;
}

async function updateBattleStats(
  userId: string,
  won: boolean,
  draw: boolean,
  mmrChange: number,
  isRanked: boolean = true
): Promise<void> {
  // Get current stats
  const { data: currentStats } = await supabase
    .from('battle_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!currentStats) return;

  // Only update MMR for ranked matches
  const newMMR = isRanked ? currentStats.mmr + mmrChange : currentStats.mmr;
  const newWinStreak = won ? currentStats.win_streak + 1 : 0;

  await supabase
    .from('battle_stats')
    .update({
      mmr: newMMR,
      total_battles: currentStats.total_battles + 1,
      wins: won ? currentStats.wins + 1 : currentStats.wins,
      losses: (!won && !draw) ? currentStats.losses + 1 : currentStats.losses,
      draws: draw ? currentStats.draws + 1 : currentStats.draws,
      win_streak: newWinStreak,
      best_win_streak: Math.max(newWinStreak, currentStats.best_win_streak),
      last_battle_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

export default router;
