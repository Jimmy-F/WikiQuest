// Lex the Turtle Mascot Component
// Displays the WikiHero mascot with different states and animations

import React, { useState, useEffect } from 'react';

interface LexMascotProps {
  state?: 'neutral' | 'wave' | 'victory' | 'racing' | 'tired' | 'thinking';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  autoPlay?: boolean;
}

export function LexMascot({
  state = 'neutral',
  size = 'medium',
  message,
  autoPlay = true
}: LexMascotProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
  };

  // Asset paths
  const assets = {
    neutral: '/assets/mascot/lex-neutral.png',
    wave: '/assets/mascot/lex-wave.mp4',
    // Add more states as you generate them
    victory: '/assets/mascot/lex-victory.png',
    racing: '/assets/mascot/lex-racing.png',
    tired: '/assets/mascot/lex-tired.png',
    thinking: '/assets/mascot/lex-thinking.png',
  };

  // Check if current state is video
  const isVideo = state === 'wave' && assets[state]?.endsWith('.mp4');

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mascot Container */}
      <div className={`relative ${sizeClasses[size]} transition-all duration-300`}>
        {isVideo ? (
          <video
            src={assets[state]}
            autoPlay={autoPlay}
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src={assets[state]} type="video/mp4" />
            Your browser does not support video.
          </video>
        ) : (
          <img
            src={assets[state] || assets.neutral}
            alt={`Lex the turtle - ${state}`}
            className="w-full h-full object-contain animate-fade-in"
          />
        )}
      </div>

      {/* Speech Bubble (Optional) */}
      {message && (
        <div className="relative bg-white rounded-lg shadow-lg p-3 max-w-xs">
          {/* Speech bubble arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />

          <p className="text-sm text-gray-800 relative z-10">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}

// Example usage in other components:
/*
// Dashboard welcome
<LexMascot
  state="wave"
  size="large"
  message="Welcome back! Ready to learn?"
/>

// WikiRace start
<LexMascot
  state="racing"
  size="medium"
  message="Let's race through Wikipedia!"
/>

// Achievement unlocked
<LexMascot
  state="victory"
  size="large"
  message="You did it! Gold medal earned!"
/>

// Hearts empty
<LexMascot
  state="tired"
  size="medium"
  message="Time to rest! Hearts refill in 1 hour."
/>

// Loading state
<LexMascot
  state="thinking"
  size="small"
/>
*/
