import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

interface DashboardProps {
  userId: string;
  onLogout: () => void;
}

interface UserStats {
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  xpToNextLevel: number;
}

function Dashboard({ userId, onLogout }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`/api/analytics/dashboard?userId=${userId}`);
      const data = await response.json();

      if (data.user) {
        setStats(data.user);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const weekData = [
    { day: 'Mon', xp: 120 },
    { day: 'Tue', xp: 180 },
    { day: 'Wed', xp: 150 },
    { day: 'Thu', xp: 290 },
    { day: 'Fri', xp: 210 },
    { day: 'Sat', xp: 170 },
    { day: 'Sun', xp: 140 }
  ];

  const progressData = [
    { name: 'Completed', value: stats?.total_xp || 0, color: 'var(--primary)' },
    { name: 'Remaining', value: stats?.xpToNextLevel || 100, color: 'var(--bg-tertiary)' }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="header-left">
          <h1>WikiQuest</h1>
          <span className="greeting">Welcome back!</span>
        </div>

        <div className="header-right">
          <button className="btn-icon notification">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="badge">3</span>
          </button>

          <div className="user-menu">
            <div className="user-avatar">
              {userId.substring(0, 2).toUpperCase()}
            </div>
            <button className="btn-logout" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="level-card">
            <div className="level-info">
              <span className="label">Current Level</span>
              <h2 className="level-number">Level {stats?.current_level || 1}</h2>
              <p className="level-name">Knowledge Seeker</p>
            </div>
            <div className="level-visual">
              <svg className="level-ring" width="120" height="120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${Math.PI * 100 * ((stats?.total_xp % 100) / 100)} ${Math.PI * 100}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="xp-center">
                <span className="xp-value">{stats?.total_xp || 0}</span>
                <span className="xp-label">XP</span>
              </div>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-item streak">
              <div className="stat-icon">🔥</div>
              <div className="stat-details">
                <span className="stat-value">{stats?.current_streak || 0}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>

            <div className="stat-item articles">
              <div className="stat-icon">📚</div>
              <div className="stat-details">
                <span className="stat-value">12</span>
                <span className="stat-label">Articles Read</span>
              </div>
            </div>

            <div className="stat-item quizzes">
              <div className="stat-icon">✨</div>
              <div className="stat-details">
                <span className="stat-value">24</span>
                <span className="stat-label">Quizzes Done</span>
              </div>
            </div>

            <div className="stat-item accuracy">
              <div className="stat-icon">🎯</div>
              <div className="stat-details">
                <span className="stat-value">86%</span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Weekly Progress</h3>
              <span className="chart-subtitle">XP earned this week</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip />
                <Area type="monotone" dataKey="xp" stroke="var(--primary)" fillOpacity={1} fill="url(#colorXp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="achievements-preview">
            <div className="section-header">
              <h3>Recent Achievements</h3>
              <button className="btn-text">View All</button>
            </div>
            <div className="achievement-list">
              <div className="achievement-item unlocked">
                <div className="achievement-icon">🏆</div>
                <div className="achievement-info">
                  <h4>First Steps</h4>
                  <p>Complete your first article</p>
                </div>
              </div>
              <div className="achievement-item unlocked">
                <div className="achievement-icon">⚡</div>
                <div className="achievement-info">
                  <h4>Quick Learner</h4>
                  <p>Score 100% on a quiz</p>
                </div>
              </div>
              <div className="achievement-item">
                <div className="achievement-icon locked">🔒</div>
                <div className="achievement-info">
                  <h4>Week Warrior</h4>
                  <p>7 day streak</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-card">
            <div className="cta-content">
              <h3>Ready to learn something new?</h3>
              <p>Head to Wikipedia and start earning XP with our Chrome extension</p>
            </div>
            <button className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start Learning
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;