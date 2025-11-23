# PvP Player vs Player System Design

## System Architecture Overview

### Matchmaking Approaches

We'll implement **3 matchmaking modes**:

1. **Quick Match** - Automatic matchmaking by MMR
2. **Lobby System** - Create/join public lobbies
3. **Direct Invite** - Private battles via shareable link

---

## 1. Quick Match (Auto Matchmaking)

### Flow:
```
Player clicks "Quick Match"
  ↓
Join matchmaking queue with MMR
  ↓
Poll queue every 2s for opponent
  ↓
Match found! (±200 MMR range)
  ↓
Both players redirected to battle
  ↓
Race starts when both ready
```

### Backend Tables:
Already exists: `matchmaking_queue`
```sql
- user_id
- mmr
- preferred_race_id (optional)
- status (searching/matched/cancelled)
- created_at
```

### API Endpoints:
- `POST /api/matchmaking/queue/join` - Join queue
- `GET /api/matchmaking/queue/status/:userId` - Poll for match
- `POST /api/matchmaking/queue/cancel` - Leave queue
- `POST /api/matchmaking/match/:matchId/ready` - Mark ready

---

## 2. Lobby System (Public Rooms)

### Flow:
```
Host creates lobby with race selection
  ↓
Shareable lobby code generated (e.g., "XY7K")
  ↓
Lobby visible in public list OR shared via code
  ↓
Players join lobby (max 2 for 1v1)
  ↓
Host starts when ready
  ↓
Both race simultaneously
```

### Backend Tables:
New: `battle_lobbies`
```sql
CREATE TABLE battle_lobbies (
  id UUID PRIMARY KEY,
  lobby_code TEXT UNIQUE,
  host_id UUID REFERENCES users(id),
  race_id TEXT NOT NULL,
  start_article TEXT NOT NULL,
  end_article TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  max_players INTEGER DEFAULT 2,
  status TEXT DEFAULT 'waiting', -- waiting/in_progress/completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE lobby_participants (
  lobby_id UUID REFERENCES battle_lobbies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'joined', -- joined/ready/racing/finished
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lobby_id, user_id)
);
```

### API Endpoints:
- `POST /api/lobbies/create` - Create lobby
- `GET /api/lobbies/list` - List public lobbies
- `GET /api/lobbies/:code` - Get lobby details
- `POST /api/lobbies/:code/join` - Join lobby
- `POST /api/lobbies/:code/ready` - Toggle ready
- `POST /api/lobbies/:code/start` - Start battle (host only)
- `POST /api/lobbies/:code/leave` - Leave lobby

---

## 3. Direct Invite System

### Flow:
```
Player creates private battle
  ↓
Shareable invite link generated
  ↓
Copy link: https://wikihero.app/battle/invite/abc123
  ↓
Friend clicks link → Joins battle
  ↓
Both ready → Race starts
```

### Backend:
Uses same `battle_lobbies` table with `is_public = false`

### Invite Link Format:
- Short code: `ABC123` (6 chars)
- Full URL: `https://wikihero.app/battle/invite/ABC123`
- Expires: 1 hour if not started

---

## Real-time Communication

### Without WebSockets (Polling Approach):

**Why polling instead of WebSockets?**
- Simpler implementation
- No persistent connections needed
- Docker-friendly (no connection state)
- Good enough for turn-based racing

**Polling Strategy:**
```javascript
// Frontend polls every 2 seconds
useEffect(() => {
  const interval = setInterval(() => {
    checkMatchStatus();
  }, 2000);
  return () => clearInterval(interval);
}, []);
```

**What we poll:**
- Matchmaking queue status
- Lobby participant status
- Opponent race progress (clicks/time)

---

## Race Tracking for PvP

### Database Update:
Extend `battle_matches` to support real players:
```sql
-- Already has:
player1_id, player2_id, player2_is_bot

-- Add real-time tracking:
player1_current_article TEXT,
player2_current_article TEXT,
player1_last_update TIMESTAMPTZ,
player2_last_update TIMESTAMPTZ
```

### During Race:
Each click sends update:
```javascript
POST /api/battles/:matchId/update
{
  userId: "...",
  currentArticle: "France",
  clicks: 3,
  timeElapsed: 45
}
```

Opponent polls for updates:
```javascript
GET /api/battles/:matchId/progress
// Returns both players' current progress
```

---

## UI/UX Design

### Quick Match Screen:
```
┌─────────────────────────────────────┐
│  🎯 Quick Match                     │
│                                     │
│  [Easy] [Medium] [Hard] [Expert]   │ ← Select difficulty
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔍 Searching for opponent  │   │
│  │                             │   │
│  │  Your MMR: 1250            │   │
│  │  Looking for: 1050-1450    │   │
│  │                             │   │
│  │  ⏱️ 0:23 elapsed            │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Cancel Search]                   │
└─────────────────────────────────────┘
```

### Lobby Browser:
```
┌─────────────────────────────────────┐
│  🏛️ Public Lobbies                  │
│                                     │
│  [Create Lobby] [Join by Code]     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔥 Pizza → Italy (Medium)   │   │
│  │ Host: Player#1234           │   │
│  │ Players: 1/2  Code: XY7K    │   │
│  │            [Join] [Spectate]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚡ Water → Ocean (Easy)     │   │
│  │ Host: Player#5678           │   │
│  │ Players: 1/2  Code: AB3C    │   │
│  │            [Join] [Spectate]│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Lobby Waiting Room:
```
┌─────────────────────────────────────┐
│  Lobby: XY7K                        │
│  Race: Pizza → Italy (Medium)       │
│                                     │
│  Players:                           │
│  ┌─────────────────────────────┐   │
│  │ 👤 You (Host)      [Ready ✓]│   │
│  │ 👤 Player#1234     [Ready ✓]│   │
│  └─────────────────────────────┘   │
│                                     │
│  📋 Invite Link:                    │
│  https://wikihero.app/invite/XY7K  │
│  [Copy Link]                        │
│                                     │
│  [Start Battle]  [Leave Lobby]     │
└─────────────────────────────────────┘
```

### Live Race Screen:
```
┌─────────────────────────────────────┐
│  You: Water → Ocean                 │
│  ⏱️ 0:45  👆 3 clicks                │
│                                     │
│  Opponent Progress:                 │
│  ┌─────────────────────────────┐   │
│  │ 👤 Player#1234              │   │
│  │ 📍 Currently at: Earth       │   │
│  │ ⏱️ 0:42  👆 2 clicks          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Wikipedia Article Content...]    │
└─────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Direct Invite (Simplest)
- Create private lobby
- Generate invite code
- Join via code
- Start when both ready
- **Estimated time:** 3-4 hours

### Phase 2: Lobby System
- Public lobby list
- Join/leave lobbies
- Lobby chat (optional)
- **Estimated time:** 4-5 hours

### Phase 3: Quick Match
- Matchmaking queue
- MMR-based matching
- Auto-start when matched
- **Estimated time:** 3-4 hours

---

## Security Considerations

1. **Rate Limiting:**
   - Max 10 matchmaking queue joins per hour
   - Max 5 lobby creates per hour

2. **Validation:**
   - Verify user is in lobby before starting
   - Check MMR manipulation
   - Validate race completion

3. **Cleanup:**
   - Auto-delete lobbies after 1 hour inactive
   - Remove abandoned matchmaking queue entries after 5 min
   - Clean up expired invite links

4. **Anti-Cheat:**
   - Track click timing (no faster than 0.5s per click)
   - Verify path exists in Wikipedia
   - Compare with bot optimal paths

---

## Cost Analysis

**Database:**
- 2 new tables (lobbies + participants)
- Minimal storage (~10KB per lobby)

**API Calls:**
- Polling: ~0.5 req/sec per active player
- For 100 concurrent battles: 50 req/sec
- Well within limits

**No WebSocket Costs:**
- No persistent connection overhead
- Scales horizontally easily

---

## Next Steps

1. Create database migration for lobby tables
2. Implement lobby backend API
3. Add Direct Invite UI first (simplest flow)
4. Test 2-player race with invite
5. Add public lobby browser
6. Implement matchmaking queue last

---

## Open Questions

1. **Spectating?** Allow others to watch ongoing battles?
2. **Best of 3?** Multiple races in one match?
3. **Chat?** In-lobby text chat?
4. **Tournaments?** Bracket-style competitions?
5. **Ranked Seasons?** MMR resets every season?

These can be Phase 4+ features.
