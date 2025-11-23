import { Router, Request, Response } from 'express';
import { getQuizForArticle, evaluateQuizResult } from '../data/quizQuestions';
import { supabase } from '../server';

const router = Router();

// Get quiz questions for an article
router.get('/article/:articleName', async (req: Request, res: Response) => {
  try {
    const { articleName } = req.params;
    const questions = getQuizForArticle(articleName);

    if (questions.length === 0) {
      return res.status(404).json({
        error: 'No quiz available for this article yet'
      });
    }

    // Return questions without the correct answer index for security
    const clientQuestions = questions.map(q => ({
      question: q.question,
      options: q.options
    }));

    res.json({
      article: articleName,
      questions: clientQuestions,
      totalQuestions: questions.length,
      passingScore: 75,
      goldenScore: 100
    });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit quiz answers and get results
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { article, answers, userId } = req.body;

    const questions = getQuizForArticle(article);
    if (questions.length === 0) {
      return res.status(404).json({
        error: 'No quiz available for this article'
      });
    }

    // Check answers
    let correctCount = 0;
    const results = answers.map((answer: number, index: number) => {
      const isCorrect = answer === questions[index].correct;
      if (isCorrect) correctCount++;

      return {
        questionIndex: index,
        userAnswer: answer,
        correct: isCorrect,
        correctAnswer: questions[index].correct,
        explanation: questions[index].explanation
      };
    });

    const evaluation = evaluateQuizResult(correctCount, questions.length);

    // Handle hearts: Deduct 1 heart if quiz failed (not passed)
    let heartLost = false;
    const quizFailed = !evaluation.passed;

    if (quizFailed && userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('hearts, hearts_lost_today, last_heart_lost_at')
        .eq('id', userId)
        .single();

      if (userData && userData.hearts > 0) {
        // Check if it's a new day (reset hearts_lost_today)
        const now = new Date();
        const lastLostDate = userData.last_heart_lost_at ? new Date(userData.last_heart_lost_at) : null;
        const isNewDay = !lastLostDate ||
          lastLostDate.toDateString() !== now.toDateString();

        const heartsLostToday = isNewDay ? 0 : (userData.hearts_lost_today || 0);

        // Deduct heart
        await supabase
          .from('users')
          .update({
            hearts: userData.hearts - 1,
            hearts_lost_today: heartsLostToday + 1,
            last_heart_lost_at: now.toISOString()
          })
          .eq('id', userId);

        // Record transaction
        await supabase.from('heart_transactions').insert({
          user_id: userId,
          amount: -1,
          reason: 'quiz_failed',
          quiz_id: null
        });

        heartLost = true;
      }
    }

    res.json({
      article,
      results,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      golden: evaluation.golden,
      heartLost,
      quizFailed,
      message: quizFailed
        ? (heartLost ? '💔 Quiz failed - 1 heart lost' : '💔 Quiz failed - No hearts left!')
        : (evaluation.golden
          ? '🏆 Perfect score! You earned a golden completion!'
          : '✅ Great job! You passed the quiz!')
    });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;