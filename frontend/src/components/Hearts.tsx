import React, { useState, useEffect } from 'react';
import './Hearts.css';

interface HeartsProps {
  userId: string;
  onNoHearts?: () => void;
}

interface HeartStatus {
  hearts: number;
  maxHearts: number;
  timeUntilNextHeart: number | null;
  canPlay: boolean;
}

const Hearts: React.FC<HeartsProps> = ({ userId, onNoHearts }) => {
  const [heartStatus, setHeartStatus] = useState<HeartStatus>({
    hearts: 5,
    maxHearts: 5,
    timeUntilNextHeart: null,
    canPlay: true
  });
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showRefillModal, setShowRefillModal] = useState(false);

  useEffect(() => {
    fetchHeartStatus();
    const interval = setInterval(fetchHeartStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    // Update countdown timer
    if (heartStatus.timeUntilNextHeart && heartStatus.hearts < heartStatus.maxHearts) {
      const interval = setInterval(() => {
        const remaining = heartStatus.timeUntilNextHeart! - (Date.now() - new Date().getTime());
        if (remaining <= 0) {
          fetchHeartStatus(); // Refetch when timer expires
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [heartStatus.timeUntilNextHeart]);

  const fetchHeartStatus = async () => {
    try {
      const response = await fetch(`/api/hearts/${userId}`);
      const data = await response.json();
      setHeartStatus(data);

      if (!data.canPlay && onNoHearts) {
        onNoHearts();
      }
    } catch (error) {
      console.error('Error fetching heart status:', error);
    }
  };

  const handleRefillHearts = async () => {
    try {
      const response = await fetch('/api/hearts/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: 5,
          reason: 'daily_bonus'
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchHeartStatus();
        setShowRefillModal(false);
      }
    } catch (error) {
      console.error('Error refilling hearts:', error);
    }
  };

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < heartStatus.maxHearts; i++) {
      if (i < heartStatus.hearts) {
        // Full heart
        hearts.push(
          <div key={i} className="heart full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        );
      } else {
        // Empty heart
        hearts.push(
          <div key={i} className="heart empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        );
      }
    }
    return hearts;
  };

  return (
    <>
      <div className="hearts-container">
        <div className="hearts-display">
          {renderHearts()}
        </div>
        {heartStatus.hearts < heartStatus.maxHearts && (
          <div className="heart-timer">
            {heartStatus.hearts === 0 ? (
              <span className="no-hearts-warning">No hearts!</span>
            ) : (
              <span className="timer-text">+1 ❤️ in {timeRemaining}</span>
            )}
          </div>
        )}
        {heartStatus.hearts === 0 && (
          <button
            className="refill-btn"
            onClick={() => setShowRefillModal(true)}
          >
            Get Hearts
          </button>
        )}
      </div>

      {/* Refill Modal */}
      {showRefillModal && (
        <div className="modal-overlay">
          <div className="refill-modal">
            <h2>❤️ Out of Hearts!</h2>
            <p>You need hearts to continue learning. Choose an option:</p>

            <div className="refill-options">
              <div className="refill-option">
                <div className="option-icon">⏰</div>
                <h3>Wait for Refill</h3>
                <p>Hearts regenerate 1 per hour</p>
                <p className="time-info">Next heart in: {timeRemaining}</p>
              </div>

              <div className="refill-option premium">
                <div className="option-icon">💎</div>
                <h3>WikiQuest Plus</h3>
                <p>Unlimited hearts & exclusive features</p>
                <button className="premium-btn">Upgrade for $9.99/month</button>
              </div>

              <div className="refill-option">
                <div className="option-icon">🎯</div>
                <h3>Complete Challenge</h3>
                <p>Earn hearts by completing daily challenges</p>
                <button
                  className="challenge-btn"
                  onClick={() => {
                    setShowRefillModal(false);
                    // Navigate to challenges
                    window.location.href = '#challenges';
                  }}
                >
                  Go to Challenges
                </button>
              </div>
            </div>

            <button
              className="modal-close"
              onClick={() => setShowRefillModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Hearts;