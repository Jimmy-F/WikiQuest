# WikiQuest 🎮📚

> Turn Wikipedia into an RPG where every article levels you up!

WikiQuest gamifies Wikipedia reading with active recall quizzes, XP systems, achievements, and spaced repetition to help you actually remember what you read.

## Features

### Core Learning
- ⚡ **Active Recall Quizzes** - Pop-up quizzes every 2-3 paragraphs
- 🧠 **Spaced Repetition** - SM-2 algorithm for optimal review timing
- 🎯 **Instant Feedback** - Know immediately if you're right or wrong

### Gamification
- 🆙 **XP & Levels** - Gain XP for reading and quizzes, level up from Novice to Legend
- 🔥 **Daily Streaks** - Maintain your learning streak with freeze protection
- 🏆 **Achievements** - 23+ badges to unlock (Bookworm, Scientist, etc.)
- 📋 **Daily Quests** - Complete challenges for bonus XP
- 📊 **Category Mastery** - Track expertise in Physics, History, Art, etc.
- 🏅 **Leaderboards** - Compete with friends (opt-in)

### Organization
- 📚 **Study Collections** - Create collections for exams
- 📈 **Analytics Dashboard** - Track reading time, retention, categories
- 🎯 **Smart Recommendations** - Discover related articles

## Tech Stack

### Frontend (Chrome Extension)
- React + TypeScript
- Chrome Extension API (Manifest V3)
- TailwindCSS

### Backend
- Node.js + Express + TypeScript
- Supabase (Postgres + Auth)
- Redis (caching + queues)
- Claude AI API (quiz generation)

### Infrastructure
- Docker + Docker Compose
- Railway (deployment)

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Supabase account
- Claude API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/wikiquest.git
cd wikiquest
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - CLAUDE_API_KEY
```

3. **Apply database migration**
```bash
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste and run
```

4. **Start development environment**
```bash
./scripts/dev-start.sh
```

Services will be available at:
- Backend API: http://localhost:3000
- Redis: localhost:6379

### Load Chrome Extension

1. Build the extension:
```bash
cd extension
npm install
npm run build
```

2. Load in Chrome:
- Go to `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `extension/dist` folder

## Project Structure

```
wikiquest/
├── backend/              # Express API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── server.ts    # Entry point
│   ├── Dockerfile
│   └── package.json
├── extension/            # Chrome extension
│   ├── src/
│   │   ├── content/     # Content scripts (Wikipedia integration)
│   │   ├── popup/       # Popup UI (dashboard)
│   │   ├── background/  # Service worker
│   │   └── shared/      # Shared utilities
│   ├── manifest.json
│   └── package.json
├── worker/               # Background jobs
│   ├── src/
│   │   └── jobs/        # Cron jobs (reviews, analytics)
│   ├── Dockerfile
│   └── package.json
├── supabase/             # Database
│   ├── migrations/      # SQL migrations
│   └── README.md
├── scripts/              # Utility scripts
├── docker-compose.yml
└── .env.example

```

## API Endpoints

### Articles
- `POST /api/articles/start` - Start tracking an article
- `PATCH /api/articles/:id/progress` - Update reading progress
- `POST /api/articles/:id/complete` - Complete article (awards XP)
- `GET /api/articles/history` - Get reading history

### Quizzes
- `POST /api/quizzes/generate` - Generate quiz with Claude AI
- `POST /api/quizzes/:id/attempt` - Submit quiz answers
- `GET /api/quizzes/attempts/:articleId` - Get quiz history

### Reviews
- `GET /api/reviews/due` - Get due spaced repetition reviews
- `POST /api/reviews/:articleId/complete` - Complete review

### Analytics
- `GET /api/analytics/dashboard` - User dashboard stats
- `GET /api/analytics/categories` - Category mastery

### Achievements
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/user/:userId` - User's unlocked achievements

### Quests
- `GET /api/quests` - Get active daily/weekly/monthly quests
- `GET /api/quests/progress/:userId` - User quest progress

## XP System

### XP Rewards
- Read article: **+10 XP**
- Complete quiz: **+5 XP per question**
- Perfect score: **+25 bonus XP**
- Daily login: **+5 XP**
- Review completed: **+15 XP**
- Quest completed: **Variable XP**
- Achievement unlocked: **Variable XP**

### Level Formula
```
Level = floor(total_xp / 100) + 1
```

Example progression:
- Level 1: 0-99 XP
- Level 10: 900-999 XP
- Level 20: 1900-1999 XP
- Level 50: 4900-4999 XP

## Development

### Run backend only
```bash
cd backend
npm install
npm run dev
```

### Run worker only
```bash
cd worker
npm install
npm run dev
```

### Build extension for production
```bash
cd extension
npm run build
```

### View logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f worker
```

### Restart services
```bash
docker-compose restart
```

### Stop everything
```bash
docker-compose down
```

## Deployment

### Backend (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Extension (Chrome Web Store)
1. Build production version
2. Zip extension/dist folder
3. Upload to Chrome Web Store Developer Dashboard

## Cost Optimization

### Claude API Usage
- Free tier: Uses Claude Haiku ($0.04/article)
- Paid tier: Uses Claude Sonnet (better quality)
- Quiz caching for popular articles (50% savings)
- Batch processing where possible

Expected costs at scale:
- 1,000 active users: ~$250/month Claude API
- 10,000 active users: ~$3,000/month Claude API

## Roadmap

### Phase 1 (MVP) ✅
- [x] Database schema with gamification
- [x] Backend API with XP system
- [x] Claude API quiz generation
- [ ] Chrome extension with content scripts
- [ ] Popup dashboard UI
- [ ] Basic authentication

### Phase 2 (Gamification)
- [ ] Daily quests system
- [ ] Achievement tracking
- [ ] Category mastery trees
- [ ] Progress insights dashboard

### Phase 3 (Social & Polish)
- [ ] Leaderboards
- [ ] Study parties (multiplayer)
- [ ] Profile customization
- [ ] Smart recommendations

### Phase 4 (Monetization)
- [ ] Stripe integration
- [ ] Teacher/classroom mode (B2B)
- [ ] Export to Anki/Notion
- [ ] Premium features

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@wikiquest.io
- 💬 Discord: [Join our community]
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/wikiquest/issues)

---

Built with ❤️ by the WikiQuest team

🎮 Learn smarter, not harder!
