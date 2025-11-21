import React from 'react';
import './QuestPath.css';

interface Stage {
  stage: number;
  title: string;
  description: string;
  articles: string[];
  articleIcons?: { [key: string]: string };
  xp_reward: number;
  badge: string;
  icon: string;
  completed?: boolean;
  current?: boolean;
  locked?: boolean;
}

interface QuestPathProps {
  stages: Stage[];
  currentStage: number;
  completedArticles: string[];
  onStageClick: (stage: Stage) => void;
  onBack?: () => void;
}

const QuestPath: React.FC<QuestPathProps> = ({ stages, currentStage, completedArticles, onStageClick, onBack }) => {
  const [selectedStage, setSelectedStage] = React.useState<Stage | null>(null);

  // Calculate completion for each stage
  const stagesWithStatus = stages.map((stage, index) => {
    const stageNum = index + 1;
    const articlesCompleted = stage.articles.filter(article =>
      completedArticles.includes(article)
    ).length;

    return {
      ...stage,
      completed: stageNum < currentStage,
      current: stageNum === currentStage,
      locked: stageNum > currentStage,
      progress: (articlesCompleted / stage.articles.length) * 100,
      articlesCompleted
    };
  });

  return (
    <div className="quest-path-container">
      {/* Dotted grid background */}
      <div className="grid-background"></div>

      {/* Back button */}
      <button
        className="back-to-adventures"
        onClick={() => onBack ? onBack() : window.location.reload()}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 18l-8-8 8-8 1.4 1.4L4.8 10l6.6 6.6z"/>
        </svg>
        Back
      </button>

      <div className="quest-path">
        {/* Main path SVG */}
        <svg className="path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {/* Gradient for completed path */}
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            {/* Base path gradient */}
            <linearGradient id="basePathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Shadow filter */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2"/>
            </filter>
          </defs>

          {/* Base path - smaller dots */}
          <path
            className="path-base"
            d="M 50 5
               C 62.5 5, 75 10, 75 15
               C 75 20, 62.5 25, 50 25
               C 37.5 25, 25 30, 25 35
               C 25 40, 25 40, 25 45
               C 25 50, 37.5 55, 50 55
               C 62.5 55, 75 60, 75 65
               C 75 70, 62.5 75, 50 75"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeDasharray="1 2"
            opacity="0.6"
          />

          {/* Completed path */}
          <path
            className="path-completed"
            d="M 50 5
               C 62.5 5, 75 10, 75 15
               C 75 20, 62.5 25, 50 25
               C 37.5 25, 25 30, 25 35
               C 25 40, 25 40, 25 45
               C 25 50, 37.5 55, 50 55
               C 62.5 55, 75 60, 75 65
               C 75 70, 62.5 75, 50 75"
            fill="none"
            stroke="#64748B"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="1 2"
            style={{
              strokeDashoffset: 0,
              strokeDasharray: `${(currentStage - 1) * 12.5} ${100}`,
              pathLength: 100,
              transition: 'stroke-dasharray 0.5s ease-in-out'
            }}
          />
        </svg>

        {/* Stage nodes */}
        <div className="stages-container">
          {stagesWithStatus.map((stage, index) => {
            const positions = [
              { left: '50%', top: '5%' },    // Stage 1
              { left: '75%', top: '15%' },   // Stage 2
              { left: '50%', top: '25%' },   // Stage 3
              { left: '25%', top: '35%' },   // Stage 4
              { left: '25%', top: '45%' },   // Stage 5
              { left: '50%', top: '55%' },   // Stage 6
              { left: '75%', top: '65%' },   // Stage 7
              { left: '50%', top: '75%' },   // Stage 8
            ];

            const position = positions[index] || { left: '50%', top: `${10 + index * 10}%` };

            return (
              <div
                key={stage.stage}
                className={`stage-node ${stage.completed ? 'completed' : ''} ${stage.current ? 'current' : ''} ${stage.locked ? 'locked' : ''} ${selectedStage?.stage === stage.stage ? 'selected' : ''}`}
                style={position}
                onClick={() => setSelectedStage(stage)}
              >
                {/* Outer ring */}
                <div className="stage-ring-outer">
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle
                      cx="45"
                      cy="45"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                    />
                    {/* Progress arc */}
                    <circle
                      cx="45"
                      cy="45"
                      r="40"
                      fill="none"
                      stroke={stage.completed ? '#10B981' : stage.current ? '#3B82F6' : '#9CA3AF'}
                      strokeWidth="3"
                      strokeDasharray={`${stage.progress * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 45 45)"
                      opacity={stage.locked ? 0.3 : 1}
                    />
                  </svg>
                </div>

                {/* Inner circle */}
                <div className={`stage-inner ${stage.completed ? 'completed' : ''} ${stage.current ? 'current' : ''}`}>
                  {stage.locked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6z"/>
                    </svg>
                  ) : stage.completed ? (
                    <span className="stage-icon">{stage.badge || '✓'}</span>
                  ) : (
                    <span className="stage-icon">{stage.icon || stage.stage}</span>
                  )}
                </div>

                {/* Hover tooltip */}
                <div className="stage-tooltip">
                  <div className="tooltip-arrow"></div>
                  <h4>
                    <span className="tooltip-icon">{stage.icon}</span>
                    {stage.title}
                  </h4>
                  <p>{stage.description}</p>

                  <div className="articles-list">
                    {stage.articles.map((article, idx) => (
                      <div key={idx} className={`article-item ${completedArticles.includes(article) ? 'done' : ''}`}>
                        <div className="article-checkbox">
                          {completedArticles.includes(article) && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M4.5 7.5L2 5l-.7.7L4.5 9 11 2.5l-.7-.7z"/>
                            </svg>
                          )}
                        </div>
                        <span className="article-icon-small">{stage.articleIcons?.[article] || ''}</span>
                        <span>{article}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tooltip-footer">
                    <span className="xp-badge">{stage.badge} +{stage.xp_reward} XP</span>
                    {stage.current && (
                      <button className="start-btn">Start →</button>
                    )}
                  </div>
                </div>

                {/* Completion star */}
                {stage.completed && (
                  <div className="completion-star">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  </div>
                )}

                {/* Current pulse */}
                {stage.current && (
                  <div className="current-pulse"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ambient particles */}
        <div className="particles">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}></div>
          ))}
        </div>
      </div>

      {/* Progress summary */}
      <div className="quest-summary">
        <div className="summary-header">
          <h3>Your Journey Progress</h3>
          <div className="progress-stats">
            <span className="stat">
              <strong>{currentStage - 1}</strong> / {stages.length} Completed
            </span>
            <span className="stat">
              <strong>{completedArticles.length}</strong> Articles Read
            </span>
          </div>
        </div>

        {/* Selected stage details */}
        {selectedStage && (
          <div className="selected-stage-panel">
            <div className="panel-header">
              <h3>
                <span className="stage-detail-icon">{selectedStage.icon}</span>
                Stage {selectedStage.stage}: {selectedStage.title}
              </h3>
              <p className="stage-description">{selectedStage.description}</p>
            </div>

            <div className="articles-selection-grid">
              {selectedStage.articles.map((article, idx) => {
                const isCompleted = completedArticles.includes(article);
                return (
                  <div
                    key={idx}
                    className={`article-select-card ${isCompleted ? 'completed' : ''} ${selectedStage.locked ? 'locked' : ''}`}
                    onClick={() => {
                      if (!selectedStage.locked && !isCompleted) {
                        // Start the article (will trigger quiz after reading)
                        onStageClick({ ...selectedStage, currentArticle: article });
                      }
                    }}
                  >
                    <div className="article-main-icon">
                      {selectedStage.articleIcons?.[article] || selectedStage.badge}
                    </div>
                    <h4 className="article-title">{article}</h4>
                    {isCompleted && (
                      <div className="completion-badge">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-2-11l-1 1 3 3 5-5-1-1-4 4-2-2z"/>
                        </svg>
                      </div>
                    )}
                    {!selectedStage.locked && !isCompleted && (
                      <button className="start-article-btn">
                        Start Reading →
                      </button>
                    )}
                    {selectedStage.locked && (
                      <div className="locked-overlay">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="stage-progress-info">
              <div className="xp-reward">
                <span>{selectedStage.badge}</span>
                <span>Complete all to earn {selectedStage.xp_reward} XP</span>
              </div>
              <div className="articles-progress">
                {selectedStage.articles.filter(a => completedArticles.includes(a)).length} / {selectedStage.articles.length} completed
              </div>
            </div>
          </div>
        )}

        {/* Current stage hint when nothing selected */}
        {!selectedStage && stagesWithStatus.find(s => s.current) && (
          <div className="current-stage-hint">
            <p>👆 Click on a stage above to see its articles and start learning!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestPath;