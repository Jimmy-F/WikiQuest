import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

// Predefined wiki races with different difficulty levels
const WIKI_RACES = [
  // Easy races (related topics)
  { id: 'easy-1', start: 'Water', end: 'Ocean', difficulty: 'easy', optimalPath: 3 },
  { id: 'easy-2', start: 'Sun', end: 'Solar System', difficulty: 'easy', optimalPath: 2 },
  { id: 'easy-3', start: 'Dog', end: 'Wolf', difficulty: 'easy', optimalPath: 2 },

  // Medium races (somewhat related)
  { id: 'medium-1', start: 'Pizza', end: 'Italy', difficulty: 'medium', optimalPath: 3 },
  { id: 'medium-2', start: 'Guitar', end: 'Music', difficulty: 'medium', optimalPath: 2 },
  { id: 'medium-3', start: 'Basketball', end: 'United States', difficulty: 'medium', optimalPath: 3 },

  // Hard races (distant topics)
  { id: 'hard-1', start: 'Mathematics', end: 'Pizza', difficulty: 'hard', optimalPath: 5 },
  { id: 'hard-2', start: 'Ancient Egypt', end: 'Computer', difficulty: 'hard', optimalPath: 6 },
  { id: 'hard-3', start: 'Gravity', end: 'Julius Caesar', difficulty: 'hard', optimalPath: 7 },

  // Expert races (very distant)
  { id: 'expert-1', start: 'DNA', end: 'Symphony', difficulty: 'expert', optimalPath: 8 },
  { id: 'expert-2', start: 'Photosynthesis', end: 'World War II', difficulty: 'expert', optimalPath: 9 },
  { id: 'expert-3', start: 'Quantum Mechanics', end: 'Shakespeare', difficulty: 'expert', optimalPath: 10 }
];

// Get available wiki races
router.get('/races', async (req: Request, res: Response) => {
  try {
    const { difficulty } = req.query;

    let races = WIKI_RACES;
    if (difficulty) {
      races = races.filter(r => r.difficulty === difficulty);
    }

    res.json({ races });
  } catch (error: any) {
    console.error('Error getting races:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get random race
router.get('/races/random', async (req: Request, res: Response) => {
  try {
    const { difficulty } = req.query;

    let races = WIKI_RACES;
    if (difficulty) {
      races = races.filter(r => r.difficulty === difficulty);
    }

    const randomRace = races[Math.floor(Math.random() * races.length)];
    res.json({ race: randomRace });
  } catch (error: any) {
    console.error('Error getting random race:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start a wiki race
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, raceId, startArticle, endArticle, isCustom } = req.body;

    const race = WIKI_RACES.find(r => r.id === raceId);

    const { data, error } = await supabase
      .from('wiki_races')
      .insert({
        user_id: userId,
        race_id: raceId || 'custom',
        start_article: startArticle,
        end_article: endArticle,
        difficulty: race?.difficulty || 'custom',
        optimal_path: race?.optimalPath || 0,
        is_custom: isCustom || false,
        article_path: [startArticle],
        clicks_count: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Wiki race started!',
      race: data
    });
  } catch (error: any) {
    console.error('Error starting race:', error);
    res.status(500).json({ error: error.message });
  }
});

// Normalize article name for comparison
const normalizeArticleName = (name: string): string => {
  return name.trim().replace(/_/g, ' ').toLowerCase();
};

// Track article click in race
router.post('/:raceId/click', async (req: Request, res: Response) => {
  try {
    const { raceId } = req.params;
    const { article } = req.body;

    // Get current race
    const { data: race } = await supabase
      .from('wiki_races')
      .select('*')
      .eq('id', raceId)
      .single();

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    // Update path
    const currentPath = race.article_path || [race.start_article];
    const updatedPath = [...currentPath, article];
    // Clicks are path length minus 1 (don't count starting article)
    const clicksCount = updatedPath.length - 1;

    await supabase
      .from('wiki_races')
      .update({
        article_path: updatedPath,
        clicks_count: clicksCount
      })
      .eq('id', raceId);

    // Check if reached destination (case-insensitive comparison)
    const completed = normalizeArticleName(article) === normalizeArticleName(race.end_article);

    res.json({
      completed,
      clicks: clicksCount,
      path: updatedPath
    });
  } catch (error: any) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a wiki race
router.post('/:raceId/complete', async (req: Request, res: Response) => {
  try {
    const { raceId } = req.params;

    const { data: race } = await supabase
      .from('wiki_races')
      .select('*')
      .eq('id', raceId)
      .single();

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    const completedAt = new Date();
    const timeSeconds = Math.floor((completedAt.getTime() - new Date(race.started_at).getTime()) / 1000);

    // Calculate score (cap at 100)
    const clicksScore = Math.max(0, Math.min(100, 100 - (race.clicks_count - race.optimal_path) * 10));
    const timeScore = Math.max(0, Math.min(100, 100 - Math.floor(timeSeconds / 10)));
    const totalScore = Math.min(100, Math.floor((clicksScore + timeScore) / 2));

    // Determine medal
    let medal = 'bronze';
    if (totalScore >= 90) medal = 'gold';
    else if (totalScore >= 75) medal = 'silver';

    // Award XP based on difficulty and performance (skip for custom races)
    let xpEarned = 0;

    if (!race.is_custom) {
      xpEarned = 50; // Base XP
      if (race.difficulty === 'medium') xpEarned = 75;
      else if (race.difficulty === 'hard') xpEarned = 100;
      else if (race.difficulty === 'expert') xpEarned = 150;

      if (medal === 'gold') xpEarned = Math.floor(xpEarned * 1.5);
      else if (medal === 'silver') xpEarned = Math.floor(xpEarned * 1.25);
    }

    // Update race record
    await supabase
      .from('wiki_races')
      .update({
        completed_at: completedAt.toISOString(),
        time_seconds: timeSeconds,
        score: totalScore,
        medal
      })
      .eq('id', raceId);

    // Award XP to user (only for official races, not custom, and only on first completion)
    let isFirstCompletion = false;
    if (!race.is_custom && xpEarned > 0) {
      // Check if this is the first time completing this specific race
      const { data: existingCompletion } = await supabase
        .from('race_first_completions')
        .select('id')
        .eq('user_id', race.user_id)
        .eq('race_id', race.race_id)
        .single();

      if (!existingCompletion) {
        // This is the first completion - award XP
        isFirstCompletion = true;

        // Record first completion
        await supabase.from('race_first_completions').insert({
          user_id: race.user_id,
          race_id: race.race_id,
          completed_at: completedAt.toISOString()
        });

        // Award XP
        await supabase.from('xp_transactions').insert({
          user_id: race.user_id,
          amount: xpEarned,
          reason: 'wiki_race',
          wiki_race_id: raceId,
          metadata: { medal, difficulty: race.difficulty, first_completion: true }
        });

        const { data: userData } = await supabase
          .from('users')
          .select('total_xp')
          .eq('id', race.user_id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ total_xp: (userData.total_xp || 0) + xpEarned })
            .eq('id', race.user_id);
        }
      } else {
        // Already completed before - no XP
        xpEarned = 0;
      }
    }

    // Check and award achievements (only for official races)
    const unlockedAchievements: string[] = [];
    if (!race.is_custom) {
      // Get user's race stats
      const { data: raceStats } = await supabase
        .from('wiki_races')
        .select('*')
        .eq('user_id', race.user_id)
        .not('completed_at', 'is', null);

      const completedRaces = raceStats || [];
      const racesCount = completedRaces.length;
      const goldMedals = completedRaces.filter(r => r.medal === 'gold').length;
      const optimalRaces = completedRaces.filter(r => r.clicks_count === r.optimal_path).length;

      // Check achievements
      const achievementsToCheck = [
        { key: 'first_race', condition: racesCount >= 1 },
        { key: 'racer_10', condition: racesCount >= 10 },
        { key: 'racer_25', condition: racesCount >= 25 },
        { key: 'racer_50', condition: racesCount >= 50 },
        { key: 'racer_100', condition: racesCount >= 100 },
        { key: 'gold_medal', condition: goldMedals >= 1 },
        { key: 'gold_10', condition: goldMedals >= 10 },
        { key: 'gold_25', condition: goldMedals >= 25 },
        { key: 'speedster', condition: timeSeconds <= 60 },
        { key: 'lightning_fast', condition: timeSeconds <= 30 },
        { key: 'efficient_5', condition: optimalRaces >= 5 },
        { key: 'efficient_20', condition: optimalRaces >= 20 },
        { key: 'perfect_score', condition: totalScore === 100 },
        { key: 'comeback', condition: race.clicks_count > race.optimal_path * 2 && medal !== 'bronze' },
      ];

      // Check difficulty masters
      const easyGolds = completedRaces.filter(r => r.difficulty === 'easy' && r.medal === 'gold').length;
      const mediumGolds = completedRaces.filter(r => r.difficulty === 'medium' && r.medal === 'gold').length;
      const hardGolds = completedRaces.filter(r => r.difficulty === 'hard' && r.medal === 'gold').length;
      const expertGolds = completedRaces.filter(r => r.difficulty === 'expert' && r.medal === 'gold').length;

      achievementsToCheck.push(
        { key: 'easy_master', condition: easyGolds >= 3 },
        { key: 'medium_master', condition: mediumGolds >= 3 },
        { key: 'hard_master', condition: hardGolds >= 3 },
        { key: 'expert_master', condition: expertGolds >= 3 }
      );

      // Check if user has completed all difficulties
      const difficulties = new Set(completedRaces.map(r => r.difficulty));
      achievementsToCheck.push({
        key: 'explorer',
        condition: difficulties.has('easy') && difficulties.has('medium') && difficulties.has('hard') && difficulties.has('expert')
      });

      // Award achievements
      for (const check of achievementsToCheck) {
        if (check.condition) {
          // Check if achievement already unlocked
          const { data: existing } = await supabase
            .from('user_achievements')
            .select('id')
            .eq('user_id', race.user_id)
            .eq('achievement_id', supabase.from('achievements').select('id').eq('key', check.key).single())
            .single();

          if (!existing) {
            // Get achievement details
            const { data: achievement } = await supabase
              .from('achievements')
              .select('*')
              .eq('key', check.key)
              .single();

            if (achievement) {
              // Unlock achievement
              await supabase.from('user_achievements').insert({
                user_id: race.user_id,
                achievement_id: achievement.id,
                unlocked: true,
                unlocked_at: new Date().toISOString()
              });

              // Award achievement XP
              await supabase.from('xp_transactions').insert({
                user_id: race.user_id,
                amount: achievement.xp_reward,
                reason: 'achievement',
                achievement_id: achievement.id,
                metadata: { achievement_key: check.key }
              });

              // Update user total XP
              const { data: userData } = await supabase
                .from('users')
                .select('total_xp')
                .eq('id', race.user_id)
                .single();

              if (userData) {
                await supabase
                  .from('users')
                  .update({ total_xp: (userData.total_xp || 0) + achievement.xp_reward })
                  .eq('id', race.user_id);
              }

              unlockedAchievements.push(achievement.name);
            }
          }
        }
      }
    }

    res.json({
      message: `Race completed with ${medal} medal! 🎉`,
      timeSeconds,
      clicks: race.clicks_count,
      optimalPath: race.optimal_path,
      score: totalScore,
      medal,
      xpEarned,
      path: race.article_path,
      unlockedAchievements,
      isFirstCompletion
    });
  } catch (error: any) {
    console.error('Error completing race:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's race history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('wiki_races')
      .select('*')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ races: data || [] });
  } catch (error: any) {
    console.error('Error getting race history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard for a specific race
router.get('/leaderboard/:raceId', async (req: Request, res: Response) => {
  try {
    const { raceId } = req.params;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('wiki_races')
      .select('*, users(username)')
      .eq('race_id', raceId)
      .not('completed_at', 'is', null)
      .order('score', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ leaderboard: data || [] });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search Wikipedia articles for validation
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Use Wikipedia's search API
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json() as any;

    // OpenSearch returns: [query, [titles], [descriptions], [urls]]
    const suggestions = data[1] || [];

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Error searching Wikipedia:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate Wikipedia article exists
router.get('/validate/:article', async (req: Request, res: Response) => {
  try {
    const { article } = req.params;

    // Check if article exists using Wikipedia API
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(article)}&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json() as any;

    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const exists = pageId !== '-1';

    // Get the normalized title if it exists
    const normalizedTitle = exists ? pages[pageId].title : null;

    res.json({
      exists,
      title: normalizedTitle,
      suggested: normalizedTitle || article
    });
  } catch (error: any) {
    console.error('Error validating article:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
