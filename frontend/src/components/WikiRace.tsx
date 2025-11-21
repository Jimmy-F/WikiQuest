import React, { useState, useEffect, useRef } from 'react';
import './WikiRace.css';

interface Race {
  id: string;
  start: string;
  end: string;
  difficulty: string;
  optimalPath: number;
}

interface WikiRaceProps {
  userId: string;
  onBack: () => void;
}

const WikiRace: React.FC<WikiRaceProps> = ({ userId, onBack }) => {
  const [gameState, setGameState] = useState<'select' | 'racing' | 'finished' | 'history'>('select');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [currentRaceId, setCurrentRaceId] = useState<string>('');
  const [currentArticle, setCurrentArticle] = useState<string>('');
  const [targetArticle, setTargetArticle] = useState<string>('');
  const [path, setPath] = useState<string[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [articleContent, setArticleContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [raceHistory, setRaceHistory] = useState<any[]>([]);
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<string[]>([]);
  const [searchingStart, setSearchingStart] = useState<boolean>(false);
  const [searchingEnd, setSearchingEnd] = useState<boolean>(false);
  const [hasSearchedStart, setHasSearchedStart] = useState<boolean>(false);
  const [hasSearchedEnd, setHasSearchedEnd] = useState<boolean>(false);
  const [validatingStart, setValidatingStart] = useState<boolean>(false);
  const [validatingEnd, setValidatingEnd] = useState<boolean>(false);
  const [raceAttempts, setRaceAttempts] = useState<{[key: string]: number}>({});
  const [showOptimalCelebration, setShowOptimalCelebration] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const difficultyColors = {
    easy: '#10b981',
    medium: '#3b82f6',
    hard: '#f59e0b',
    expert: '#ef4444'
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'racing') {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  // Load race attempt counts
  useEffect(() => {
    if (gameState === 'select') {
      loadRaceAttempts();
    }
  }, [gameState, userId]);

  const loadRaceAttempts = async () => {
    try {
      const response = await fetch(`/api/wikirace/history/${userId}?limit=1000`);
      const data = await response.json();
      const races = data.races || [];

      // Count attempts per race_id
      const counts: {[key: string]: number} = {};
      races.forEach((race: any) => {
        if (!race.is_custom) {
          counts[race.race_id] = (counts[race.race_id] || 0) + 1;
        }
      });

      setRaceAttempts(counts);
    } catch (error) {
      console.error('Error loading race attempts:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRace = async (race: Race, custom: boolean = false) => {
    setSelectedRace(race);
    setCurrentArticle(race.start);
    setTargetArticle(race.end);
    setPath([race.start]);
    setTimer(0);
    setIsCustom(custom);
    setGameState('racing');

    try {
      const response = await fetch('/api/wikirace/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          raceId: race.id,
          startArticle: race.start,
          endArticle: race.end,
          isCustom: custom
        })
      });

      const data = await response.json();
      setCurrentRaceId(data.race.id);

      // Load first article
      await loadArticle(race.start);
    } catch (error) {
      console.error('Error starting race:', error);
    }
  };

  const searchArticles = (query: string, setterFn: (suggestions: string[]) => void, setLoadingFn: (loading: boolean) => void, setHasSearchedFn: (searched: boolean) => void) => {
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (query.length < 1) {
      setterFn([]);
      setLoadingFn(false);
      setHasSearchedFn(false);
      return;
    }

    setLoadingFn(true);
    setHasSearchedFn(false);

    // Debounce search - wait 300ms after user stops typing
    searchTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/wikirace/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setterFn(data.suggestions || []);
      } catch (error) {
        console.error('Error searching articles:', error);
        setterFn([]);
      } finally {
        setLoadingFn(false);
        setHasSearchedFn(true);
      }
    }, 300);
  };

  const validateArticle = async (article: string): Promise<{ exists: boolean; title: string }> => {
    try {
      const response = await fetch(`/api/wikirace/validate/${encodeURIComponent(article)}`);
      const data = await response.json();
      return { exists: data.exists, title: data.suggested };
    } catch (error) {
      console.error('Error validating article:', error);
      return { exists: false, title: article };
    }
  };

  const startCustomRace = async () => {
    if (!customStart.trim() || !customEnd.trim()) {
      alert('Please enter both start and end articles!');
      return;
    }

    // Validate both articles
    setValidatingStart(true);
    setValidatingEnd(true);

    const startValidation = await validateArticle(customStart.trim());
    const endValidation = await validateArticle(customEnd.trim());

    setValidatingStart(false);
    setValidatingEnd(false);

    if (!startValidation.exists) {
      alert(`Start article "${customStart}" not found on Wikipedia. Please check the spelling.`);
      return;
    }

    if (!endValidation.exists) {
      alert(`End article "${customEnd}" not found on Wikipedia. Please check the spelling.`);
      return;
    }

    const customRace: Race = {
      id: 'custom',
      start: startValidation.title,
      end: endValidation.title,
      difficulty: 'custom',
      optimalPath: 0
    };

    setShowCustomForm(false);
    setCustomStart('');
    setCustomEnd('');
    setStartSuggestions([]);
    setEndSuggestions([]);
    startRace(customRace, true);
  };

  const loadRaceHistory = async () => {
    try {
      const response = await fetch(`/api/wikirace/history/${userId}?limit=50`);
      const data = await response.json();
      setRaceHistory(data.races || []);
      setGameState('history');
    } catch (error) {
      console.error('Error loading race history:', error);
    }
  };

  const loadArticle = async (articleName: string) => {
    setLoading(true);
    try {
      // Fetch Wikipedia article
      const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(articleName)}&format=json&origin=*&prop=text`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.parse && data.parse.text) {
        // Extract links from the content
        const content = data.parse.text['*'];
        setArticleContent(content);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('/wiki/')) {
      event.preventDefault();

      const href = target.getAttribute('href');
      if (!href) return;

      // Extract article name from href
      const articleName = decodeURIComponent(href.replace('/wiki/', '')).replace(/_/g, ' ');

      // Skip special pages, files, categories
      if (articleName.includes(':')) return;

      // Track click
      try {
        const response = await fetch(`/api/wikirace/${currentRaceId}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article: articleName })
        });

        const data = await response.json();

        setPath(data.path);
        setCurrentArticle(articleName);

        if (data.completed) {
          // Race finished!
          await completeRace();
        } else {
          // Load next article
          await loadArticle(articleName);
        }
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }
  };

  const completeRace = async () => {
    try {
      const response = await fetch(`/api/wikirace/${currentRaceId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      setResult(data);
      setGameState('finished');

      // Check if user beat the optimal path
      if (!isCustom && data.clicks < data.optimalPath) {
        setShowOptimalCelebration(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowOptimalCelebration(false), 5000);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Error completing race:', error);
    }
  };

  const resetRace = () => {
    setGameState('select');
    setSelectedRace(null);
    setCurrentRaceId('');
    setCurrentArticle('');
    setTargetArticle('');
    setPath([]);
    setTimer(0);
    setArticleContent('');
    setResult(null);
  };

  // Render race selection
  if (gameState === 'select') {
    const races: Race[] = [
      // Easy
      { id: 'easy-1', start: 'Water', end: 'Ocean', difficulty: 'easy', optimalPath: 3 },
      { id: 'easy-2', start: 'Sun', end: 'Solar System', difficulty: 'easy', optimalPath: 2 },
      { id: 'easy-3', start: 'Dog', end: 'Wolf', difficulty: 'easy', optimalPath: 2 },
      // Medium
      { id: 'medium-1', start: 'Pizza', end: 'Italy', difficulty: 'medium', optimalPath: 3 },
      { id: 'medium-2', start: 'Guitar', end: 'Music', difficulty: 'medium', optimalPath: 2 },
      { id: 'medium-3', start: 'Basketball', end: 'United States', difficulty: 'medium', optimalPath: 3 },
      // Hard
      { id: 'hard-1', start: 'Mathematics', end: 'Pizza', difficulty: 'hard', optimalPath: 5 },
      { id: 'hard-2', start: 'Ancient Egypt', end: 'Computer', difficulty: 'hard', optimalPath: 6 },
      // Expert
      { id: 'expert-1', start: 'DNA', end: 'Symphony', difficulty: 'expert', optimalPath: 8 },
      { id: 'expert-2', start: 'Photosynthesis', end: 'World War II', difficulty: 'expert', optimalPath: 9 }
    ];

    return (
      <div className="wikirace-container">
        <div className="top-actions">
          <button className="back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <button className="history-button" onClick={loadRaceHistory}>
            📊 View History
          </button>
        </div>

        <div className="wikirace-header">
          <h1>🏁 Wiki Race</h1>
          <p>Navigate from one article to another by clicking links!</p>
        </div>

        <div className="custom-race-section">
          {!showCustomForm ? (
            <button className="create-custom-btn" onClick={() => setShowCustomForm(true)}>
              ✨ Create Custom Race
            </button>
          ) : (
            <div className="custom-race-form">
              <h3>Create Your Own Race</h3>
              <div className="form-row">
                <div className="autocomplete-wrapper">
                  <input
                    type="text"
                    placeholder="Start Article (e.g., Coffee)"
                    value={customStart}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      searchArticles(e.target.value, setStartSuggestions, setSearchingStart, setHasSearchedStart);
                    }}
                    className="custom-input"
                  />
                  {searchingStart && (
                    <div className="suggestions-dropdown">
                      <div className="suggestion-loading">Searching...</div>
                    </div>
                  )}
                  {!searchingStart && startSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {startSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => {
                            setCustomStart(suggestion);
                            setStartSuggestions([]);
                            setHasSearchedStart(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchingStart && hasSearchedStart && customStart.length > 0 && startSuggestions.length === 0 && (
                    <div className="suggestions-dropdown">
                      <div className="suggestion-empty">No articles found - try a different search</div>
                    </div>
                  )}
                </div>
                <span className="arrow-icon">→</span>
                <div className="autocomplete-wrapper">
                  <input
                    type="text"
                    placeholder="End Article (e.g., Mount Everest)"
                    value={customEnd}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      searchArticles(e.target.value, setEndSuggestions, setSearchingEnd, setHasSearchedEnd);
                    }}
                    className="custom-input"
                  />
                  {searchingEnd && (
                    <div className="suggestions-dropdown">
                      <div className="suggestion-loading">Searching...</div>
                    </div>
                  )}
                  {!searchingEnd && endSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {endSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => {
                            setCustomEnd(suggestion);
                            setEndSuggestions([]);
                            setHasSearchedEnd(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchingEnd && hasSearchedEnd && customEnd.length > 0 && endSuggestions.length === 0 && (
                    <div className="suggestions-dropdown">
                      <div className="suggestion-empty">No articles found - try a different search</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="btn-start-custom"
                  onClick={startCustomRace}
                  disabled={validatingStart || validatingEnd}
                >
                  {validatingStart || validatingEnd ? 'Validating...' : 'Start Race'}
                </button>
                <button className="btn-cancel-custom" onClick={() => {
                  setShowCustomForm(false);
                  setCustomStart('');
                  setCustomEnd('');
                  setStartSuggestions([]);
                  setEndSuggestions([]);
                  setSearchingStart(false);
                  setSearchingEnd(false);
                  setHasSearchedStart(false);
                  setHasSearchedEnd(false);
                }}>
                  Cancel
                </button>
              </div>
              <p className="custom-note">⚠️ Custom races don't earn XP</p>
            </div>
          )}
        </div>

        <h2 className="section-title">Official Races (Earn XP)</h2>
        <div className="races-grid">
          {races.map(race => {
            const attempts = raceAttempts[race.id] || 0;
            return (
              <div key={race.id} className="race-card" onClick={() => startRace(race, false)}>
                <div className="race-difficulty" style={{ backgroundColor: difficultyColors[race.difficulty as keyof typeof difficultyColors] }}>
                  {race.difficulty.toUpperCase()}
                </div>
                <div className="race-info">
                  <div className="race-route">
                    <span className="start-article">{race.start}</span>
                    <span className="arrow">→</span>
                    <span className="end-article">{race.end}</span>
                  </div>
                  <div className="race-stats">
                    <span>🎯 Optimal: {race.optimalPath} clicks</span>
                    <span className="xp-badge">+{race.difficulty === 'easy' ? '50' : race.difficulty === 'medium' ? '75' : race.difficulty === 'hard' ? '100' : '150'} XP</span>
                  </div>
                  {attempts > 0 && (
                    <div className="race-attempts">
                      📊 {attempts} attempt{attempts !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render racing view
  if (gameState === 'racing') {
    return (
      <div className="wikirace-game">
        <div className="game-header">
          <button className="quit-button" onClick={resetRace}>
            Quit Race
          </button>
          <div className="race-progress">
            <div className="current-location">
              <span className="label">Current:</span>
              <span className="article-name">{currentArticle}</span>
            </div>
            <div className="target-location">
              <span className="label">Target:</span>
              <span className="article-name target">{targetArticle}</span>
            </div>
          </div>
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(timer)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Clicks</span>
              <span className="stat-value">{path.length - 1}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Optimal</span>
              <span className="stat-value">{selectedRace?.optimalPath}</span>
            </div>
          </div>
        </div>

        <div className="article-viewer">
          {loading ? (
            <div className="loading">Loading article...</div>
          ) : (
            <div className="article-content-wrapper">
              <div className="wikipedia-attribution">
                📖 Content from <a href={`https://en.wikipedia.org/wiki/${currentArticle.replace(/ /g, '_')}`} target="_blank" rel="noopener noreferrer">Wikipedia</a> - Licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
              </div>
              <div
                className="article-content"
                onClick={handleLinkClick}
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            </div>
          )}
        </div>

        <div className="path-tracker">
          <h3>Your Path:</h3>
          <div className="path-items">
            {path.map((article, idx) => (
              <React.Fragment key={idx}>
                <span className="path-item">{article}</span>
                {idx < path.length - 1 && <span className="path-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render results
  if (gameState === 'finished' && result) {
    const getMedalEmoji = (medal: string) => {
      if (medal === 'gold') return '🥇';
      if (medal === 'silver') return '🥈';
      return '🥉';
    };

    return (
      <div className="wikirace-results">
        {/* Optimal Path Celebration */}
        {showOptimalCelebration && (
          <div className="optimal-celebration-overlay" onClick={() => setShowOptimalCelebration(false)}>
            <div className="optimal-celebration-content">
              <div className="optimal-badge">
                <div className="optimal-icon">⚡</div>
                <div className="optimal-particles">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="optimal-particle" style={{
                      '--angle': `${(i / 20) * 360}deg`,
                      '--delay': `${i * 0.05}s`
                    } as React.CSSProperties} />
                  ))}
                </div>
              </div>
              <h2 className="optimal-title">BEAT THE OPTIMAL PATH!</h2>
              <p className="optimal-subtitle">
                You completed this race in {result.clicks} clicks - better than the optimal {result.optimalPath}!
              </p>
              <div className="optimal-achievement-text">🎯 Pathfinder Achievement Progress</div>
            </div>
          </div>
        )}

        <div className="results-header">
          <h1>{getMedalEmoji(result.medal)} Race Complete!</h1>
          <p className="results-message">{result.message}</p>
          {!isCustom && !result.isFirstCompletion && result.xpEarned === 0 && (
            <div className="repeat-race-notice">
              ⚠️ XP only awarded on first completion of each race
            </div>
          )}
          {!isCustom && result.isFirstCompletion && result.xpEarned > 0 && (
            <div className="first-completion-notice">
              🎉 First time completion bonus!
            </div>
          )}
        </div>

        <div className="results-stats">
          <div className="result-stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(result.timeSeconds)}</span>
          </div>
          <div className="result-stat">
            <span className="stat-label">Clicks</span>
            <span className="stat-value">{result.clicks}</span>
          </div>
          <div className="result-stat">
            <span className="stat-label">Optimal</span>
            <span className="stat-value">{result.optimalPath}</span>
          </div>
          <div className="result-stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{result.score}/100</span>
          </div>
          {!isCustom && (
            <div className="result-stat">
              <span className="stat-label">XP Earned</span>
              <span className={`stat-value ${result.xpEarned > 0 ? 'xp' : 'no-xp'}`}>
                {result.xpEarned > 0 ? `+${result.xpEarned}` : '0'} XP
              </span>
            </div>
          )}
        </div>

        <div className="results-path">
          <h3>Your Path:</h3>
          <div className="path-visualization">
            {result.path.map((article: string, idx: number) => (
              <React.Fragment key={idx}>
                <div className="path-node">
                  <span className="node-number">{idx + 1}</span>
                  <span className="node-article">{article}</span>
                </div>
                {idx < result.path.length - 1 && (
                  <div className="path-connector">↓</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="results-actions">
          <button
            className="btn-primary"
            onClick={() => {
              if (selectedRace) {
                startRace(selectedRace, isCustom);
              }
            }}
          >
            🔄 Try This Race Again
          </button>
          <button className="btn-secondary" onClick={resetRace}>
            Browse Races
          </button>
          <button className="btn-tertiary" onClick={onBack}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render race history
  if (gameState === 'history') {
    const getMedalEmoji = (medal: string) => {
      if (medal === 'gold') return '🥇';
      if (medal === 'silver') return '🥈';
      return '🥉';
    };

    return (
      <div className="wikirace-history">
        <div className="top-actions">
          <button className="back-button" onClick={() => setGameState('select')}>
            ← Back to Races
          </button>
        </div>

        <div className="history-header">
          <h1>📊 Race History</h1>
          <p>Your completed Wiki Races</p>
        </div>

        {raceHistory.length === 0 ? (
          <div className="no-history">
            <p>No completed races yet. Start your first race!</p>
            <button className="btn-primary" onClick={() => setGameState('select')}>
              Browse Races
            </button>
          </div>
        ) : (
          <div className="history-list">
            {raceHistory.map((race: any) => (
              <div key={race.id} className={`history-card ${race.is_custom ? 'custom-race' : ''}`}>
                <div className="history-card-header">
                  <div className="history-route">
                    <span className="start-article">{race.start_article}</span>
                    <span className="arrow">→</span>
                    <span className="end-article">{race.end_article}</span>
                  </div>
                  <div className="history-badges">
                    {race.is_custom ? (
                      <span className="custom-badge">Custom</span>
                    ) : (
                      <>
                        <span className="difficulty-badge" style={{ backgroundColor: difficultyColors[race.difficulty as keyof typeof difficultyColors] }}>
                          {race.difficulty.toUpperCase()}
                        </span>
                        <span className="medal-badge">{getMedalEmoji(race.medal)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="history-stats">
                  <div className="history-stat">
                    <span className="stat-icon">⏱️</span>
                    <span>{formatTime(race.time_seconds)}</span>
                  </div>
                  <div className="history-stat">
                    <span className="stat-icon">👆</span>
                    <span>{race.clicks_count} clicks</span>
                  </div>
                  {!race.is_custom && (
                    <>
                      <div className="history-stat">
                        <span className="stat-icon">🎯</span>
                        <span>{race.score}/100</span>
                      </div>
                      <div className="history-stat xp-stat">
                        <span className="stat-icon">✨</span>
                        <span>
                          {race.medal === 'gold'
                            ? Math.floor((race.difficulty === 'easy' ? 50 : race.difficulty === 'medium' ? 75 : race.difficulty === 'hard' ? 100 : 150) * 1.5)
                            : race.medal === 'silver'
                            ? Math.floor((race.difficulty === 'easy' ? 50 : race.difficulty === 'medium' ? 75 : race.difficulty === 'hard' ? 100 : 150) * 1.25)
                            : (race.difficulty === 'easy' ? 50 : race.difficulty === 'medium' ? 75 : race.difficulty === 'hard' ? 100 : 150)
                          } XP
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="history-footer">
                  <div className="history-date">
                    Completed: {new Date(race.completed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {race.is_custom && (
                    <button
                      className="play-again-btn"
                      onClick={() => {
                        const customRace: Race = {
                          id: 'custom',
                          start: race.start_article,
                          end: race.end_article,
                          difficulty: 'custom',
                          optimalPath: 0
                        };
                        startRace(customRace, true);
                      }}
                    >
                      🔄 Play Again
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default WikiRace;
