import { Router, Request, Response } from 'express';
import { supabase } from '../server';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// Initialize Claude API client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// Generate quiz from article content
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      articleId,
      paragraphContent,
      paragraphRange,
      userTier = 'free'
    } = req.body;

    // Check quiz cache first
    const { data: cached } = await supabase
      .from('quiz_cache')
      .select('*')
      .eq('wikipedia_url', req.body.wikipediaUrl)
      .eq('paragraph_range', paragraphRange)
      .single();

    if (cached) {
      // Use cached quiz
      console.log('Using cached quiz');

      // Update cache hit count
      await supabase
        .from('quiz_cache')
        .update({
          hit_count: cached.hit_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cached.id);

      // Create quiz record
      const { data: quiz } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          article_id: articleId,
          paragraph_range: paragraphRange,
          questions: cached.questions,
          model_used: cached.model_used,
          is_cached: true,
          total_questions: cached.questions.length
        })
        .select()
        .single();

      return res.json({
        quiz,
        cached: true
      });
    }

    // Generate new quiz with Claude
    const model = userTier === 'free' ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20241022';

    const prompt = `You are a learning assistant. Generate quiz questions for this Wikipedia text.

Text to analyze:
${paragraphContent}

CRITICAL: Return ONLY valid JSON, no explanatory text before or after.

Output exactly this structure with 2 questions:
{
  "questions": [
    {
      "question": "First question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Why this answer is correct"
    },
    {
      "question": "Second question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 2,
      "explanation": "Why this answer is correct"
    }
  ]
}

Requirements:
- Output ONLY the JSON object above, nothing else
- Generate exactly 2 questions
- Test comprehension, not memorization
- All 4 options must be plausible
- correct_answer is the index (0-3) of the correct option
- Keep explanations brief (1-2 sentences)`;

    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from the response (Claude sometimes adds text before/after)
    let quizData;
    try {
      // First try to parse the entire response as JSON
      quizData = JSON.parse(responseText);
    } catch (error) {
      // If that fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          quizData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          throw new Error('Invalid quiz format from AI');
        }
      } else {
        console.error('No JSON found in response:', responseText.substring(0, 200));
        throw new Error('No valid quiz data in AI response');
      }
    }

    // Validate the quiz data structure
    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      console.error('Invalid quiz structure:', quizData);
      throw new Error('Invalid quiz structure from AI');
    }

    // Save quiz to database
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        article_id: articleId,
        paragraph_range: paragraphRange,
        questions: quizData.questions,
        model_used: model === 'claude-3-haiku-20240307' ? 'haiku' : 'sonnet',
        is_cached: false,
        total_questions: quizData.questions.length
      })
      .select()
      .single();

    if (error) throw error;

    // Optionally cache this quiz if it's for a popular article
    // TODO: Implement caching logic for popular articles

    res.json({
      quiz,
      cached: false
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit quiz attempt
router.post('/:quizId/attempt', async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { userId, articleId, answers, timeTakenSeconds } = req.body;

    // Get quiz to check answers
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Grade the answers
    const questions = quiz.questions;
    let correctCount = 0;
    const gradedAnswers = answers.map((answer: any, index: number) => {
      const isCorrect = answer.selected === questions[index].correct_answer;
      if (isCorrect) correctCount++;

      return {
        question_id: index,
        user_answer: answer.selected,
        is_correct: isCorrect,
        correct_answer: questions[index].correct_answer,
        explanation: questions[index].explanation
      };
    });

    const score = (correctCount / questions.length) * 100;
    const isPerfect = score === 100;

    // Calculate XP earned
    let xpEarned = correctCount * 5; // 5 XP per correct answer
    if (isPerfect) xpEarned += 25; // Bonus for perfect score

    // Save quiz attempt
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: userId,
        article_id: articleId,
        answers: gradedAnswers,
        correct_count: correctCount,
        total_count: questions.length,
        score,
        xp_earned: xpEarned,
        time_taken_seconds: timeTakenSeconds
      })
      .select()
      .single();

    if (error) throw error;

    // Award XP to user
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: xpEarned,
      reason: isPerfect ? 'perfect_score' : 'quiz_completed',
      quiz_attempt_id: attempt.id,
      article_id: articleId
    });

    // Update user's total XP and level
    const { data: currentUser } = await supabase
      .from('users')
      .select('total_xp, current_level')
      .eq('id', userId)
      .single();

    if (currentUser) {
      const newTotalXp = currentUser.total_xp + xpEarned;
      const newLevel = Math.floor(newTotalXp / 100) + 1; // Level up every 100 XP

      await supabase
        .from('users')
        .update({
          total_xp: newTotalXp,
          current_level: newLevel
        })
        .eq('id', userId);
    }

    // Update article stats
    const { data: article } = await supabase
      .from('articles')
      .select('quiz_count, correct_answers, total_answers')
      .eq('id', articleId)
      .single();

    if (article) {
      await supabase
        .from('articles')
        .update({
          quiz_count: (article.quiz_count || 0) + 1,
          correct_answers: (article.correct_answers || 0) + correctCount,
          total_answers: (article.total_answers || 0) + questions.length
        })
        .eq('id', articleId);
    }

    res.json({
      attempt,
      score,
      correctCount,
      totalQuestions: questions.length,
      xpEarned,
      isPerfect,
      message: isPerfect ? '🎉 Perfect score! +' + xpEarned + ' XP!' : '+' + xpEarned + ' XP'
    });
  } catch (error: any) {
    console.error('Error submitting quiz attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get quiz attempts for an article
router.get('/attempts/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('article_id', articleId)
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false });

    if (error) throw error;

    res.json({ attempts: data });
  } catch (error: any) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
