// WikiQuest Background Worker
import dotenv from 'dotenv';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log(`
╔══════════════════════════════════════╗
║                                      ║
║   🔧 WikiQuest Worker Started        ║
║                                      ║
║   Environment: ${process.env.NODE_ENV}   ║
║                                      ║
╚══════════════════════════════════════╝
`);

// ======================
// CRON JOB: Daily Challenge Reset
// Runs at midnight every day
// ======================
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily challenge reset...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, current_level');

    if (usersError) throw usersError;

    for (const user of users || []) {
      // Generate new daily challenges for each user
      const challenges = generateDailyChallenges(user.current_level);

      await supabase
        .from('daily_challenges')
        .insert({
          user_id: user.id,
          date: today,
          challenges,
          completed_count: 0
        });
    }

    // Reset hearts_lost_today counter
    await supabase
      .from('users')
      .update({ hearts_lost_today: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    console.log(`[CRON] Daily challenges reset for ${users?.length || 0} users`);
  } catch (error) {
    console.error('[CRON] Error resetting daily challenges:', error);
  }
});

// ======================
// CRON JOB: Leaderboard Update
// Runs every hour
// ======================
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Updating leaderboards...');
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get start of current week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Get start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartDate = monthStart.toISOString().split('T')[0];

    // Calculate daily leaderboard
    await updateLeaderboard('daily', today, today);

    // Calculate weekly leaderboard
    await updateLeaderboard('weekly', weekStartDate, today);

    // Calculate monthly leaderboard
    await updateLeaderboard('monthly', monthStartDate, today);

    // Calculate all-time leaderboard
    await updateLeaderboard('all_time', '2000-01-01', today);

    console.log('[CRON] Leaderboards updated successfully');
  } catch (error) {
    console.error('[CRON] Error updating leaderboards:', error);
  }
});

// ======================
// CRON JOB: Spaced Repetition Reminders
// Runs every hour
// ======================
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Checking for due reviews...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get users with reviews due today
    const { data: dueReviews, error } = await supabase
      .from('review_schedule')
      .select('user_id, article_id, articles(wikipedia_title)')
      .lte('next_review_date', today);

    if (error) throw error;

    // Group by user
    const userReviews = dueReviews?.reduce((acc: any, review: any) => {
      if (!acc[review.user_id]) acc[review.user_id] = [];
      acc[review.user_id].push(review);
      return acc;
    }, {});

    console.log(`[CRON] Found ${dueReviews?.length || 0} due reviews for ${Object.keys(userReviews || {}).length} users`);

    // TODO: Send notifications to users about due reviews
    // This would integrate with a notification service

  } catch (error) {
    console.error('[CRON] Error checking reviews:', error);
  }
});

// ======================
// CRON JOB: Daily Stats Aggregation
// Runs at 1 AM every day
// ======================
cron.schedule('0 1 * * *', async () => {
  console.log('[CRON] Aggregating daily stats...');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) throw usersError;

    for (const user of users || []) {
      // Get articles read yesterday
      const { count: articlesRead } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('completed_at', `${yesterdayDate}T00:00:00`)
        .lte('completed_at', `${yesterdayDate}T23:59:59`);

      // Get quizzes completed yesterday
      const { data: quizzes } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .gte('attempted_at', `${yesterdayDate}T00:00:00`)
        .lte('attempted_at', `${yesterdayDate}T23:59:59`);

      const quizzesCompleted = quizzes?.length || 0;
      const perfectScores = quizzes?.filter(q => q.score === q.total_questions).length || 0;
      const avgScore = quizzes && quizzes.length > 0
        ? quizzes.reduce((sum, q) => sum + (q.score / q.total_questions * 100), 0) / quizzes.length
        : 0;

      // Get total reading time
      const { data: articles } = await supabase
        .from('articles')
        .select('reading_time_seconds')
        .eq('user_id', user.id)
        .gte('updated_at', `${yesterdayDate}T00:00:00`)
        .lte('updated_at', `${yesterdayDate}T23:59:59`);

      const totalReadingTime = articles?.reduce((sum, a) => sum + (a.reading_time_seconds || 0), 0) || 0;

      // Get XP earned
      const { data: xpTransactions } = await supabase
        .from('xp_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', `${yesterdayDate}T00:00:00`)
        .lte('created_at', `${yesterdayDate}T23:59:59`);

      const xpEarned = xpTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

      // Insert or update daily stats
      await supabase
        .from('daily_stats')
        .upsert({
          user_id: user.id,
          date: yesterdayDate,
          articles_read: articlesRead || 0,
          quizzes_completed: quizzesCompleted,
          perfect_scores: perfectScores,
          average_quiz_score: avgScore,
          total_reading_time_seconds: totalReadingTime,
          xp_earned: xpEarned,
          maintained_streak: articlesRead! > 0 || quizzesCompleted > 0
        }, {
          onConflict: 'user_id,date'
        });
    }

    console.log(`[CRON] Aggregated stats for ${users?.length || 0} users`);
  } catch (error) {
    console.error('[CRON] Error aggregating daily stats:', error);
  }
});

// ======================
// CRON JOB: Heart Regeneration Check
// Runs every 15 minutes
// ======================
cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Checking heart regeneration...');
  try {
    // Get users with less than max hearts
    const { data: users, error } = await supabase
      .from('users')
      .select('id, hearts, max_hearts, heart_refill_time')
      .lt('hearts', supabase.raw('max_hearts'));

    if (error) throw error;

    const now = new Date();

    for (const user of users || []) {
      if (!user.heart_refill_time) continue;

      const lastRefill = new Date(user.heart_refill_time);
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
            .eq('id', user.id);

          // Log transaction
          await supabase
            .from('heart_transactions')
            .insert({
              user_id: user.id,
              amount: heartsToAdd,
              reason: 'time_refill'
            });
        }
      }
    }

    console.log(`[CRON] Checked heart regeneration for ${users?.length || 0} users`);
  } catch (error) {
    console.error('[CRON] Error regenerating hearts:', error);
  }
});

console.log('✅ All cron jobs scheduled:');
console.log('   - Daily challenge reset: 00:00 daily');
console.log('   - Leaderboard update: Every hour');
console.log('   - Review reminders: Every hour');
console.log('   - Daily stats aggregation: 01:00 daily');
console.log('   - Heart regeneration: Every 15 minutes');
console.log('\nWorker ready. Waiting for jobs...');

// ======================
// HELPER FUNCTIONS
// ======================

function generateDailyChallenges(userLevel: number): any[] {
  const challengeTypes = [
    {
      type: 'articles_read',
      title: 'Daily Reader',
      description: 'Read articles today',
      icon: '📚',
      target: Math.max(1, Math.floor(userLevel / 5)),
      xp_reward: 50,
      difficulty: 'easy'
    },
    {
      type: 'perfect_quiz',
      title: 'Perfect Scholar',
      description: 'Get a perfect quiz score',
      icon: '💯',
      target: 1,
      xp_reward: 75,
      difficulty: 'medium'
    },
    {
      type: 'reading_time',
      title: 'Deep Focus',
      description: 'Read for 30 minutes total',
      icon: '⏰',
      target: 1800, // 30 minutes in seconds
      xp_reward: 60,
      difficulty: 'medium'
    },
    {
      type: 'quiz_streak',
      title: 'Quiz Master',
      description: 'Complete quizzes in a row',
      icon: '🔥',
      target: 3,
      xp_reward: 100,
      difficulty: 'hard'
    }
  ];

  // Return 3-4 random challenges
  const numChallenges = Math.min(3 + Math.floor(userLevel / 10), 4);
  return challengeTypes
    .sort(() => Math.random() - 0.5)
    .slice(0, numChallenges)
    .map(c => ({
      ...c,
      progress: 0,
      completed: false
    }));
}

async function updateLeaderboard(periodType: string, startDate: string, endDate: string) {
  try {
    // Get XP earned in the period
    const { data: xpData, error } = await supabase
      .from('xp_transactions')
      .select('user_id, amount')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (error) throw error;

    // Aggregate by user
    const userXp = xpData?.reduce((acc: any, tx: any) => {
      acc[tx.user_id] = (acc[tx.user_id] || 0) + tx.amount;
      return acc;
    }, {});

    // Get articles read in the period
    const { data: articleData } = await supabase
      .from('articles')
      .select('user_id')
      .gte('completed_at', `${startDate}T00:00:00`)
      .lte('completed_at', `${endDate}T23:59:59`)
      .eq('completed', true);

    const userArticles = articleData?.reduce((acc: any, article: any) => {
      acc[article.user_id] = (acc[article.user_id] || 0) + 1;
      return acc;
    }, {});

    // Get quiz scores in the period
    const { data: quizData } = await supabase
      .from('quiz_attempts')
      .select('user_id, score, total_questions')
      .gte('attempted_at', `${startDate}T00:00:00`)
      .lte('attempted_at', `${endDate}T23:59:59`);

    const userQuizzes = quizData?.reduce((acc: any, quiz: any) => {
      if (!acc[quiz.user_id]) {
        acc[quiz.user_id] = { total: 0, count: 0 };
      }
      acc[quiz.user_id].total += (quiz.score / quiz.total_questions) * 100;
      acc[quiz.user_id].count += 1;
      return acc;
    }, {});

    // Create leaderboard entries
    const entries = Object.keys(userXp || {}).map(userId => ({
      user_id: userId,
      period_type: periodType,
      period_start: startDate,
      period_end: endDate,
      xp_earned: userXp[userId] || 0,
      articles_read: userArticles?.[userId] || 0,
      average_score: userQuizzes?.[userId]
        ? userQuizzes[userId].total / userQuizzes[userId].count
        : 0
    }));

    // Sort by XP and assign ranks
    entries.sort((a, b) => b.xp_earned - a.xp_earned);
    entries.forEach((entry, index) => {
      (entry as any).rank = index + 1;
    });

    // Delete old entries for this period
    await supabase
      .from('leaderboard')
      .delete()
      .eq('period_type', periodType)
      .gte('period_start', startDate)
      .lte('period_end', endDate);

    // Insert new entries
    if (entries.length > 0) {
      await supabase
        .from('leaderboard')
        .insert(entries);
    }

    console.log(`[CRON] Updated ${periodType} leaderboard: ${entries.length} entries`);
  } catch (error) {
    console.error(`[CRON] Error updating ${periodType} leaderboard:`, error);
  }
}

// Keep process alive
setInterval(() => {}, 1000);
