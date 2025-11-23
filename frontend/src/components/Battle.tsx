import React, { useState, useEffect } from 'react';
import './Battle.css';

interface BattleProps {
  userId: string;
  onBack: () => void;
}

interface BattleStats {
  mmr: number;
  tier: string;
  total_battles: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
  best_win_streak: number;
}

interface Race {
  id: string;
  start: string;
  end: string;
  difficulty: string;
  optimalPath: number;
}

const Battle: React.FC<BattleProps> = ({ userId, onBack }) => {
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const races: Race[] = [
    { id: 'easy-1', start: 'Water', end: 'Ocean', difficulty: 'easy', optimalPath: 3 },
    { id: 'easy-2', start: 'Sun', end: 'Solar System', difficulty: 'easy', optimalPath: 2 },
    { id: 'medium-1', start: 'Pizza', end: 'Italy', difficulty: 'medium', optimalPath: 3 },
    { id: 'medium-2', start: 'Guitar', end: 'Music', difficulty: 'medium', optimalPath: 2 },
    { id: 'hard-1', start: 'Mathematics', end: 'Pizza', difficulty: 'hard', optimalPath: 5 },
    { id: 'hard-2', start: 'Ancient Egypt', end: 'Computer', difficulty: 'hard', optimalPath: 6 }
  ];

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/battles/stats/${userId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading battle stats:', error);
    }
  };

  const startBattle = async (race: Race) => {
    setLoading(true);
    setSelectedRace(race);
    setResult(null);

    try {
      const response = await fetch('/api/battles/vs-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          raceId: race.id,
          startArticle: race.start,
          endArticle: race.end,
          difficulty: race.difficulty
        })
      });

      const data = await response.json();
      setBattleId(data.match.id);
      setBotDifficulty(data.botDifficulty);

      // Redirect to WikiRace to actually race
      // For now, simulate completion for demo
      setTimeout(() => simulateCompletion(data.match.id, race), 2000);
    } catch (error) {
      console.error('Error starting battle:', error);
      setLoading(false);
    }
  };

  const simulateCompletion = async (matchId: string, race: Race) => {
    // Simulate player completing the race
    const playerTime = 15 + Math.floor(Math.random() * 20);
    const playerClicks = race.optimalPath + Math.floor(Math.random() * 3);

    try {
      const response = await fetch(`/api/battles/${matchId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          time: playerTime,
          clicks: playerClicks,
          path: [race.start, 'Intermediate', race.end]
        })
      });

      const data = await response.json();
      setResult(data);
      setLoading(false);
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error completing battle:', error);
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: {[key: string]: string} = {
      'Novice': '#94a3b8',
      'Apprentice': '#10b981',
      'Scholar': '#3b82f6',
      'Expert': '#8b5cf6',
      'Master': '#f59e0b',
      'Legend': '#ef4444'
    };
    return colors[tier] || '#64748b';
  };

  if (loading && battleId) {
    return (
      <div className="battle-container">
        <div className="battle-loading">
          <div className="battle-vs">
            <div className="vs-player">
              <div className="vs-avatar">👤</div>
              <div className="vs-name">You</div>
              <div className="vs-mmr">{stats?.mmr || 1000} MMR</div>
            </div>

            <div className="vs-text">VS</div>

            <div className="vs-player">
              <div className="vs-avatar">🤖</div>
              <div className="vs-name">Training Bot</div>
              <div className="vs-difficulty">{botDifficulty}</div>
            </div>
          </div>
          <div className="loading-text">Battle in progress...</div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="battle-container">
        <div className="battle-result">
          <div className={`result-header ${result.result === 'player1' ? 'victory' : 'defeat'}`}>
            <div className="result-icon">
              {result.result === 'player1' ? '🏆' : '😢'}
            </div>
            <h2>{result.message}</h2>
          </div>

          <div className="result-stats">
            <div className="result-comparison">
              <div className="comparison-column">
                <h3>You</h3>
                <div className="stat">⏱️ {result.playerTime}s</div>
                <div className="stat">👆 {result.playerClicks} clicks</div>
              </div>

              <div className="comparison-vs">VS</div>

              <div className="comparison-column">
                <h3>🤖 Bot</h3>
                <div className="stat">⏱️ {result.botTime}s</div>
                <div className="stat">👆 {result.botClicks} clicks</div>
              </div>
            </div>

            <div className="mmr-change">
              <div className={`mmr-delta ${result.mmrChange >= 0 ? 'positive' : 'negative'}`}>
                {result.mmrChange >= 0 ? '+' : ''}{result.mmrChange} MMR
              </div>
              <div className="new-mmr">
                New Rating: {result.newMMR} MMR ({result.newTier})
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button className="btn-primary" onClick={() => { setResult(null); setBattleId(null); }}>
              Battle Again
            </button>
            <button className="btn-secondary" onClick={onBack}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-container">
      <div className="battle-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>⚔️ Battle Arena</h1>
        <p>Compete against opponents to climb the ranks!</p>
      </div>

      {stats && (
        <div className="battle-stats-card">
          <div className="stats-header">
            <div className="player-tier" style={{ backgroundColor: getTierColor(stats.tier) }}>
              {stats.tier}
            </div>
            <div className="player-mmr">{stats.mmr} MMR</div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Battles</div>
              <div className="stat-value">{stats.total_battles}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Wins</div>
              <div className="stat-value">{stats.wins}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Win Rate</div>
              <div className="stat-value">
                {stats.total_battles > 0 ? Math.round((stats.wins / stats.total_battles) * 100) : 0}%
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Win Streak</div>
              <div className="stat-value">{stats.win_streak} 🔥</div>
            </div>
          </div>
        </div>
      )}

      <div className="battle-modes">
        <h2>🤖 Battle vs Bot</h2>
        <p>Practice against AI opponents matched to your skill level</p>

        <div className="races-grid">
          {races.map(race => (
            <div key={race.id} className="race-card" onClick={() => startBattle(race)}>
              <div className={`race-difficulty difficulty-${race.difficulty}`}>
                {race.difficulty.toUpperCase()}
              </div>
              <div className="race-info">
                <div className="race-route">
                  <span>{race.start}</span>
                  <span className="arrow">→</span>
                  <span>{race.end}</span>
                </div>
                <div className="race-optimal">
                  🎯 Optimal: {race.optimalPath} clicks
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Battle;
