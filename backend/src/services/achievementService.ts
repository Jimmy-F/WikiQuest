import { supabase } from '../server';

interface AchievementCheckResult {
  newUnlocks: any[];
  message: string;
}

/**
 * Check and unlock achievements for a user based on various triggers
 */
export async function checkAndUnlockAchievements(
  userId: string,
  trigger: string,
  metadata?: any
): Promise<AchievementCheckResult> {
  try {
    // Get user stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get articles read count
    const { count: articlesCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    // Get quiz attempts count and perfect scores
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId);

    const totalQuizzes = quizAttempts?.length || 0;
    const perfectScores = quizAttempts?.filter(q => q.score === q.total_questions).length || 0;

    // Get golden completions (100% quiz on first try)
    const { data: articles } = await supabase
      .from('articles')
      .select('*, quiz_attempts(*)')
      .eq('user_id', userId);

    const goldenCompletions = articles?.filter(article => {
      const attempts = article.quiz_attempts || [];
      return attempts.length === 1 && attempts[0].score === attempts[0].total_questions;
    }).length || 0;

    // Get all achievements that match the trigger
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('requirement_type', trigger);

    if (achievementsError) throw achievementsError;

    const newUnlocks: any[] = [];

    // Check each relevant achievement
    for (const achievement of achievements || []) {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (existing?.unlocked) continue; // Skip if already unlocked

      let shouldUnlock = false;
      let progress = 0;

      // Check achievement requirements based on type
      switch (achievement.requirement_type) {
        case 'articles_read':
          progress = user.articles_read || 0;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'quizzes_completed':
          progress = totalQuizzes;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'perfect_scores':
          progress = perfectScores;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'golden_completions':
          progress = goldenCompletions;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'current_streak':
          progress = user.current_streak || 0;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'level_reached':
          progress = user.current_level || 1;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'quests_completed':
          // Count completed quests
          const { data: questProgress } = await supabase
            .from('quest_progress')
            .select('*')
            .eq('user_id', userId)
            .not('completed_at', 'is', null);
          progress = questProgress?.length || 0;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'speed_read':
          // Check if metadata contains reading time under 2 minutes
          if (metadata?.readingTime && metadata.readingTime < 120) {
            progress = 1;
            shouldUnlock = true;
          }
          break;

        case 'deep_read':
          // Check if metadata contains reading time over 10 minutes
          if (metadata?.readingTime && metadata.readingTime >= 600) {
            progress = 1;
            shouldUnlock = true;
          }
          break;

        case 'low_heart_win':
          // Check if metadata shows winning with 1 heart
          if (metadata?.heartsRemaining === 1 && metadata?.quizPassed) {
            progress = 1;
            shouldUnlock = true;
          }
          break;

        case 'hearts_lost_day':
          // Check hearts lost today
          progress = user.hearts_lost_today || 0;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case 'category_completed':
          // Check if user completed all articles in a category
          if (metadata?.categoryCompleted) {
            progress = 1;
            shouldUnlock = true;
          }
          break;

        // Subject-specific achievements
        case 'history_articles':
        case 'science_articles':
        case 'tech_articles':
        case 'culture_articles':
        case 'nature_articles':
        case 'sports_articles':
        case 'art_articles':
        case 'music_articles':
          // Count articles by category
          const category = achievement.requirement_type.replace('_articles', '');
          const { data: categoryArticles } = await supabase
            .from('articles')
            .select('wikipedia_categories')
            .eq('user_id', userId)
            .eq('completed', true);

          progress = categoryArticles?.filter(a =>
            a.wikipedia_categories?.some((c: string) =>
              c.toLowerCase().includes(category)
            )
          ).length || 0;
          shouldUnlock = progress >= achievement.requirement_value;
          break;
      }

      // Update or create user achievement record
      if (existing) {
        await supabase
          .from('user_achievements')
          .update({
            progress,
            unlocked: shouldUnlock,
            unlocked_at: shouldUnlock ? new Date().toISOString() : null
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            progress,
            unlocked: shouldUnlock,
            unlocked_at: shouldUnlock ? new Date().toISOString() : null
          });
      }

      // If newly unlocked, award XP and add to results
      if (shouldUnlock) {
        newUnlocks.push(achievement);

        // Award XP for unlocking achievement
        if (achievement.xp_reward > 0) {
          await supabase
            .from('users')
            .update({
              total_xp: (user.total_xp || 0) + achievement.xp_reward
            })
            .eq('id', userId);

          // Log XP transaction
          await supabase
            .from('xp_transactions')
            .insert({
              user_id: userId,
              amount: achievement.xp_reward,
              reason: 'achievement_unlock',
              achievement_id: achievement.id,
              metadata: { achievement_name: achievement.name }
            });
        }
      }
    }

    return {
      newUnlocks,
      message: newUnlocks.length > 0
        ? `Unlocked ${newUnlocks.length} achievement${newUnlocks.length > 1 ? 's' : ''}!`
        : 'No new achievements'
    };
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Check all achievement types after any user action
 */
export async function checkAllAchievements(userId: string, metadata?: any): Promise<AchievementCheckResult> {
  const allTriggers = [
    'articles_read',
    'quizzes_completed',
    'perfect_scores',
    'golden_completions',
    'current_streak',
    'level_reached',
    'quests_completed',
    'speed_read',
    'deep_read',
    'low_heart_win',
    'hearts_lost_day',
    'category_completed'
  ];

  const allUnlocks: any[] = [];

  for (const trigger of allTriggers) {
    const result = await checkAndUnlockAchievements(userId, trigger, metadata);
    allUnlocks.push(...result.newUnlocks);
  }

  return {
    newUnlocks: allUnlocks,
    message: allUnlocks.length > 0
      ? `Unlocked ${allUnlocks.length} achievement${allUnlocks.length > 1 ? 's' : ''}!`
      : 'No new achievements'
  };
}
