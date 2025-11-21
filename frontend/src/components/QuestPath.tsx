import React from 'react';
import './QuestPath.css';

interface Stage {
  stage: number;
  title: string;
  description: string;
  articles: string[];
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

          {/* Path shadow */}
          <path
            className="path-shadow"
            d="M 50 5
               C 62.5 5, 75 10, 75 15
               C 75 20, 62.5 25, 50 25
               C 37.5 25, 25 30, 25 35
               C 25 40, 25 40, 25 45
               C 25 50, 37.5 55, 50 55
               C 62.5 55, 75 60, 75 65
               C 75 70, 62.5 75, 50 75"
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="3 2"
            transform="translate(0.3, 0.5)"
          />

          {/* Base path - larger dots */}
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
            stroke="#E5E7EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 2"
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
            stroke="url(#pathGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 2"
            filter="url(#glow)"
            style={{
              strokeDashoffset: `${100 - (currentStage - 1) * 12.5}`,
              pathLength: 100
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
                className={`stage-node ${stage.completed ? 'completed' : ''} ${stage.current ? 'current' : ''} ${stage.locked ? 'locked' : ''}`}
                style={position}
                onClick={() => !stage.locked && onStageClick(stage)}
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
                  ) : (
                    <span className="stage-number">{stage.stage}</span>
                  )}
                </div>

                {/* Hover tooltip */}
                <div className="stage-tooltip">
                  <div className="tooltip-arrow"></div>
                  <h4>{stage.title}</h4>
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
                        <span>{article}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tooltip-footer">
                    <span className="xp-badge">+{stage.xp_reward} XP</span>
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

        {/* Current stage card */}
        {stagesWithStatus.find(s => s.current) && (
          <div className="current-stage-card">
            <div className="stage-icon">📚</div>
            <div className="stage-info">
              <h4>Current: {stagesWithStatus.find(s => s.current)?.title}</h4>
              <p>{stagesWithStatus.find(s => s.current)?.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestPath;