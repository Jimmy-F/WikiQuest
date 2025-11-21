import React, { useState, useEffect } from 'react';
import './ExplorerMode.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  totalArticles: number;
  articlesCompleted: number;
  currentLevel: number;
  articles: {
    level: number;
    items: {
      title: string;
      icon: string;
      difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
      completed?: boolean;
      golden?: boolean;
    }[];
  }[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ExplorerModeProps {
  userId: string;
  completedArticles: string[];
  goldenArticles: string[];
  onStartArticle: (article: string, category: string, level: number) => void;
  onBack: () => void;
  achievements?: Achievement[];
}

const ExplorerMode: React.FC<ExplorerModeProps> = ({
  userId,
  completedArticles,
  goldenArticles,
  onStartArticle,
  onBack,
  achievements = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [categories] = useState<Category[]>([
    {
      id: 'history',
      name: 'History',
      icon: '📜',
      color: '#8b5cf6',
      description: 'Journey through time and discover the stories that shaped our world',
      totalArticles: 15,
      articlesCompleted: 0,
      currentLevel: 1,
      articles: [
        {
          level: 1,
          items: [
            { title: 'Ancient Egypt', icon: '🏺', difficulty: 'Beginner' },
            { title: 'Roman Empire', icon: '⚔️', difficulty: 'Beginner' },
            { title: 'Middle Ages', icon: '🏰', difficulty: 'Beginner' }
          ]
        },
        {
          level: 2,
          items: [
            { title: 'Renaissance', icon: '🎨', difficulty: 'Intermediate' },
            { title: 'Industrial Revolution', icon: '⚙️', difficulty: 'Intermediate' },
            { title: 'World War I', icon: '🎖️', difficulty: 'Intermediate' }
          ]
        },
        {
          level: 3,
          items: [
            { title: 'World War II', icon: '✈️', difficulty: 'Advanced' },
            { title: 'Cold War', icon: '❄️', difficulty: 'Advanced' },
            { title: 'Space Race', icon: '🚀', difficulty: 'Advanced' }
          ]
        },
        {
          level: 4,
          items: [
            { title: 'Silk Road', icon: '🛤️', difficulty: 'Expert' },
            { title: 'Ottoman Empire', icon: '🕌', difficulty: 'Expert' },
            { title: 'Age of Exploration', icon: '⛵', difficulty: 'Expert' }
          ]
        }
      ]
    },
    {
      id: 'science',
      name: 'Science',
      icon: '🔬',
      color: '#10b981',
      description: 'Explore the fundamental laws and discoveries that govern our universe',
      totalArticles: 18,
      articlesCompleted: 0,
      currentLevel: 1,
      articles: [
        {
          level: 1,
          items: [
            { title: 'Gravity', icon: '🌍', difficulty: 'Beginner' },
            { title: 'Magnetism', icon: '🧲', difficulty: 'Beginner' },
            { title: 'Light', icon: '💡', difficulty: 'Beginner' },
            { title: 'Sound', icon: '🔊', difficulty: 'Beginner' }
          ]
        },
        {
          level: 2,
          items: [
            { title: 'Electricity', icon: '⚡', difficulty: 'Intermediate' },
            { title: 'Thermodynamics', icon: '🌡️', difficulty: 'Intermediate' },
            { title: 'Optics', icon: '🔭', difficulty: 'Intermediate' },
            { title: 'Waves', icon: '〰️', difficulty: 'Intermediate' }
          ]
        },
        {
          level: 3,
          items: [
            { title: 'Quantum Mechanics', icon: '⚛️', difficulty: 'Advanced' },
            { title: 'Relativity', icon: '⏰', difficulty: 'Advanced' },
            { title: 'Nuclear Physics', icon: '☢️', difficulty: 'Advanced' },
            { title: 'Particle Physics', icon: '🔬', difficulty: 'Advanced' }
          ]
        },
        {
          level: 4,
          items: [
            { title: 'String Theory', icon: '🎻', difficulty: 'Expert' },
            { title: 'Dark Matter', icon: '🌌', difficulty: 'Expert' },
            { title: 'Black Holes', icon: '🕳️', difficulty: 'Expert' }
          ]
        }
      ]
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: '🧬',
      color: '#f59e0b',
      description: 'Discover the complex systems and processes that define life on Earth',
      totalArticles: 16,
      articlesCompleted: 0,
      currentLevel: 1,
      articles: [
        {
          level: 1,
          items: [
            { title: 'Cell', icon: '🦠', difficulty: 'Beginner' },
            { title: 'DNA', icon: '🧬', difficulty: 'Beginner' },
            { title: 'Photosynthesis', icon: '🌱', difficulty: 'Beginner' },
            { title: 'Evolution', icon: '🐒', difficulty: 'Beginner' }
          ]
        },
        {
          level: 2,
          items: [
            { title: 'Genetics', icon: '🧬', difficulty: 'Intermediate' },
            { title: 'Ecology', icon: '🌳', difficulty: 'Intermediate' },
            { title: 'Metabolism', icon: '⚡', difficulty: 'Intermediate' },
            { title: 'Immune System', icon: '🛡️', difficulty: 'Intermediate' }
          ]
        },
        {
          level: 3,
          items: [
            { title: 'Neuroscience', icon: '🧠', difficulty: 'Advanced' },
            { title: 'Endocrinology', icon: '💊', difficulty: 'Advanced' },
            { title: 'Molecular Biology', icon: '🔬', difficulty: 'Advanced' },
            { title: 'Virology', icon: '🦠', difficulty: 'Advanced' }
          ]
        },
        {
          level: 4,
          items: [
            { title: 'CRISPR', icon: '✂️', difficulty: 'Expert' },
            { title: 'Synthetic Biology', icon: '🧪', difficulty: 'Expert' },
            { title: 'Epigenetics', icon: '🔄', difficulty: 'Expert' },
            { title: 'Proteomics', icon: '🧬', difficulty: 'Expert' }
          ]
        }
      ]
    },
    {
      id: 'geography',
      name: 'Geography',
      icon: '🌍',
      color: '#06b6d4',
      description: 'Travel the world and understand the forces that shape our planet',
      totalArticles: 15,
      articlesCompleted: 0,
      currentLevel: 1,
      articles: [
        {
          level: 1,
          items: [
            { title: 'Continents', icon: '🗺️', difficulty: 'Beginner' },
            { title: 'Oceans', icon: '🌊', difficulty: 'Beginner' },
            { title: 'Mountains', icon: '⛰️', difficulty: 'Beginner' }
          ]
        },
        {
          level: 2,
          items: [
            { title: 'Climate Zones', icon: '🌡️', difficulty: 'Intermediate' },
            { title: 'Tectonic Plates', icon: '🌋', difficulty: 'Intermediate' },
            { title: 'Rivers', icon: '🏞️', difficulty: 'Intermediate' },
            { title: 'Deserts', icon: '🏜️', difficulty: 'Intermediate' }
          ]
        },
        {
          level: 3,
          items: [
            { title: 'Ocean Currents', icon: '🌊', difficulty: 'Advanced' },
            { title: 'Weather Systems', icon: '🌪️', difficulty: 'Advanced' },
            { title: 'Ecosystems', icon: '🌿', difficulty: 'Advanced' }
          ]
        },
        {
          level: 4,
          items: [
            { title: 'Biogeography', icon: '🦎', difficulty: 'Expert' },
            { title: 'Geomorphology', icon: '🏔️', difficulty: 'Expert' },
            { title: 'Climatology', icon: '☁️', difficulty: 'Expert' },
            { title: 'Cartography', icon: '🗺️', difficulty: 'Expert' }
          ]
        }
      ]
    },
    {
      id: 'technology',
      name: 'Technology',
      icon: '💻',
      color: '#ec4899',
      description: 'Understand the innovations that are transforming our digital world',
      totalArticles: 12,
      articlesCompleted: 0,
      currentLevel: 1,
      articles: [
        {
          level: 1,
          items: [
            { title: 'Internet', icon: '🌐', difficulty: 'Beginner' },
            { title: 'Computer', icon: '💻', difficulty: 'Beginner' },
            { title: 'Smartphone', icon: '📱', difficulty: 'Beginner' }
          ]
        },
        {
          level: 2,
          items: [
            { title: 'Artificial Intelligence', icon: '🤖', difficulty: 'Intermediate' },
            { title: 'Blockchain', icon: '⛓️', difficulty: 'Intermediate' },
            { title: 'Cloud Computing', icon: '☁️', difficulty: 'Intermediate' }
          ]
        },
        {
          level: 3,
          items: [
            { title: 'Machine Learning', icon: '🧠', difficulty: 'Advanced' },
            { title: 'Quantum Computing', icon: '⚛️', difficulty: 'Advanced' },
            { title: 'Cybersecurity', icon: '🔐', difficulty: 'Advanced' }
          ]
        },
        {
          level: 4,
          items: [
            { title: 'Neural Networks', icon: '🕸️', difficulty: 'Expert' },
            { title: 'Cryptography', icon: '🔑', difficulty: 'Expert' },
            { title: 'Nanotechnology', icon: '🔬', difficulty: 'Expert' }
          ]
        }
      ]
    },
    {
      id: 'arts',
      name: 'Arts & Culture',
      icon: '🎨',
      color: '#a855f7',
      description: 'Explore human creativity and cultural expression throughout history',
      totalArticles: 14,
      articlesCompleted: 0,
      currentLevel: 1,
      articles: [
        {
          level: 1,
          items: [
            { title: 'Painting', icon: '🖼️', difficulty: 'Beginner' },
            { title: 'Music', icon: '🎵', difficulty: 'Beginner' },
            { title: 'Dance', icon: '💃', difficulty: 'Beginner' }
          ]
        },
        {
          level: 2,
          items: [
            { title: 'Impressionism', icon: '🎨', difficulty: 'Intermediate' },
            { title: 'Classical Music', icon: '🎼', difficulty: 'Intermediate' },
            { title: 'Theatre', icon: '🎭', difficulty: 'Intermediate' },
            { title: 'Film', icon: '🎬', difficulty: 'Intermediate' }
          ]
        },
        {
          level: 3,
          items: [
            { title: 'Surrealism', icon: '🌀', difficulty: 'Advanced' },
            { title: 'Opera', icon: '🎶', difficulty: 'Advanced' },
            { title: 'Modern Art', icon: '🖌️', difficulty: 'Advanced' }
          ]
        },
        {
          level: 4,
          items: [
            { title: 'Dadaism', icon: '🎲', difficulty: 'Expert' },
            { title: 'Postmodernism', icon: '🔲', difficulty: 'Expert' },
            { title: 'Performance Art', icon: '🎪', difficulty: 'Expert' },
            { title: 'Digital Art', icon: '💾', difficulty: 'Expert' }
          ]
        }
      ]
    }
  ]);

  // Update category progress based on completed articles
  useEffect(() => {
    const updatedCategories = categories.map(category => {
      let completed = 0;
      let currentLevel = 1;

      category.articles.forEach(level => {
        level.items.forEach(article => {
          if (completedArticles.includes(article.title)) {
            completed++;
            article.completed = true;
            article.golden = goldenArticles.includes(article.title);

            // Update current level based on completion
            const levelCompletion = level.items.filter(a =>
              completedArticles.includes(a.title)
            ).length / level.items.length;

            if (levelCompletion >= 0.75 && level.level >= currentLevel) {
              currentLevel = level.level + 1;
            }
          }
        });
      });

      return {
        ...category,
        articlesCompleted: completed,
        currentLevel: Math.min(currentLevel, category.articles.length)
      };
    });
  }, [completedArticles, goldenArticles]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#3b82f6';
      case 'Advanced': return '#f59e0b';
      case 'Expert': return '#ef4444';
      default: return '#64748b';
    }
  };

  const canAccessLevel = (category: Category, level: number) => {
    if (level === 1) return true;

    // Need 75% completion of previous level to unlock next
    const prevLevel = category.articles.find(l => l.level === level - 1);
    if (!prevLevel) return false;

    const completed = prevLevel.items.filter(a =>
      completedArticles.includes(a.title)
    ).length;

    return completed / prevLevel.items.length >= 0.75;
  };

  if (selectedCategory) {
    return (
      <div className="explorer-container">
        <div className="explorer-header">
          <button className="back-button" onClick={() => setSelectedCategory(null)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18l-8-8 8-8 1.4 1.4L4.8 10l6.6 6.6z"/>
            </svg>
            Back to Categories
          </button>

          <div className="category-header">
            <span className="category-icon-large">{selectedCategory.icon}</span>
            <div className="category-info">
              <h1>{selectedCategory.name}</h1>
              <p>{selectedCategory.description}</p>
            </div>
            <div className="category-stats">
              <div className="stat">
                <span className="stat-label">Progress</span>
                <span className="stat-value">
                  {selectedCategory.articlesCompleted}/{selectedCategory.totalArticles}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Level</span>
                <span className="stat-value">{selectedCategory.currentLevel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="levels-container">
          {selectedCategory.articles.map((level, levelIndex) => {
            const isLocked = !canAccessLevel(selectedCategory, level.level);
            const levelProgress = level.items.filter(a =>
              completedArticles.includes(a.title)
            ).length / level.items.length * 100;

            return (
              <div key={level.level} className={`level-section ${isLocked ? 'locked' : ''}`}>
                <div className="level-header">
                  <h3>Level {level.level}</h3>
                  <div className="level-progress">
                    <div className="level-progress-bar">
                      <div
                        className="level-progress-fill"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                    <span className="level-progress-text">
                      {Math.round(levelProgress)}% Complete
                    </span>
                  </div>
                </div>

                <div className="articles-grid">
                  {level.items.map((article, index) => (
                    <div
                      key={index}
                      className={`article-card ${article.completed ? 'completed' : ''} ${article.golden ? 'golden' : ''} ${isLocked ? 'locked' : ''}`}
                      onClick={() => {
                        if (!isLocked && !article.completed) {
                          onStartArticle(article.title, selectedCategory.id, level.level);
                        }
                      }}
                    >
                      <div className="article-icon">{article.icon}</div>
                      <h4>{article.title}</h4>
                      <span
                        className="difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(article.difficulty) }}
                      >
                        {article.difficulty}
                      </span>

                      {article.completed && (
                        <div className="completion-indicator">
                          {article.golden ? '🏆' : '✅'}
                        </div>
                      )}

                      {isLocked && (
                        <div className="lock-overlay">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6z"/>
                          </svg>
                          <span>Complete 75% of Level {level.level - 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="explorer-container">
      <div className="explorer-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 18l-8-8 8-8 1.4 1.4L4.8 10l6.6 6.6z"/>
          </svg>
          Back to Dashboard
        </button>

        <div className="explorer-title">
          <h1>🧭 Explorer Mode</h1>
          <p>Choose a category to begin your learning journey</p>
        </div>

        <button
          className="achievements-toggle"
          onClick={() => setShowAchievements(!showAchievements)}
        >
          🏆 Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </button>
      </div>

      {showAchievements && (
        <div className="achievements-section">
          <h2>Explorer Achievements</h2>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.rarity}`}
              >
                <div className="badge-icon">{achievement.icon}</div>
                <div className="badge-content">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                  {!achievement.unlocked && achievement.progress > 0 && (
                    <div className="achievement-progress">
                      <div
                        className="progress-bar-mini"
                        style={{
                          '--progress': `${(achievement.progress / achievement.total) * 100}%`
                        } as React.CSSProperties}
                      />
                      <span>{achievement.progress}/{achievement.total}</span>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <div className="xp-earned">+{achievement.xp_reward} XP</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="categories-grid">
        {categories.map(category => {
          const progressPercentage = (category.articlesCompleted / category.totalArticles) * 100;

          return (
            <div
              key={category.id}
              className="category-card"
              onClick={() => setSelectedCategory(category)}
              style={{ '--category-color': category.color } as React.CSSProperties}
            >
              <div className="category-card-header">
                <span className="category-icon">{category.icon}</span>
                <h3>{category.name}</h3>
              </div>

              <p className="category-description">{category.description}</p>

              <div className="category-progress">
                <div className="progress-info">
                  <span>Progress</span>
                  <span>{category.articlesCompleted}/{category.totalArticles}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: category.color
                    }}
                  />
                </div>
              </div>

              <div className="category-footer">
                <span className="current-level">Level {category.currentLevel}</span>
                <span className="start-arrow">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExplorerMode;