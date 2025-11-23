# WikiHero PvP Battle/Race System - Comprehensive Analysis

## Executive Summary

A PvP (Player vs Player) battle/race system for WikiHero would allow users to compete in real-time or asynchronous wiki races against other players. This document analyzes the technical requirements, feasibility, legal considerations, and implementation strategy for such a system.

---

## 1. Core Concept

### Battle Modes

**Real-time Race**
- Two players race simultaneously from Article A → Article B
- First to reach target wins
- Time limit: 5-10 minutes
- Matchmaking based on MMR (explained below)

**Asynchronous Challenge**
- Player A completes a race and sets a benchmark
- Player B attempts to beat the time/score
- More flexible, doesn't require both players online
- Can be "vs replay" of opponent's path

---

## 2. MMR (Matchmaking Rating) System

### What is MMR?

MMR (Matchmaking Rating) is a numerical value representing a player's skill level. It's used in games like Chess (Elo rating), League of Legends, and Overwatch.

**How it works:**
1. Every player starts at a base MMR (e.g., 1000)
2. Win against higher-rated opponent = gain more MMR
3. Lose against lower-rated opponent = lose more MMR
4. Matchmaking pairs players with similar MMR (±100 range)

**For WikiHero:**
```
Player MMR Factors:
- Win/Loss ratio in battles
- Average completion time vs difficulty
- Medal achievement frequency (bronze/silver/gold)
- Article difficulty completed
- Streak bonuses

MMR Formula Example:
New MMR = Old MMR + K * (Actual Score - Expected Score)

Where:
- K = adjustment factor (32 for new players, 16 for experienced)
- Expected Score = probability of winning based on MMR difference
- Actual Score = 1 (win), 0.5 (draw), 0 (loss)
```

### MMR Tiers
```
  0-499:   Novice
500-999:   Apprentice
1000-1499: Scholar
1500-1999: Expert
2000-2499: Master
2500+:     Legend
```

---

## 3. Technical Requirements

### Database Schema

```sql
-- Player Battle Stats
CREATE TABLE battle_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  mmr INTEGER DEFAULT 1000,
  tier TEXT DEFAULT 'Apprentice',
  total_battles INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  last_battle_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle Matches
CREATE TABLE battle_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type TEXT NOT NULL, -- 'real_time' or 'async'
  race_id TEXT NOT NULL,
  start_article TEXT NOT NULL,
  end_article TEXT NOT NULL,
  difficulty TEXT NOT NULL,

  -- Players
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_mmr INTEGER,
  player2_mmr INTEGER,

  -- Results
  winner_id UUID REFERENCES users(id),
  player1_time INTEGER, -- seconds
  player2_time INTEGER,
  player1_clicks INTEGER,
  player2_clicks INTEGER,
  player1_path TEXT[], -- array of article titles
  player2_path TEXT[],

  -- MMR changes
  player1_mmr_change INTEGER,
  player2_mmr_change INTEGER,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchmaking Queue
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mmr INTEGER NOT NULL,
  race_difficulty TEXT, -- preference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Create indexes for fast matchmaking
CREATE INDEX idx_matchmaking_queue_mmr ON matchmaking_queue(mmr);
CREATE INDEX idx_matchmaking_queue_created ON matchmaking_queue(created_at);
CREATE INDEX idx_battle_matches_status ON battle_matches(status);
```

### Backend API Endpoints

```typescript
// Matchmaking
POST   /api/battles/queue/join          // Join matchmaking queue
DELETE /api/battles/queue/leave         // Leave queue
GET    /api/battles/queue/status        // Check queue status

// Real-time Battles
GET    /api/battles/:matchId            // Get battle details
POST   /api/battles/:matchId/start      // Mark player ready
POST   /api/battles/:matchId/click      // Track each click
POST   /api/battles/:matchId/complete   // Finish race
POST   /api/battles/:matchId/abandon    // Forfeit

// Async Challenges
POST   /api/battles/challenge/create    // Create challenge for friend
GET    /api/battles/challenge/:id       // Accept challenge
POST   /api/battles/challenge/:id/attempt // Complete challenge

// Stats & Leaderboard
GET    /api/battles/stats/:userId       // Player battle stats
GET    /api/battles/leaderboard          // Top players by MMR
GET    /api/battles/history/:userId     // Battle history
```

### Real-time Communication (WebSockets)

```javascript
// Server-side (Socket.io)
io.on('connection', (socket) => {
  // Join battle room
  socket.on('battle:join', ({ matchId, userId }) => {
    socket.join(`battle:${matchId}`);
  });

  // Track opponent progress
  socket.on('battle:progress', ({ matchId, userId, clicks, currentArticle }) => {
    // Broadcast to opponent only
    socket.to(`battle:${matchId}`).emit('opponent:progress', {
      clicks,
      currentArticle,
      timestamp: Date.now()
    });
  });

  // Battle finished
  socket.on('battle:finish', ({ matchId, userId, time, path }) => {
    // Notify opponent
    socket.to(`battle:${matchId}`).emit('opponent:finished', {
      userId,
      time,
      clicks: path.length
    });
  });
});

// Client-side
socket.on('opponent:progress', (data) => {
  // Update UI showing opponent's current position
  showOpponentIndicator(data.currentArticle);
});

socket.on('opponent:finished', (data) => {
  // Show opponent completed message
  showOpponentFinishedAlert(data);
});
```

### Matchmaking Algorithm

```typescript
async function findMatch(userId: string, userMmr: number): Promise<string | null> {
  // 1. Look for players in queue within MMR range
  const mmrRange = 100; // ±100 MMR initially
  const maxWaitTime = 60000; // 1 minute
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    // Find opponent in range
    const opponent = await supabase
      .from('matchmaking_queue')
      .select('*')
      .neq('user_id', userId)
      .gte('mmr', userMmr - mmrRange)
      .lte('mmr', userMmr + mmrRange)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (opponent) {
      // Create match
      const match = await createBattleMatch(userId, opponent.user_id);

      // Remove both from queue
      await removeFromQueue([userId, opponent.user_id]);

      return match.id;
    }

    // Expand search range gradually
    mmrRange += 20;
    await sleep(2000); // Wait 2s before retry
  }

  // No match found - offer bot opponent
  return null;
}
```

---

## 4. Bot Opponent System - Legality & Feasibility

### Legal Considerations

**✅ LEGAL - Bot opponents are standard practice:**

1. **Precedent:** Many games use bots for matchmaking:
   - Duolingo: Bot conversations for language practice
   - Chess.com: Bot opponents at various skill levels
   - Hearthstone: "Innkeeper" bot opponents
   - Among Us: Bot players when lobbies are empty

2. **Disclosure Requirements:**
   - ✅ **MUST** clearly disclose when opponent is a bot
   - ✅ **MUST NOT** deceive users into thinking bots are real players
   - ✅ **CAN** use bot names like "WikiBot", "Training Bot", or "AI Opponent"

3. **Best Practices:**
   - Label bot opponents clearly: "🤖 Training Bot (Intermediate)"
   - Show bot difficulty level
   - Allow players to opt-in/opt-out of bot matches
   - Don't mix bot MMR with human MMR leaderboards

**Example UI:**
```
┌─────────────────────────────────────┐
│  Finding Opponent...                │
│                                     │
│  [=====>          ] 35% (18s)       │
│                                     │
│  No players found nearby.           │
│                                     │
│  [ Race Against Bot Instead ]       │
│  └─ 🤖 Training Bot (Your Level)    │
│                                     │
│  [ Keep Waiting ]  [ Cancel ]       │
└─────────────────────────────────────┘
```

### Bot Implementation Strategy

**Bot Behavior Engine:**

```typescript
class WikiRaceBot {
  difficulty: 'easy' | 'medium' | 'hard';
  mmr: number;

  async raceAgainst(startArticle: string, endArticle: string): Promise<BotResult> {
    // 1. Pre-calculate optimal path
    const optimalPath = await findOptimalPath(startArticle, endArticle);

    // 2. Add human-like imperfections based on difficulty
    const actualPath = this.addMistakes(optimalPath, this.difficulty);

    // 3. Simulate realistic timing
    const clickDelay = this.getClickDelay(this.difficulty);

    // 4. Execute race with delays
    for (const article of actualPath) {
      await sleep(clickDelay);
      // Emit progress updates to make it feel real-time
      emitProgress(article);
    }

    return {
      path: actualPath,
      timeSeconds: actualPath.length * clickDelay / 1000,
      clicks: actualPath.length
    };
  }

  private addMistakes(optimalPath: string[], difficulty: string): string[] {
    const mistakeRate = {
      'easy': 0.6,    // 60% chance to take wrong turn
      'medium': 0.3,  // 30% chance
      'hard': 0.1     // 10% chance (nearly optimal)
    }[difficulty];

    // Add 1-3 extra clicks based on difficulty
    const extraClicks = Math.floor(Math.random() * 4 * mistakeRate);

    // Insert random articles in the path
    // ... implementation details

    return modifiedPath;
  }

  private getClickDelay(difficulty: string): number {
    // Human-like delays between clicks (milliseconds)
    const baseDelay = {
      'easy': 4000,    // 4s per click
      'medium': 2500,  // 2.5s per click
      'hard': 1500     // 1.5s per click
    }[difficulty];

    // Add randomness ±30%
    return baseDelay + (Math.random() - 0.5) * 0.6 * baseDelay;
  }
}
```

**Bot MMR Calculation:**
```typescript
const botMMRByDifficulty = {
  'novice': 300,
  'beginner': 600,
  'intermediate': 1000,
  'advanced': 1500,
  'expert': 2000,
  'master': 2500
};

function selectBotDifficulty(userMmr: number): string {
  // Match bot difficulty to user's approximate level
  if (userMmr < 500) return 'beginner';
  if (userMmr < 1000) return 'intermediate';
  if (userMmr < 1500) return 'advanced';
  if (userMmr < 2000) return 'expert';
  return 'master';
}
```

---

## 5. Pros and Cons

### Advantages ✅

1. **User Retention:**
   - Competitive element increases engagement
   - Social features encourage return visits
   - Ranked progression gives long-term goals

2. **Viral Potential:**
   - "Challenge your friend" feature
   - Shareable battle results
   - Leaderboards encourage competition

3. **Works With Low User Base:**
   - Bot opponents ensure matches always available
   - Async battles don't require simultaneous players
   - Can start with just 10-20 active users

4. **Monetization Opportunities:**
   - Premium users get priority matchmaking
   - Cosmetic rewards for high-rank players
   - Battle pass/season rewards

### Challenges ❌

1. **Technical Complexity:**
   - Real-time infrastructure (WebSockets)
   - MMR calculation and balancing
   - Bot AI development
   - Matchmaking optimization

2. **Development Time:**
   - Estimated 3-4 weeks for MVP
   - Ongoing balancing required
   - Bot behavior tuning

3. **Cheating Prevention:**
   - Users could inspect network requests
   - Open new tabs to search
   - Need anti-cheat measures

4. **Server Costs:**
   - WebSocket connections
   - Real-time message processing
   - Database queries for matchmaking

---

## 6. MVP Implementation Plan

### Phase 1: Async Battles Only (Week 1-2)
- ✅ Database schema
- ✅ Battle creation/completion API
- ✅ Basic MMR calculation
- ✅ Bot opponent system
- ✅ Challenge friends feature
- ❌ NO real-time yet (simpler)

### Phase 2: MMR & Matchmaking (Week 3)
- ✅ Matchmaking queue system
- ✅ MMR-based pairing
- ✅ Leaderboards
- ✅ Player stats dashboard

### Phase 3: Real-time Battles (Week 4+)
- ✅ WebSocket integration
- ✅ Live opponent tracking
- ✅ Race countdown/synchronization
- ✅ Spectator mode

---

## 7. Anti-Cheat Measures

### Detection
```typescript
// Detect impossible speeds
if (clicksPerSecond > 2) {
  flagAsSuspicious(userId, 'too_fast');
}

// Detect identical paths (bot script)
if (pathMatchesPreviousExactly(path)) {
  flagAsSuspicious(userId, 'identical_path');
}

// Detect tab switching
window.addEventListener('blur', () => {
  // Record user left tab
  trackTabSwitch(userId);
});
```

### Prevention
- Rate limit clicks (max 1 click per second)
- Randomize article layouts slightly
- Disable right-click/dev tools during battle
- Server-side path validation

---

## 8. Cost Analysis

### Infrastructure Costs (Monthly)

**With 1,000 active battlers:**
```
WebSocket Server (DigitalOcean Droplet): $12/month
Redis (matchmaking queue):              $10/month
Additional Database Queries:            $5/month
Bandwidth (WebSocket):                  $5/month
──────────────────────────────────────────────
TOTAL:                                  $32/month
```

**Scales linearly:**
- 10,000 users ≈ $100-150/month
- Bot computation is negligible (happens server-side)

---

## 9. Recommendation

### ✅ YES - Implement PvP Battle System

**Reasoning:**
1. **Technically feasible** with existing stack
2. **Legally sound** with proper bot disclosure
3. **Works at any scale** (bots bridge low user count)
4. **High engagement potential** (competitive element)
5. **Reasonable cost** ($30-150/month)

**Start with:**
- Async battles only (MVP)
- Bot opponents for all matches initially
- Friend challenges
- Basic MMR system

**Expand later:**
- Real-time races when user base grows (>500 active)
- Seasonal rankings
- Tournament mode
- Spectator features

---

## 10. User Flow Examples

### Scenario 1: New Player Joins Battle
```
1. User clicks "⚔️ Battle" tab
2. Shows MMR: 1000 (Apprentice)
3. Clicks "Find Opponent"
4. Matchmaking searches for 30s
5. "No players found - Race against Training Bot?"
6. User accepts → Races vs Intermediate Bot
7. Wins → Gains +15 MMR (now 1015)
8. Battle history shows: "Victory vs Training Bot 🤖"
```

### Scenario 2: Experienced Player
```
1. User (MMR 1850, Expert tier) joins queue
2. Finds real opponent (MMR 1820) in 10s
3. Both accept match
4. 3... 2... 1... GO! countdown
5. Race in parallel with live opponent tracker
6. User wins by 5 seconds
7. Gains +12 MMR (opponent loses -12)
8. Victory message: "🏆 You defeated @PlayerName"
```

### Scenario 3: Challenge Friend
```
1. User clicks "Challenge Friend"
2. Selects race: "Pizza → Italy (Medium)"
3. Completes in 2:15, 6 clicks
4. Generates challenge link
5. Friend opens link, sees time to beat
6. Friend completes in 2:30, 7 clicks
7. Original user wins, both gain XP (no MMR change)
```

---

## Summary

**PvP battles are 100% doable and legally fine.** The key is:
- ✅ Clearly label bot opponents
- ✅ Start with async battles (simpler)
- ✅ Use MMR for fair matchmaking
- ✅ Bots bridge the gap until user base grows
- ✅ Reasonable server costs

The system would significantly boost engagement and give WikiHero a unique competitive edge over other learning platforms!
