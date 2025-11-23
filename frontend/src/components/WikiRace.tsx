import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  onBattleComplete?: () => void;
  activeBattleFromParent?: any;
}

const WikiRace: React.FC<WikiRaceProps> = ({ userId, onBack, onBattleComplete, activeBattleFromParent }) => {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [raceMode, setRaceMode] = useState<'solo' | 'bot' | 'player' | 'stats'>('solo');
  const [gameState, setGameState] = useState<'select' | 'racing' | 'finished' | 'history' | 'waiting'>('select');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [battleStats, setBattleStats] = useState<any>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [lobby, setLobby] = useState<any>(null);
  const [lobbyParticipants, setLobbyParticipants] = useState<any[]>([]);
  const [lobbyView, setLobbyView] = useState<'menu' | 'create' | 'join' | 'waiting' | 'browse' | 'matchmaking'>('menu');
  const [joinCode, setJoinCode] = useState<string>('');
  const [publicLobbies, setPublicLobbies] = useState<any[]>([]);
  const [opponentProgress, setOpponentProgress] = useState<any>(null);
  const [gameMode, setGameMode] = useState<'ranked' | 'casual'>('ranked');
  const [matchmakingQueue, setMatchmakingQueue] = useState<any>(null);
  const [matchmakingWaitTime, setMatchmakingWaitTime] = useState<number>(0);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const lobbyPollingRef = useRef<NodeJS.Timeout | null>(null);
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
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [validatingStart, setValidatingStart] = useState<boolean>(false);
  const [validatingEnd, setValidatingEnd] = useState<boolean>(false);
  const [raceAttempts, setRaceAttempts] = useState<{[key: string]: number}>({});
  const [raceMedals, setRaceMedals] = useState<{[key: string]: string}>({});
  const [showOptimalCelebration, setShowOptimalCelebration] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewRace, setPreviewRace] = useState<Race | null>(null);
  const [raceStats, setRaceStats] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitingPollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
      if (waitingPollingRef.current) {
        clearInterval(waitingPollingRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [gameState]);

  // Load race attempt counts
  useEffect(() => {
    if (gameState === 'select') {
      loadRaceAttempts();
    }
  }, [gameState, userId]);

  // Check for active battles on mount
  useEffect(() => {
    checkActiveBattle();
  }, [userId]);

  // Auto-rejoin when parent detects active battle
  useEffect(() => {
    if (activeBattleFromParent && gameState === 'select' && !battleId) {
      // Parent has detected an active battle, rejoin it
      setActiveBattle(activeBattleFromParent);
      rejoinBattle();
    }
  }, [activeBattleFromParent]);

  // Load battle stats when switching to competitive modes
  useEffect(() => {
    if (raceMode === 'bot' || raceMode === 'player' || raceMode === 'stats') {
      loadBattleStats();
    }
  }, [raceMode, userId]);

  // Handle invite code from URL
  useEffect(() => {
    if (code && code.length === 6) {
      // Automatically switch to player mode and join the lobby
      setRaceMode('player');
      setGameState('select');

      // Small delay to ensure UI is ready
      setTimeout(async () => {
        await joinLobby(code);
        // Clear the URL after joining
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  }, [code]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (lobbyPollingRef.current) {
        clearInterval(lobbyPollingRef.current);
        lobbyPollingRef.current = null;
      }
    };
  }, []);

  const loadBattleStats = async () => {
    try {
      const response = await fetch(`/api/battles/stats/${userId}`);
      const data = await response.json();
      setBattleStats(data);
    } catch (error) {
      console.error('Error loading battle stats:', error);
    }
  };

  const checkActiveBattle = async () => {
    try {
      const response = await fetch(`/api/battles/active/${userId}`);
      const data = await response.json();
      if (data.activeBattle) {
        setActiveBattle(data.activeBattle);
      }
    } catch (error) {
      console.error('Error checking active battle:', error);
    }
  };

  const rejoinBattle = async () => {
    if (!activeBattle) return;

    // Determine which player we are
    const isPlayer1 = activeBattle.player1_id === userId;
    const currentArticle = isPlayer1 ? activeBattle.player1_current_article : activeBattle.player2_current_article;
    const savedTime = isPlayer1 ? activeBattle.player1_time : activeBattle.player2_time;
    const savedClicks = isPlayer1 ? activeBattle.player1_clicks : activeBattle.player2_clicks;

    setBattleId(activeBattle.id);
    setSelectedRace({
      id: activeBattle.race_id,
      start: activeBattle.start_article,
      end: activeBattle.end_article,
      difficulty: activeBattle.difficulty,
      optimalPath: 5
    });

    // Restore saved state or start from beginning
    const articleToLoad = currentArticle || activeBattle.start_article;
    setCurrentArticle(articleToLoad);
    setTargetArticle(activeBattle.end_article);
    setPath([activeBattle.start_article]); // We don't save full path, just start
    setTimer(savedTime || 0);
    setGameState('racing');
    setRaceMode('player');

    await loadArticle(articleToLoad);
    startOpponentPolling(activeBattle.id);
  };

  // Poll for battle completion when waiting for opponent
  const startWaitingPolling = (matchId: string) => {
    // Clear any existing polling
    if (waitingPollingRef.current) {
      clearInterval(waitingPollingRef.current);
    }

    // Poll every 2 seconds
    waitingPollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/battles/${matchId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            time: timer,
            clicks: path.length,
            path
          })
        });

        const data = await response.json();

        // Check if battle is now complete (has result field)
        if (data.result) {
          // Battle complete! Stop polling and show results
          if (waitingPollingRef.current) {
            clearInterval(waitingPollingRef.current);
            waitingPollingRef.current = null;
          }

          setBattleResult(data);
          setActiveBattle(null);

          // Clear banner in parent component
          if (onBattleComplete) {
            onBattleComplete();
          }

          // Reload battle stats
          await loadBattleStats();

          // Show results
          setGameState('finished');
        }
      } catch (error) {
        console.error('Error polling battle completion:', error);
      }
    }, 2000);
  };

  // Start countdown before race
  const startCountdown = async (battleMatchId: string, raceData: any) => {
    // Show countdown: 3, 2, 1, GO!
    setCountdown(3);

    await new Promise(resolve => {
      let count = 3;
      countdownRef.current = setInterval(() => {
        count--;
        if (count === 0) {
          setCountdown(0); // Show "GO!"
        } else if (count < 0) {
          // Countdown finished
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          setCountdown(null);
          resolve(true);
        } else {
          setCountdown(count);
        }
      }, 1000);
    });

    // After countdown, start the race
    setGameState('racing');
    await loadArticle(raceData.start);
    startOpponentPolling(battleMatchId);
  };

  const loadRaceAttempts = async () => {
    try {
      const response = await fetch(`/api/wikirace/history/${userId}?limit=1000`);
      const data = await response.json();
      const races = data.races || [];

      // Count attempts per race_id and track best medal
      const counts: {[key: string]: number} = {};
      const medals: {[key: string]: string} = {};
      const medalValue: {[key: string]: number} = {
        'bronze': 1,
        'silver': 2,
        'gold': 3
      };

      races.forEach((race: any) => {
        if (!race.is_custom) {
          counts[race.race_id] = (counts[race.race_id] || 0) + 1;

          // Track best medal
          const currentBest = medals[race.race_id];
          const currentMedal = race.medal;

          if (!currentBest || (medalValue[currentMedal] || 0) > (medalValue[currentBest] || 0)) {
            medals[race.race_id] = currentMedal;
          }
        }
      });

      setRaceAttempts(counts);
      setRaceMedals(medals);
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

  // Battle mode functions
  const getTierColor = (tier: string): string => {
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

  const startBattle = async (race: Race) => {
    try {
      // Create battle match
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

      // Start the actual race (same as solo mode, but tracked as battle)
      setSelectedRace(race);
      setCurrentArticle(race.start);
      setTargetArticle(race.end);
      setPath([race.start]);
      setTimer(0);
      setIsCustom(false);
      setGameState('racing');

      // Load first article
      await loadArticle(race.start);
    } catch (error) {
      console.error('Error starting battle:', error);
    }
  };

  // Lobby functions
  const createLobby = async (race: Race, isPublic: boolean = false) => {
    try {
      const response = await fetch('/api/lobbies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          raceId: race.id,
          startArticle: race.start,
          endArticle: race.end,
          difficulty: race.difficulty,
          isPublic,
          isRanked: gameMode === 'ranked',
          maxPlayers
        })
      });

      const data = await response.json();
      setLobby(data.lobby);
      setLobbyParticipants([{ user_id: userId, is_host: true, status: 'joined' }]);
      setLobbyView('waiting');

      // Start polling for updates
      startLobbyPolling(data.lobby.lobby_code);
    } catch (error) {
      console.error('Error creating lobby:', error);
      alert('Failed to create lobby');
    }
  };

  const joinLobby = async (code: string) => {
    try {
      const response = await fetch(`/api/lobbies/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      // Check if battle already started
      if (data.lobby.status === 'in_progress' && data.lobby.battle_match_id) {
        // Battle already in progress, join directly
        setBattleId(data.lobby.battle_match_id);
        setSelectedRace({
          id: data.lobby.race_id,
          start: data.lobby.start_article,
          end: data.lobby.end_article,
          difficulty: data.lobby.difficulty,
          optimalPath: 5
        });
        setCurrentArticle(data.lobby.start_article);
        setTargetArticle(data.lobby.end_article);
        setPath([data.lobby.start_article]);
        setTimer(0);
        setGameState('racing');
        await loadArticle(data.lobby.start_article);
        startOpponentPolling(data.lobby.battle_match_id);
        return;
      }

      setLobby(data.lobby);
      setLobbyView('waiting');

      // Load lobby details
      await loadLobbyStatus(code);

      // Start polling
      startLobbyPolling(code);
    } catch (error) {
      console.error('Error joining lobby:', error);
      alert('Failed to join lobby. Check the code and try again.');
    }
  };

  const loadLobbyStatus = async (code: string) => {
    try {
      const response = await fetch(`/api/lobbies/${code}/status?userId=${userId}`);
      const data = await response.json();
      setLobby(data.lobby);
      setLobbyParticipants(data.participants);

      // Check if battle started
      if (data.lobby.status === 'in_progress' && data.lobby.battle_match_id) {
        // Stop lobby polling immediately to prevent reload loop
        if (lobbyPollingRef.current) {
          clearInterval(lobbyPollingRef.current);
          lobbyPollingRef.current = null;
          console.log('Stopped lobby polling - battle started');
        }

        setBattleId(data.lobby.battle_match_id);
        setLobbyView('menu');

        // Setup race data
        setSelectedRace({
          id: data.lobby.race_id,
          start: data.lobby.start_article,
          end: data.lobby.end_article,
          difficulty: data.lobby.difficulty,
          optimalPath: 5
        });
        setCurrentArticle(data.lobby.start_article);
        setTargetArticle(data.lobby.end_article);
        setPath([data.lobby.start_article]);
        setTimer(0);

        // Start countdown before race
        await startCountdown(data.lobby.battle_match_id, {
          start: data.lobby.start_article,
          end: data.lobby.end_article
        });
      }
    } catch (error) {
      console.error('Error loading lobby status:', error);
    }
  };

  const toggleReady = async () => {
    if (!lobby) return;

    try {
      await fetch(`/api/lobbies/${lobby.lobby_code}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      // Reload status
      await loadLobbyStatus(lobby.lobby_code);
    } catch (error) {
      console.error('Error toggling ready:', error);
    }
  };

  const startLobbyBattle = async () => {
    if (!lobby) return;

    try {
      const response = await fetch(`/api/lobbies/${lobby.lobby_code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start battle');
      }

      const data = await response.json();
      console.log('Battle started:', data);
      // Polling will detect the status change and start the race
    } catch (error: any) {
      console.error('Error starting lobby battle:', error);
      alert(error.message || 'Failed to start battle');
    }
  };

  const leaveLobby = async () => {
    if (!lobby) return;

    try {
      // Stop polling
      if (lobbyPollingRef.current) {
        clearInterval(lobbyPollingRef.current);
        lobbyPollingRef.current = null;
      }

      await fetch(`/api/lobbies/${lobby.lobby_code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      setLobby(null);
      setLobbyParticipants([]);
      setLobbyView('menu');
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  };

  const loadPublicLobbies = async () => {
    try {
      const response = await fetch('/api/lobbies/list/public');
      const data = await response.json();
      setPublicLobbies(data.lobbies || []);
    } catch (error) {
      console.error('Error loading public lobbies:', error);
    }
  };

  const startLobbyPolling = (code: string) => {
    // Clear any existing interval
    if (lobbyPollingRef.current) {
      clearInterval(lobbyPollingRef.current);
      lobbyPollingRef.current = null;
    }

    console.log('Starting lobby polling for code:', code);
    const interval = setInterval(async () => {
      await loadLobbyStatus(code);
    }, 2000);

    lobbyPollingRef.current = interval;
  };

  const startOpponentPolling = (matchId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/battles/${matchId}/progress`);
        const data = await response.json();
        setOpponentProgress(data);

        // Check if opponent finished
        if (data.status === 'completed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling opponent:', error);
      }
    }, 1000);

    (window as any).opponentPollingInterval = interval;
  };

  // Matchmaking functions
  const joinMatchmaking = async (difficultyHint: string) => {
    try {
      // For MMR-based matchmaking, use 'medium' as default difficulty
      // Backend will match based on MMR, not difficulty
      const difficulty = difficultyHint === 'auto' ? 'medium' : difficultyHint;

      const response = await fetch('/api/matchmaking/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, difficulty, isRanked: gameMode === 'ranked' })
      });

      const data = await response.json();
      setMatchmakingQueue(data.queueEntry);
      setLobbyView('matchmaking');

      // Start polling for match
      startMatchmakingPolling();
    } catch (error) {
      console.error('Error joining matchmaking:', error);
      alert('Failed to join matchmaking queue');
    }
  };

  const cancelMatchmaking = async () => {
    try {
      await fetch('/api/matchmaking/queue/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      setMatchmakingQueue(null);
      setMatchmakingWaitTime(0);
      setLobbyView('menu');

      // Stop polling
      if ((window as any).matchmakingPollingInterval) {
        clearInterval((window as any).matchmakingPollingInterval);
      }
    } catch (error) {
      console.error('Error canceling matchmaking:', error);
    }
  };

  const startMatchmakingPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/matchmaking/queue/status/${userId}`);
        const data = await response.json();

        if (data.matched && data.match) {
          // Found a match!
          clearInterval(interval);
          setMatchmakingQueue(null);
          setBattleId(data.match.id);
          setLobbyView('menu');

          // Setup race data
          setSelectedRace({
            id: data.match.race_id,
            start: data.match.start_article,
            end: data.match.end_article,
            difficulty: data.match.difficulty,
            optimalPath: 5
          });
          setCurrentArticle(data.match.start_article);
          setTargetArticle(data.match.end_article);
          setPath([data.match.start_article]);
          setTimer(0);

          // Start countdown before race
          await startCountdown(data.match.id, {
            start: data.match.start_article,
            end: data.match.end_article
          });
        } else if (data.inQueue) {
          setMatchmakingWaitTime(data.waitTime || 0);
        } else {
          // Not in queue anymore
          clearInterval(interval);
          setLobbyView('menu');
        }
      } catch (error) {
        console.error('Error polling matchmaking:', error);
      }
    }, 1500);

    (window as any).matchmakingPollingInterval = interval;
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

      // If this is a battle, track locally and update backend
      if (battleId) {
        const newPath = [...path, articleName];
        setPath(newPath);
        setCurrentArticle(articleName);

        // Update progress in backend for persistence
        try {
          await fetch(`/api/battles/${battleId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              currentArticle: articleName,
              clicks: newPath.length,
              timeElapsed: timer
            })
          });
        } catch (error) {
          console.error('Error updating battle progress:', error);
        }

        // Check if reached target
        if (articleName === targetArticle) {
          // Battle finished!
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          // Complete battle
          completeRace();
        } else {
          // Load next article
          await loadArticle(articleName);
        }
        return;
      }

      // Solo race - track click via API
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
          // Race finished! Show instant celebration
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          // Show celebration immediately (optimistic UI)
          const estimatedResult = {
            clicks: data.path.length - 1,
            optimalPath: selectedRace?.optimalPath || 0,
            path: data.path,
            timeSeconds: timer,
            medal: '', // Will be filled by API
            score: 0,
            message: '',
            xpEarned: 0,
            isFirstCompletion: false
          };

          setResult(estimatedResult);

          // Check if beat optimal path - show celebration INSTANTLY
          if (!isCustom && estimatedResult.clicks < estimatedResult.optimalPath) {
            setShowOptimalCelebration(true);
          }

          // Complete race in background and update with real data
          completeRace();
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
      // If this is a battle, complete it via battle API
      if (battleId) {
        const battleResponse = await fetch(`/api/battles/${battleId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            time: timer,
            clicks: path.length,
            path
          })
        });

        const battleData = await battleResponse.json();

        // Check if we're waiting for opponent (only has message and times, not full result)
        if (battleData.message && !battleData.result) {
          // First player to finish - show waiting state
          setBattleResult(battleData);
          setGameState('waiting'); // New state for waiting on opponent

          // Start polling to check when opponent finishes
          startWaitingPolling(battleId);
          return;
        }

        // Both players finished - show results
        setBattleResult(battleData);
        setActiveBattle(null);

        // Clear banner in parent component
        if (onBattleComplete) {
          onBattleComplete();
        }

        // Reload battle stats
        await loadBattleStats();

        // Show results
        setGameState('finished');
        return;
      }

      // Solo race completion
      const response = await fetch(`/api/wikirace/${currentRaceId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      // Update with real result data from server
      setResult(data);

      // Transition to results after celebration
      if (showOptimalCelebration) {
        // If celebrating, wait 3 seconds then show results
        setTimeout(() => {
          setShowOptimalCelebration(false);
          setGameState('finished');
        }, 3000);
      } else {
        // No celebration, go straight to results
        setGameState('finished');
      }
    } catch (error) {
      console.error('Error completing race:', error);
      // On error, still show results
      setGameState('finished');
    }
  };

  const handleQuitRace = async () => {
    // If in a PvP battle, show confirmation
    if (battleId && gameState === 'racing') {
      const confirmed = window.confirm(
        '⚠️ Are you sure you want to quit?\n\n' +
        'You will forfeit this battle and may lose MMR points if this is a ranked match.'
      );

      if (!confirmed) return;

      // Forfeit the battle
      try {
        await fetch(`/api/battles/${battleId}/forfeit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
      } catch (error) {
        console.error('Error forfeiting battle:', error);
      }
    }

    resetRace();
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
    setBattleId(null);
    setBattleResult(null);
    setActiveBattle(null);
    // Clear banner in parent component
    if (onBattleComplete) {
      onBattleComplete();
    }
  };

  const openRacePreview = async (race: Race) => {
    setPreviewRace(race);
    setShowPreview(true);

    // Load race-specific stats
    try {
      const response = await fetch(`/api/wikirace/race/${race.id}/stats?userId=${userId}`);
      const data = await response.json();
      setRaceStats(data);
    } catch (error) {
      console.error('Error loading race stats:', error);
      setRaceStats(null);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewRace(null);
    setRaceStats(null);
  };

  const startFromPreview = () => {
    if (previewRace) {
      closePreview();
      startRace(previewRace, false);
    }
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

        {/* Mode Selector */}
        <div className="race-mode-selector">
          <button
            className={`mode-btn ${raceMode === 'solo' ? 'active' : ''}`}
            onClick={() => setRaceMode('solo')}
          >
            <span className="mode-icon">🏃</span>
            <span>Solo Practice</span>
          </button>
          <button
            className={`mode-btn ${raceMode === 'bot' ? 'active' : ''}`}
            onClick={() => setRaceMode('bot')}
          >
            <span className="mode-icon">🤖</span>
            <span>vs Bot</span>
          </button>
          <button
            className={`mode-btn ${raceMode === 'player' ? 'active' : ''}`}
            onClick={() => setRaceMode('player')}
          >
            <span className="mode-icon">👥</span>
            <span>vs Player</span>
          </button>
          <button
            className={`mode-btn ${raceMode === 'stats' ? 'active' : ''}`}
            onClick={() => setRaceMode('stats')}
          >
            <span className="mode-icon">📊</span>
            <span>Rankings</span>
          </button>
        </div>

        {/* Solo Mode Content */}
        {raceMode === 'solo' && (
          <>
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
            const medal = raceMedals[race.id];
            const medalEmoji = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;

            return (
              <div key={race.id} className="race-card" onClick={() => openRacePreview(race)}>
                <div className="race-difficulty" style={{ backgroundColor: difficultyColors[race.difficulty as keyof typeof difficultyColors] }}>
                  {race.difficulty.toUpperCase()}
                </div>
                {medal && (
                  <div className="race-medal-badge-corner">
                    {medalEmoji}
                  </div>
                )}
                <div className="race-info">
                  <div className="race-route">
                    <span className="start-article">{race.start}</span>
                    <span className="arrow">→</span>
                    <span className="end-article">{race.end}</span>
                  </div>
                  <div className="race-stats">
                    <span>🎯 Optimal: {race.optimalPath} clicks</span>
                    <span className={`xp-badge ${medal === 'gold' ? 'xp-earned' : ''}`}>
                      +{race.difficulty === 'easy' ? '50' : race.difficulty === 'medium' ? '75' : race.difficulty === 'hard' ? '100' : '150'} XP
                    </span>
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

        {/* Race Preview Modal */}
        {showPreview && previewRace && (
          <div className="modal-overlay" onClick={closePreview}>
            <div className="race-preview-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closePreview}>×</button>

              <div className="preview-header">
                <div className="preview-title">
                  <h2>{previewRace.start} → {previewRace.end}</h2>
                  <div className="race-difficulty" style={{ backgroundColor: difficultyColors[previewRace.difficulty as keyof typeof difficultyColors] }}>
                    {previewRace.difficulty.toUpperCase()}
                  </div>
                </div>
                {raceMedals[previewRace.id] && (
                  <div className="preview-medal">
                    <span className="medal-large">
                      {raceMedals[previewRace.id] === 'gold' ? '🥇' : raceMedals[previewRace.id] === 'silver' ? '🥈' : '🥉'}
                    </span>
                    <span className="medal-label">Best: {raceMedals[previewRace.id]}</span>
                  </div>
                )}
              </div>

              <div className="preview-content">
                <div className="preview-stats-grid">
                  <div className="preview-stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-label">Optimal Path</div>
                    <div className="stat-value">{previewRace.optimalPath} clicks</div>
                  </div>
                  <div className="preview-stat-card">
                    <div className="stat-icon">✨</div>
                    <div className="stat-label">XP Reward</div>
                    <div className="stat-value">
                      {previewRace.difficulty === 'easy' ? '50' : previewRace.difficulty === 'medium' ? '75' : previewRace.difficulty === 'hard' ? '100' : '150'} XP
                    </div>
                  </div>
                  <div className="preview-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Your Attempts</div>
                    <div className="stat-value">{raceAttempts[previewRace.id] || 0}</div>
                  </div>
                </div>

                {raceStats ? (
                  <>
                    {raceStats.personalBest && (
                      <div className="preview-section">
                        <h3>Your Best Run</h3>
                        <div className="best-run-card">
                          <div className="best-run-stat">
                            <span className="stat-label">Time:</span>
                            <span className="stat-value">{formatTime(raceStats.personalBest.time_seconds)}</span>
                          </div>
                          <div className="best-run-stat">
                            <span className="stat-label">Clicks:</span>
                            <span className="stat-value">{raceStats.personalBest.clicks_count}</span>
                          </div>
                          <div className="best-run-stat">
                            <span className="stat-label">Score:</span>
                            <span className="stat-value">{raceStats.personalBest.score}/100</span>
                          </div>
                          <div className="best-run-stat">
                            <span className="stat-label">Medal:</span>
                            <span className="stat-value">
                              {raceStats.personalBest.medal === 'gold' ? '🥇' : raceStats.personalBest.medal === 'silver' ? '🥈' : '🥉'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {raceStats.leaderboard && raceStats.leaderboard.length > 0 && (
                      <div className="preview-section">
                        <h3>🏆 Leaderboard (Top 5)</h3>
                        <div className="leaderboard-list">
                          {raceStats.leaderboard.slice(0, 5).map((entry: any, idx: number) => (
                            <div key={idx} className={`leaderboard-entry ${entry.is_you ? 'is-you' : ''}`}>
                              <div className="rank">#{idx + 1}</div>
                              <div className="leaderboard-info">
                                <div className="leaderboard-name">{entry.is_you ? 'You' : `Player ${entry.user_id.slice(0, 8)}`}</div>
                                <div className="leaderboard-stats">
                                  <span>⏱️ {formatTime(entry.time_seconds)}</span>
                                  <span>👆 {entry.clicks_count}</span>
                                  <span>🎯 {entry.score}/100</span>
                                </div>
                              </div>
                              <div className="leaderboard-medal">
                                {entry.medal === 'gold' ? '🥇' : entry.medal === 'silver' ? '🥈' : '🥉'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="loading-stats">Loading stats...</div>
                )}
              </div>

              <div className="preview-actions">
                <button className="btn-secondary" onClick={closePreview}>Cancel</button>
                <button className="btn-primary" onClick={startFromPreview}>
                  🏁 Start Race
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* vs Bot Mode */}
        {raceMode === 'bot' && battleStats && (
          <div className="battle-mode-content">
            {/* Battle Stats Card */}
            <div className="battle-stats-card">
              <div className="stats-header">
                <div className="player-tier" style={{
                  backgroundColor: getTierColor(battleStats.tier)
                }}>
                  {battleStats.tier}
                </div>
                <div className="player-mmr">{battleStats.mmr} MMR</div>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Battles</div>
                  <div className="stat-value">{battleStats.total_battles}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Wins</div>
                  <div className="stat-value">{battleStats.wins}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Win Rate</div>
                  <div className="stat-value">
                    {battleStats.total_battles > 0 ? Math.round((battleStats.wins / battleStats.total_battles) * 100) : 0}%
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Win Streak</div>
                  <div className="stat-value">{battleStats.win_streak} 🔥</div>
                </div>
              </div>
            </div>

            <h2 className="section-title">⚔️ Battle Races (Ranked)</h2>
            <p className="mode-description">Compete against AI opponents matched to your skill level. Win to climb the ranks!</p>

            <div className="races-grid">
              {races.map(race => (
                <div key={race.id} className="race-card battle-race-card" onClick={() => startBattle(race)}>
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
                      <span className="battle-badge">🤖 vs Bot</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* vs Player Mode */}
        {raceMode === 'player' && (
          <div className="battle-mode-content">
            {lobbyView === 'menu' && (
              <>
                <div className="pvp-header">
                  <h2 className="section-title">👥 Player vs Player</h2>

                  {/* Game Mode Toggle */}
                  <div className="game-mode-toggle">
                    <button
                      className={`mode-btn ${gameMode === 'ranked' ? 'active' : ''}`}
                      onClick={() => setGameMode('ranked')}
                    >
                      🏆 Ranked
                    </button>
                    <button
                      className={`mode-btn ${gameMode === 'casual' ? 'active' : ''}`}
                      onClick={() => setGameMode('casual')}
                    >
                      🎮 Casual
                    </button>
                  </div>
                </div>

                <p className="mode-description">
                  {gameMode === 'ranked'
                    ? '🏆 Compete for MMR and climb the leaderboard!'
                    : '🎮 Play for fun without affecting your ranking'}
                </p>

                {/* Quick Match Section */}
                <div className="quick-match-section">
                  <h3 className="subsection-title">⚡ Quick Match</h3>
                  <p className="subsection-desc">Find an opponent automatically based on your MMR</p>
                  <button
                    className="btn-find-match"
                    onClick={() => joinMatchmaking('auto')}
                  >
                    <span className="match-icon">🎯</span>
                    <span className="match-text">Find Match</span>
                  </button>
                  <p className="mmr-hint">Matches players within ±100 MMR of your rating</p>
                </div>

                {/* Divider */}
                <div className="pvp-divider">
                  <span>OR</span>
                </div>

                {/* Other Options */}
                <div className="pvp-menu-grid">
                  <div className="pvp-option-card" onClick={() => setLobbyView('create')}>
                    <div className="pvp-icon">🎯</div>
                    <h3>Create Private Lobby</h3>
                    <p>Invite a friend with a shareable code</p>
                  </div>

                  <div className="pvp-option-card" onClick={() => setLobbyView('join')}>
                    <div className="pvp-icon">🔑</div>
                    <h3>Join by Code</h3>
                    <p>Enter a lobby code to join</p>
                  </div>

                  <div className="pvp-option-card" onClick={() => {
                    setLobbyView('browse');
                    loadPublicLobbies();
                  }}>
                    <div className="pvp-icon">🌐</div>
                    <h3>Public Lobbies</h3>
                    <p>Browse open lobbies</p>
                  </div>
                </div>
              </>
            )}

            {lobbyView === 'create' && (
              <div className="lobby-create-view">
                <button className="modern-back-btn" onClick={() => setLobbyView('menu')}>
                  <span className="back-arrow">←</span>
                  <span>Back</span>
                </button>
                <h2 className="section-title">Create Lobby</h2>
                <p className="mode-description">Select a race for your battle</p>

                <div className="lobby-options-card">
                  <label className="modern-checkbox-label">
                    <input type="checkbox" id="publicLobby" className="modern-checkbox" />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      <span className="checkbox-title">🌐 Public Lobby</span>
                      <span className="checkbox-desc">Anyone can find and join this lobby</span>
                    </span>
                  </label>

                  <div className="player-count-selector">
                    <label htmlFor="maxPlayers" className="player-count-label">
                      👥 Max Players
                    </label>
                    <div className="player-count-buttons">
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                        <button
                          key={count}
                          type="button"
                          className={`player-count-btn ${maxPlayers === count ? 'active' : ''}`}
                          onClick={() => setMaxPlayers(count)}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="create-race-tabs">
                  <button
                    className={`race-tab ${!showCustomForm ? 'active' : ''}`}
                    onClick={() => setShowCustomForm(false)}
                  >
                    📋 Official Races
                  </button>
                  <button
                    className={`race-tab ${showCustomForm ? 'active' : ''}`}
                    onClick={() => setShowCustomForm(true)}
                  >
                    ✨ Custom Race
                  </button>
                </div>

                {!showCustomForm ? (
                  <div className="races-grid">
                    {races.map(race => (
                      <div key={race.id} className="race-card" onClick={() => {
                        const isPublic = (document.getElementById('publicLobby') as HTMLInputElement)?.checked || false;
                        createLobby(race, isPublic);
                      }}>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                        className="start-race-btn"
                        onClick={() => {
                          if (customStart.trim() && customEnd.trim()) {
                            const isPublic = (document.getElementById('publicLobby') as HTMLInputElement)?.checked || false;
                            const customRace: Race = {
                              id: `custom-${Date.now()}`,
                              start: customStart,
                              end: customEnd,
                              difficulty: 'medium',
                              optimalPath: 5
                            };
                            createLobby(customRace, isPublic);
                          }
                        }}
                        disabled={!customStart.trim() || !customEnd.trim()}
                      >
                        🏁 Create Lobby
                      </button>
                      <button className="cancel-btn" onClick={() => setShowCustomForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {lobbyView === 'join' && (
              <div className="lobby-join-view">
                <button className="modern-back-btn" onClick={() => setLobbyView('menu')}>
                  <span className="back-arrow">←</span>
                  <span>Back</span>
                </button>

                <div className="join-lobby-container">
                  <div className="join-header">
                    <div className="join-icon">🔑</div>
                    <h2>Join a Lobby</h2>
                    <p>Enter the 6-character code shared by your friend</p>
                  </div>

                  <div className="code-input-section">
                    <label htmlFor="lobbyCode">Lobby Code</label>
                    <input
                      id="lobbyCode"
                      type="text"
                      placeholder="ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="modern-code-input"
                      autoFocus
                    />
                    <button
                      className="modern-join-btn"
                      onClick={() => {
                        if (joinCode.length === 6) {
                          joinLobby(joinCode);
                        } else {
                          alert('Please enter a 6-character code');
                        }
                      }}
                      disabled={joinCode.length !== 6}
                    >
                      Join Lobby
                    </button>
                  </div>

                  <div className="join-hint">
                    <span className="hint-icon">💡</span>
                    <span>Don't have a code? Ask a friend to create a lobby and share the invite link!</span>
                  </div>
                </div>
              </div>
            )}

            {lobbyView === 'browse' && (
              <div className="lobby-browse-view">
                <div className="browse-header">
                  <button className="modern-back-btn" onClick={() => setLobbyView('menu')}>
                    <span className="back-arrow">←</span>
                    <span>Back</span>
                  </button>
                  <button className="refresh-lobbies-btn" onClick={loadPublicLobbies}>
                    <span className="refresh-icon">🔄</span>
                    <span>Refresh</span>
                  </button>
                </div>

                <h2 className="section-title">🌐 Public Lobbies</h2>
                <p className="mode-description">Join an open lobby or browse available battles</p>

                {publicLobbies.length === 0 ? (
                  <div className="no-lobbies">
                    <div className="empty-icon">🎮</div>
                    <p>No public lobbies available</p>
                    <p className="empty-hint">Create your own or come back later!</p>
                  </div>
                ) : (
                  <div className="public-lobbies-grid">
                    {publicLobbies.map(pubLobby => (
                      <div key={pubLobby.id} className="public-lobby-card">
                        <div className="lobby-card-header">
                          <div className={`difficulty-badge ${pubLobby.difficulty}`}>
                            {pubLobby.difficulty.toUpperCase()}
                          </div>
                          <div className={`mode-badge ${pubLobby.is_ranked !== false ? 'ranked' : 'casual'}`}>
                            {pubLobby.is_ranked !== false ? '🏆' : '🎮'}
                          </div>
                        </div>

                        <div className="lobby-race-info">
                          <div className="race-route-compact">
                            <span className="start">{pubLobby.start_article}</span>
                            <span className="arrow">→</span>
                            <span className="end">{pubLobby.end_article}</span>
                          </div>
                        </div>

                        <div className="lobby-meta">
                          <div className="meta-item">
                            <span className="meta-icon">👑</span>
                            <span className="meta-text">Host: {pubLobby.host.email?.split('@')[0] || 'Player'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">👥</span>
                            <span className="meta-text">{pubLobby.participant_count?.[0]?.count || 1}/{pubLobby.max_players}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">🔑</span>
                            <span className="meta-text lobby-code">{pubLobby.lobby_code}</span>
                          </div>
                        </div>

                        <button className="join-public-lobby-btn" onClick={() => joinLobby(pubLobby.lobby_code)}>
                          <span>Join Battle</span>
                          <span className="join-arrow">→</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lobbyView === 'waiting' && lobby && (
              <div className="lobby-waiting-view">
                <div className="lobby-header-bar">
                  <div className="lobby-code-display">
                    <span className="code-label">Lobby Code:</span>
                    <span className="code-value">{lobby.lobby_code}</span>
                  </div>
                  <button className="leave-lobby-btn" onClick={leaveLobby}>
                    ← Leave
                  </button>
                </div>

                <div className="lobby-race-card">
                  <div className="race-title-section">
                    <h2 className="race-route">
                      <span className="start">{lobby.start_article}</span>
                      <span className="arrow">→</span>
                      <span className="end">{lobby.end_article}</span>
                    </h2>
                    <div className="race-meta">
                      <span className={`difficulty-badge ${lobby.difficulty}`}>
                        {lobby.difficulty.toUpperCase()}
                      </span>
                      <span className={`mode-badge ${lobby.is_ranked !== false ? 'ranked' : 'casual'}`}>
                        {lobby.is_ranked !== false ? '🏆 Ranked' : '🎮 Casual'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lobby-participants-section">
                  <h3 className="section-heading">
                    <span>Players</span>
                    <span className="player-count">{lobbyParticipants.length}/{lobby.max_players}</span>
                  </h3>
                  <div className="participants-grid">
                    {lobbyParticipants.map(participant => (
                      <div key={participant.user_id} className={`participant-card ${participant.status}`}>
                        <div className="participant-avatar">
                          {participant.is_host ? '👑' : '⚔️'}
                        </div>
                        <div className="participant-details">
                          <div className="participant-name">
                            {participant.user_id === userId ? 'You' : `Player #${participant.user_id.slice(0, 6)}`}
                            {participant.is_host && <span className="host-badge">Host</span>}
                          </div>
                          <div className="participant-status">
                            {participant.status === 'ready' ? (
                              <span className="status-ready">✓ Ready</span>
                            ) : (
                              <span className="status-waiting">⏳ Not Ready</span>
                            )}
                          </div>
                        </div>
                        {participant.user_id === userId && (
                          <button className={`ready-toggle-btn ${participant.status === 'ready' ? 'unready' : 'ready'}`} onClick={toggleReady}>
                            {participant.status === 'ready' ? 'Unready' : 'Ready Up'}
                          </button>
                        )}
                      </div>
                    ))}

                    {Array.from({ length: lobby.max_players - lobbyParticipants.length }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="participant-card empty-slot">
                        <div className="participant-avatar">👤</div>
                        <div className="participant-details">
                          <div className="participant-name">Waiting for player...</div>
                          <div className="participant-status">
                            <span className="status-waiting">Empty Slot</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="invite-section-card">
                  <h4 className="invite-heading">
                    <span>📤 Share Invite Link</span>
                  </h4>
                  <div className="invite-link-container">
                    <input
                      type="text"
                      value={`${window.location.origin}/battle/invite/${lobby.lobby_code}`}
                      readOnly
                      className="invite-link-input"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <button className="copy-link-btn" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/battle/invite/${lobby.lobby_code}`);
                      alert('📋 Link copied to clipboard!');
                    }}>
                      Copy Link
                    </button>
                  </div>
                  <p className="invite-hint">Share this link with a friend to invite them to the lobby</p>
                </div>

                {lobby.host_id === userId && (
                  <div className="host-controls">
                    <button
                      className="btn-start-battle"
                      onClick={startLobbyBattle}
                      disabled={lobbyParticipants.length < lobby.max_players || !lobbyParticipants.every(p => p.status === 'ready')}
                    >
                      {lobbyParticipants.length < lobby.max_players
                        ? `⏳ Waiting for players... (${lobbyParticipants.length}/${lobby.max_players})`
                        : lobbyParticipants.every(p => p.status === 'ready')
                        ? '🏁 Start Battle!'
                        : '⏳ Waiting for all players to ready up'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Matchmaking View */}
            {lobbyView === 'matchmaking' && (
              <div className="matchmaking-view">
                <div className="matchmaking-header">
                  <h2>🔍 Finding Opponent...</h2>
                  <button className="cancel-matchmaking-btn" onClick={cancelMatchmaking}>
                    Cancel Search
                  </button>
                </div>

                <div className="matchmaking-content">
                  <div className="matchmaking-spinner">
                    <div className="spinner-icon">⚔️</div>
                    <div className="spinner-animation"></div>
                  </div>

                  <div className="matchmaking-info">
                    <p className="searching-text">Searching for a worthy opponent...</p>
                    <div className="wait-time">
                      <span className="timer-icon">⏱️</span>
                      <span className="timer-value">{matchmakingWaitTime}s</span>
                    </div>

                    <div className="matchmaking-details">
                      <div className="detail-item">
                        <span className="detail-label">Difficulty:</span>
                        <span className="detail-value">{matchmakingQueue?.difficulty?.toUpperCase()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mode:</span>
                        <span className="detail-value">{gameMode === 'ranked' ? '🏆 Ranked' : '🎮 Casual'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Your MMR:</span>
                        <span className="detail-value">{matchmakingQueue?.mmr || 1000}</span>
                      </div>
                    </div>

                    <p className="matchmaking-hint">
                      💡 We're matching you with players of similar skill level
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rankings/Stats Mode */}
        {raceMode === 'stats' && battleStats && (
          <div className="battle-mode-content">
            <h2 className="section-title">📊 Battle Rankings</h2>

            {/* Personal Stats */}
            <div className="personal-stats-section">
              <h3>Your Battle Record</h3>
              <div className="record-grid">
                <div className="record-card">
                  <div className="record-icon">👑</div>
                  <div className="record-value">{battleStats.mmr}</div>
                  <div className="record-label">MMR Rating</div>
                  <div className="record-tier">{battleStats.tier}</div>
                </div>
                <div className="record-card">
                  <div className="record-icon">⚔️</div>
                  <div className="record-value">{battleStats.total_battles}</div>
                  <div className="record-label">Total Battles</div>
                  <div className="record-breakdown">
                    {battleStats.wins}W / {battleStats.losses}L / {battleStats.draws}D
                  </div>
                </div>
                <div className="record-card">
                  <div className="record-icon">🔥</div>
                  <div className="record-value">{battleStats.win_streak}</div>
                  <div className="record-label">Current Streak</div>
                  <div className="record-best">Best: {battleStats.best_win_streak}</div>
                </div>
              </div>
            </div>

            {/* Global Leaderboard */}
            <div className="leaderboard-section">
              <h3>🏆 Global Leaderboard</h3>
              <p className="leaderboard-description">Top ranked players worldwide</p>
              <div className="leaderboard-placeholder">
                <div className="placeholder-icon">📊</div>
                <p>Leaderboard coming soon!</p>
                <p className="placeholder-hint">Keep battling to secure your spot when it launches</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render racing view
  if (gameState === 'racing') {
    return (
      <div className="wikirace-game">
        {/* Optimal Path Celebration Overlay */}
        {showOptimalCelebration && result && (
          <div className="optimal-celebration-overlay" onClick={() => {
            setShowOptimalCelebration(false);
            setGameState('finished');
          }}>
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

        <div className="game-header">
          <div className="header-top">
            <button className="quit-button" onClick={handleQuitRace}>
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
          <div className="path-tracker-header">
            <span className="path-label">Your Path:</span>
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
      </div>
    );
  }

  // Render countdown before race starts
  if (countdown !== null) {
    return (
      <div className="countdown-overlay">
        <div className="countdown-content">
          <div className="countdown-number">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <div className="countdown-race-info">
            <p>{selectedRace?.start} → {selectedRace?.end}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render waiting state (for first finisher in PvP)
  if (gameState === 'waiting' && battleResult) {
    return (
      <div className="wikirace-waiting">
        <div className="waiting-content">
          <div className="waiting-icon">⏳</div>
          <h1>{battleResult.message}</h1>
          <div className="your-stats">
            <h3>Your Performance</h3>
            <div className="stat-row">
              <div className="stat">⏱️ {battleResult.yourTime}s</div>
              <div className="stat">👆 {battleResult.yourClicks} clicks</div>
            </div>
          </div>
          <div className="waiting-animation">
            <div className="waiting-spinner"></div>
            <p>Waiting for opponent to finish...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render results
  if (gameState === 'finished' && (result || battleResult)) {
    // If this was a battle, show battle results
    if (battleResult) {
      return (
        <div className="wikirace-results battle-results">
          <div className={`results-header ${battleResult.result === 'victory' ? 'victory' : battleResult.result === 'draw' ? 'draw' : 'defeat'}`}>
            <div className="result-icon">
              {battleResult.result === 'victory' ? '🏆' : battleResult.result === 'draw' ? '🤝' : '💪'}
            </div>
            <h1>{battleResult.message}</h1>
          </div>

          <div className="battle-comparison">
            <div className="comparison-column">
              <h3>You</h3>
              <div className="stat">⏱️ {battleResult.playerTime}s</div>
              <div className="stat">👆 {battleResult.playerClicks} clicks</div>
            </div>
            <div className="vs-text">VS</div>
            <div className="comparison-column">
              <h3>{battleResult.isBot ? '🤖 ' : '⚔️ '}{battleResult.opponentName || 'Opponent'}</h3>
              <div className="stat">⏱️ {battleResult.opponentTime}s</div>
              <div className="stat">👆 {battleResult.opponentClicks} clicks</div>
            </div>
          </div>

          <div className="mmr-change-section">
            <div className={`mmr-delta ${battleResult.mmrChange >= 0 ? 'positive' : 'negative'}`}>
              {battleResult.mmrChange >= 0 ? '+' : ''}{battleResult.mmrChange} MMR
            </div>
            <div className="new-mmr">
              New Rating: {battleResult.newMMR} MMR ({battleResult.newTier})
            </div>
          </div>

          <div className="results-actions">
            <button className="btn-primary" onClick={() => {
              resetRace();
              setRaceMode('bot'); // Stay in bot mode
            }}>
              ⚔️ Battle Again
            </button>
            <button className="btn-secondary" onClick={() => {
              resetRace();
              setRaceMode('solo');
            }}>
              🏃 Practice Mode
            </button>
            <button className="btn-secondary" onClick={() => {
              resetRace();
              setRaceMode('stats');
            }}>
              📊 View Rankings
            </button>
          </div>
        </div>
      );
    }

    // Solo race results
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
