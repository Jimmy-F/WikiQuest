import { Router, Request, Response } from 'express';
import { getQuizForArticle, evaluateQuizResult } from '../data/quizQuestions';

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
    const { article, answers } = req.body;

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

    res.json({
      article,
      results,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      golden: evaluation.golden,
      message: evaluation.golden
        ? '🏆 Perfect score! You earned a golden completion!'
        : evaluation.passed
        ? '✅ Great job! You passed the quiz!'
        : '❌ Not quite. Review the material and try again!'
    });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;