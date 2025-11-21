import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import QuestPath from '../components/QuestPath';
import './EnhancedDashboard.css';

interface EnhancedDashboardProps {
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

interface Article {
  id: string;
  wikipedia_title: string;
  wikipedia_url: string;
  completion_percentage: number;
  best_quiz_score: number;
  total_xp_earned: number;
  last_accessed: string;
  reading_time_seconds: number;
}

interface Challenge {
  type: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  xp_reward: number;
  completed: boolean;
  difficulty: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  percentage: number;
  xp_reward: number;
}

function EnhancedDashboard({ userId, onLogout }: EnhancedDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Record<string, Achievement[]>>({});
  const [readingStats, setReadingStats] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [questProgress, setQuestProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userId]);

  const startQuest = async (questId: string) => {
    try {
      const response = await fetch('/api/quests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questId })
      });
      const data = await response.json();

      if (data.quest) {
        setActiveQuest({
          quest_id: questId,
          quest_details: data.quest,
          current_stage: 1,
          current_stage_info: data.quest.stages[0],
          completed_stages: [],
          completed_articles: []
        });

        // Switch to adventure tab to show progress
        setActiveTab('adventure');
      }
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  };

  const loadAllData = async () => {
    try {
      // Load user stats
      const statsResponse = await fetch(`/api/analytics/dashboard?userId=${userId}`);
      const statsData = await statsResponse.json();
      if (statsData.user) {
        setStats(statsData.user);
      }

      // Load articles history
      const articlesResponse = await fetch(`/api/articles/history?userId=${userId}&limit=10`);
      const articlesData = await articlesResponse.json();
      setArticles(articlesData.articles || []);

      // Load daily challenges
      const challengesResponse = await fetch(`/api/challenges/daily/${userId}`);
      const challengesData = await challengesResponse.json();
      setChallenges(challengesData.challenges || []);

      // Load achievements
      const achievementsResponse = await fetch(`/api/achievements/${userId}`);
      const achievementsData = await achievementsResponse.json();
      setAchievements(achievementsData.achievements || {});

      // Load reading statistics
      const readingStatsResponse = await fetch(`/api/articles/stats/${userId}`);
      const readingStatsData = await readingStatsResponse.json();
      setReadingStats(readingStatsData.stats);

      // Load quests
      const questsResponse = await fetch(`/api/quests/available/${userId}`);
      const questsData = await questsResponse.json();
      setQuests(questsData.quests || []);

      // Load quest progress
      const progressResponse = await fetch(`/api/quests/progress/${userId}`);
      const progressData = await progressResponse.json();
      if (progressData.active_quests && progressData.active_quests.length > 0) {
        setActiveQuest(progressData.active_quests[0]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate chart data
  const weekData = articles.slice(0, 7).map(article => ({
    day: new Date(article.last_accessed).toLocaleDateString('en', { weekday: 'short' }),
    xp: article.total_xp_earned,
    minutes: Math.round(article.reading_time_seconds / 60)
  })).reverse();

  const categoryData = readingStats?.favorite_categories || [];
  const COLORS = ['#4fc3f7', '#81c784', '#ffb74d', '#e57373', '#ba68c8'];

  if (loading) {
    return (
      <div className="enhanced-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your learning journey...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard">
      {/* Header */}
      <header className="dash-header-enhanced">
        <div className="header-left">
          <h1 className="logo-title">WikiQuest</h1>
          <div className="user-level-badge">
            <span className="level-icon">👑</span>
            <span>Level {stats?.current_level || 1}</span>
          </div>
        </div>

        <nav className="dash-nav">
          <button
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`nav-btn ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            Articles
          </button>
          <button
            className={`nav-btn adventure-btn ${activeTab === 'adventure' ? 'active' : ''}`}
            onClick={() => setActiveTab('adventure')}
          >
            ✨ Adventure Mode
          </button>
          <button
            className={`nav-btn ${activeTab === 'challenges' ? 'active' : ''}`}
            onClick={() => setActiveTab('challenges')}
          >
            Daily Challenges
          </button>
          <button
            className={`nav-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button
            className={`nav-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </nav>

        <div className="header-right">
          <div className="streak-indicator">
            <span className="streak-fire">🔥</span>
            <span>{stats?.current_streak || 0} days</span>
          </div>
          <button className="btn-logout-enhanced" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main-enhanced">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* XP Progress Card */}
            <div className="xp-progress-card">
              <h2>Your Progress</h2>
              <div className="xp-visual">
                <div className="xp-circle">
                  <svg width="200" height="200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#e0e0e0" strokeWidth="12" />
                    <circle
                      cx="100" cy="100" r="90"
                      fill="none"
                      stroke="url(#xpGradient)"
                      strokeWidth="12"
                      strokeDasharray={`${(stats?.total_xp % 100) * 5.65} 565`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                    <defs>
                      <linearGradient id="xpGradient">
                        <stop offset="0%" stopColor="#4fc3f7" />
                        <stop offset="100%" stopColor="#29b6f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="xp-center-text">
                    <div className="xp-amount">{stats?.total_xp || 0}</div>
                    <div className="xp-label">Total XP</div>
                  </div>
                </div>
                <div className="level-info">
                  <h3>Level {stats?.current_level || 1}</h3>
                  <p>Knowledge Seeker</p>
                  <div className="xp-to-next">
                    <span>{stats?.xpToNextLevel || 100} XP to next level</span>
                    <div className="xp-bar">
                      <div
                        className="xp-bar-fill"
                        style={{ width: `${((stats?.total_xp || 0) % 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="quick-stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-value">{readingStats?.total_articles || 0}</div>
                <div className="stat-label">Articles Read</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{readingStats?.total_reading_time || 0}</div>
                <div className="stat-label">Minutes Read</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✨</div>
                <div className="stat-value">{readingStats?.total_quizzes || 0}</div>
                <div className="stat-label">Quizzes Done</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{readingStats?.average_quiz_score || 0}%</div>
                <div className="stat-label">Avg Score</div>
              </div>
            </div>

            {/* Recent Activity Chart */}
            <div className="activity-chart-card">
              <h3>This Week's Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weekData}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="xp" stroke="#4fc3f7" fillOpacity={1} fill="url(#xpGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Challenges Preview */}
            <div className="challenges-preview-card">
              <h3>Today's Challenges</h3>
              <div className="challenges-list">
                {challenges.slice(0, 3).map((challenge, index) => (
                  <div key={index} className={`challenge-item ${challenge.completed ? 'completed' : ''}`}>
                    <div className="challenge-icon">{challenge.icon}</div>
                    <div className="challenge-content">
                      <h4>{challenge.title}</h4>
                      <p>{challenge.description}</p>
                      <div className="challenge-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                          />
                        </div>
                        <span className="xp-reward">+{challenge.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="articles-tab">
            <h2>Reading History</h2>
            <div className="articles-grid">
              {articles.map(article => (
                <div key={article.id} className="article-card">
                  <h3>{article.wikipedia_title}</h3>
                  <div className="article-stats">
                    <div className="stat">
                      <span className="label">Completion</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${article.completion_percentage}%` }}
                        />
                      </div>
                      <span className="value">{article.completion_percentage}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Best Quiz</span>
                      <span className="value">{article.best_quiz_score}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">XP Earned</span>
                      <span className="value">{article.total_xp_earned}</span>
                    </div>
                  </div>
                  <a
                    href={article.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="continue-reading-btn"
                  >
                    Continue Reading →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="challenges-tab">
            <h2>Daily Challenges</h2>
            <div className="challenges-full-list">
              {challenges.map((challenge, index) => (
                <div key={index} className={`challenge-card ${challenge.completed ? 'completed' : ''} ${challenge.difficulty}`}>
                  <div className="challenge-header">
                    <div className="challenge-icon-large">{challenge.icon}</div>
                    <div className="challenge-info">
                      <h3>{challenge.title}</h3>
                      <p>{challenge.description}</p>
                      <span className={`difficulty-badge ${challenge.difficulty}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    <div className="challenge-reward">
                      <span className="xp-amount">+{challenge.xp_reward}</span>
                      <span className="xp-label">XP</span>
                    </div>
                  </div>
                  <div className="challenge-progress-detailed">
                    <div className="progress-numbers">
                      <span>{challenge.progress}</span>
                      <span>/</span>
                      <span>{challenge.target}</span>
                    </div>
                    <div className="progress-bar-large">
                      <div
                        className="progress-fill"
                        style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                      />
                    </div>
                    {challenge.completed && (
                      <div className="completed-badge">✅ Completed!</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <h2>Achievements</h2>
            {Object.entries(achievements).map(([category, categoryAchievements]) => (
              <div key={category} className="achievement-category">
                <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <div className="achievements-grid">
                  {(categoryAchievements as Achievement[]).map(achievement => (
                    <div
                      key={achievement.id}
                      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <h4>{achievement.name}</h4>
                      <p>{achievement.description}</p>
                      {!achievement.unlocked && (
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${achievement.percentage}%` }}
                            />
                          </div>
                          <span>{achievement.progress}/{achievement.percentage}%</span>
                        </div>
                      )}
                      {achievement.unlocked && (
                        <div className="unlocked-badge">✨ Unlocked!</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'adventure' && (
          <div className="adventure-tab">
            <div className="adventure-header">
              <h1>🗺️ Adventure Mode</h1>
              <p>Embark on a guided journey through human knowledge</p>
            </div>

            {/* Quest Selection for when no quest is active */}
            {!activeQuest && (
              <div className="quest-selection">
                <h2>Choose Your Adventure</h2>
                <div className="quest-grid">
                  {quests.map((quest: any) => (
                    <div key={quest.id} className={`quest-card ${quest.difficulty}`}>
                      <div className="quest-header">
                        <span className="quest-icon">{quest.icon}</span>
                        <div className="quest-info">
                          <h3>{quest.name}</h3>
                          <p>{quest.description}</p>
                          <span className={`difficulty-badge ${quest.difficulty}`}>
                            {quest.difficulty}
                          </span>
                        </div>
                      </div>

                      <div className="quest-rewards">
                        <div className="reward-item">
                          <span className="reward-icon">⚡</span>
                          <span>{quest.total_xp_reward} XP</span>
                        </div>
                        <div className="reward-item">
                          <span className="reward-icon">{quest.completion_badge}</span>
                          <span>Completion Badge</span>
                        </div>
                      </div>

                      <button
                        className="btn-quest-start"
                        onClick={() => startQuest(quest.id)}
                      >
                        Start Adventure
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Quest with Visual Path */}
            {activeQuest && activeQuest.quest_details && (
              <QuestPath
                stages={activeQuest.quest_details.stages}
                currentStage={activeQuest.current_stage || 1}
                completedArticles={activeQuest.completed_articles || []}
                onStageClick={(stage) => {
                  // Navigate to Wikipedia article when clicking on a stage
                  if (stage.current && stage.articles && stage.articles.length > 0) {
                    const nextArticle = stage.articles.find(
                      (article: string) => !activeQuest.completed_articles?.includes(article)
                    );
                    if (nextArticle) {
                      window.open(`https://en.wikipedia.org/wiki/${nextArticle.replace(/ /g, '_')}`, '_blank');
                    }
                  }
                }}
                onBack={() => setActiveQuest(null)}
              />
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-tab">
            <h2>Learning Insights</h2>

            <div className="insights-grid">
              {/* Reading Patterns */}
              <div className="insight-card">
                <h3>Reading Patterns</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="minutes" stroke="#81c784" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Favorite Categories */}
              <div className="insight-card">
                <h3>Favorite Topics</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {categoryData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Learning Stats */}
              <div className="insight-card">
                <h3>Learning Statistics</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <span>Articles This Week</span>
                    <strong>{readingStats?.articles_this_week || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Unique Reading Days</span>
                    <strong>{readingStats?.unique_reading_days || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Average Quiz Score</span>
                    <strong>{readingStats?.average_quiz_score || 0}%</strong>
                  </div>
                  <div className="stat-item">
                    <span>Total Reading Time</span>
                    <strong>{readingStats?.total_reading_time || 0} min</strong>
                  </div>
                </div>
              </div>

              {/* Knowledge Map Preview */}
              <div className="insight-card">
                <h3>Knowledge Areas</h3>
                <div className="knowledge-preview">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4fc3f7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EnhancedDashboard;