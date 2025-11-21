import React, { useEffect, useState } from 'react';
import './AchievementPopup.css';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [confetti, setConfetti] = useState<Array<{id: number, left: number, delay: number, duration: number}>>([]);

  useEffect(() => {
    if (achievement) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2
      }));
      setConfetti(particles);

      // Show animation
      setTimeout(() => setIsVisible(true), 50);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  if (!achievement) return null;

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary': return '#fbbf24';
      case 'epic': return '#a855f7';
      case 'rare': return '#3b82f6';
      case 'common': return '#10b981';
      default: return '#64748b';
    }
  };

  const getRarityGlow = () => {
    switch (achievement.rarity) {
      case 'legendary': return '0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.5)';
      case 'epic': return '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.4)';
      case 'rare': return '0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)';
      case 'common': return '0 0 20px rgba(16, 185, 129, 0.4)';
      default: return 'none';
    }
  };

  return (
    <>
      {/* Confetti particles */}
      <div className="confetti-container">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="confetti-particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              backgroundColor: getRarityColor()
            }}
          />
        ))}
      </div>

      {/* Achievement popup */}
      <div
        className={`achievement-popup-overlay ${isVisible ? 'visible' : ''}`}
        onClick={handleClose}
      >
        <div
          className={`achievement-popup ${isVisible ? 'visible' : ''} ${achievement.rarity}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            borderColor: getRarityColor(),
            boxShadow: getRarityGlow()
          }}
        >
          {/* Shine effect */}
          <div className="shine-effect"></div>

          {/* Header */}
          <div className="achievement-popup-header">
            <div className="achievement-badge">
              <div className="badge-glow" style={{ backgroundColor: getRarityColor() }}></div>
              <div className="badge-icon-container">
                <span className="badge-icon">{achievement.icon}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="achievement-popup-content">
            <div className="achievement-unlock-text">Achievement Unlocked!</div>
            <h2 className="achievement-title">{achievement.name}</h2>
            <p className="achievement-description">{achievement.description}</p>

            <div className="achievement-rewards">
              <div className="reward-badge">
                <span className="reward-icon">⚡</span>
                <span className="reward-amount">+{achievement.xp_reward} XP</span>
              </div>
              <div className={`rarity-badge ${achievement.rarity}`}>
                {achievement.rarity.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button className="achievement-close-btn" onClick={handleClose}>
            Continue
          </button>

          {/* Particle effects around the badge */}
          <div className="badge-particles">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="badge-particle"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AchievementPopup;
