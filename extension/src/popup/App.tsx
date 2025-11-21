import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

interface UserStats {
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  xpToNextLevel: number;
}

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    // Listen for storage changes (when user logs in/out on dashboard)
    const handleStorageChange = (changes: any) => {
      if (changes.wq_userId) {
        if (changes.wq_userId.newValue) {
          // User logged in
          setUserId(changes.wq_userId.newValue);
          fetchUserStats(changes.wq_userId.newValue);
        } else {
          // User logged out
          setUserId(null);
          setUserStats(null);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Refresh stats when popup is opened
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'QUIZ_COMPLETED' && userId) {
        // Refresh stats after quiz completion
        setTimeout(() => fetchUserStats(userId), 1000);
      }
    });

    // Refresh stats every time popup opens (using visibility API)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && userId) {
        fetchUserStats(userId);
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [userId]);

  const checkAuth = async () => {
    try {
      // Check if user is logged in via web app
      const result = await chrome.storage.sync.get(['wq_userId']);
      console.log('Auth check result:', result);

      if (!result.wq_userId) {
        // Not logged in - prompt to use web app
        setLoading(false);
        return;
      }

      setUserId(result.wq_userId);
      await fetchUserStats(result.wq_userId);
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Connection error');
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      // Fetch user stats from backend
      const response = await fetch(`${API_URL}/analytics/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.user);
      } else {
        setError('Failed to load stats');
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:3001' });
  };

  if (loading) {
    return (
      <div className="popup-container loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="popup-container">
        <div className="welcome-card">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>Welcome to WikiQuest</h1>
          <p>Learn smarter with gamified Wikipedia reading</p>

          <button className="btn-login" onClick={openDashboard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign In on Web
          </button>

          <div className="info-box">
            <p>👉 Sign in on the web dashboard first</p>
            <p>👉 Then refresh this extension</p>
            <p>👉 Start earning XP on Wikipedia!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="user-info">
          <div className="avatar">{userId.substring(0, 2).toUpperCase()}</div>
          <div className="level-badge">Level {userStats?.current_level || 1}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card xp">
          <span className="icon">⚡</span>
          <div className="content">
            <div className="value">{userStats?.total_xp || 0}</div>
            <div className="label">Total XP</div>
          </div>
        </div>

        <div className="stat-card streak">
          <span className="icon">🔥</span>
          <div className="content">
            <div className="value">{userStats?.current_streak || 0}</div>
            <div className="label">Day Streak</div>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span>Next Level</span>
          <span className="xp-needed">{userStats?.xpToNextLevel || 100} XP</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((userStats?.total_xp || 0) % 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="actions">
        <button className="btn-dashboard" onClick={openDashboard}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Full Dashboard
        </button>

        <button className="btn-settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 1v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.22 4.22l4.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.54 15.54l4.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.22 19.78l4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.54 8.46l4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="status-bar">
        <div className="status-item">
          <div className="dot active"></div>
          <span>Extension Active</span>
        </div>
      </div>
    </div>
  );
};

export default App;