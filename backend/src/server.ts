import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WikiQuest Backend API',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to WikiQuest API! 🎮📚',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      articles: '/api/articles',
      quizzes: '/api/quizzes',
      reviews: '/api/reviews',
      analytics: '/api/analytics',
      achievements: '/api/achievements',
      quests: '/api/quests',
      leaderboard: '/api/leaderboard'
    }
  });
});

// API Routes
import usersRouter from './routes/users';
import articlesRouter from './routes/articles';
import quizzesRouter from './routes/quizzes';
import reviewsRouter from './routes/reviews';
import analyticsRouter from './routes/analytics';
import achievementsRouter from './routes/achievements';
import questsRouter from './routes/quests';
import challengesRouter from './routes/challenges';
import quizRouter from './routes/quiz';
import heartsRouter from './routes/hearts';
import leaderboardRouter from './routes/leaderboard';
import wikiraceRouter from './routes/wikirace';

app.use('/api/users', usersRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/quests', questsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/hearts', heartsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/wikirace', wikiraceRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║                                      ║
║   🎮 WikiQuest Backend API Started   ║
║                                      ║
║   Port: ${PORT}                     ║
║   Environment: ${process.env.NODE_ENV}   ║
║                                      ║
╚══════════════════════════════════════╝
  `);

  console.log(`
📊 Status: http://localhost:${PORT}/health
🚀 API: http://localhost:${PORT}/api
  `);
});

export default app;
