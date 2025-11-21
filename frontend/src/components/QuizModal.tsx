import React, { useState, useEffect } from 'react';
import './QuizModal.css';

interface QuizQuestion {
  question: string;
  options: string[];
}

interface QuizModalProps {
  article: string;
  articleIcon?: string;
  onComplete: (passed: boolean, golden: boolean, percentage: number) => void;
  onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ article, articleIcon, onComplete, onClose }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [article]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/article/${encodeURIComponent(article)}`);
      const data = await response.json();

      if (data.questions) {
        setQuestions(data.questions);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers, selectedAnswer];
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Submit quiz
        submitQuiz(newAnswers);
      }
    }
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article,
          answers: finalAnswers
        })
      });

      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleComplete = () => {
    if (results) {
      onComplete(results.passed, results.golden, results.percentage);
    }
  };

  if (loading) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <div className="quiz-loading">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <h2>No quiz available yet</h2>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal results">
          <div className={`results-header ${results.golden ? 'golden' : results.passed ? 'passed' : 'failed'}`}>
            <div className="results-icon">
              {results.golden ? '🏆' : results.passed ? '✅' : '❌'}
            </div>
            <h2>{results.message}</h2>
          </div>

          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">{results.correctAnswers}/{results.totalQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Percentage</span>
              <span className="stat-value">{Math.round(results.percentage)}%</span>
            </div>
          </div>

          <div className="results-breakdown">
            <h3>Review Your Answers:</h3>
            {results.results.map((result: any, idx: number) => (
              <div key={idx} className={`result-item ${result.correct ? 'correct' : 'incorrect'}`}>
                <div className="result-question">Q{idx + 1}: {questions[idx].question}</div>
                <div className="result-answer">
                  Your answer: {questions[idx].options[result.userAnswer]}
                  {!result.correct && (
                    <div className="correct-answer">
                      Correct: {questions[idx].options[result.correctAnswer]}
                    </div>
                  )}
                </div>
                {result.explanation && (
                  <div className="explanation">💡 {result.explanation}</div>
                )}
              </div>
            ))}
          </div>

          <div className="results-actions">
            {results.passed ? (
              <button className="btn-complete" onClick={handleComplete}>
                Continue Journey →
              </button>
            ) : (
              <>
                <button className="btn-retry" onClick={() => window.location.reload()}>
                  Try Again
                </button>
                <button className="btn-close" onClick={onClose}>
                  Review Article
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        <div className="quiz-header">
          <div className="quiz-title">
            <span className="article-icon">{articleIcon}</span>
            <h2>Quiz: {article}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        <div className="quiz-content">
          <h3 className="question">{question.question}</h3>

          <div className="options">
            {question.options.map((option, idx) => (
              <div
                key={idx}
                className={`option ${selectedAnswer === idx ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(idx)}
              >
                <div className="option-marker">{String.fromCharCode(65 + idx)}</div>
                <div className="option-text">{option}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="quiz-actions">
          <button
            className="btn-next"
            onClick={handleNext}
            disabled={selectedAnswer === null}
          >
            {currentQuestion < questions.length - 1 ? 'Next Question →' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;