// Examples of using Lex Mascot in different parts of WikiHero app

import React from 'react';
import { LexMascot } from '../components/LexMascot';

// EXAMPLE 1: Dashboard Welcome Screen
export function DashboardWelcome({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white rounded-lg">
      <LexMascot
        state="wave"
        size="large"
        message={`Welcome back, ${username}! Ready to explore Wikipedia?`}
        autoPlay
      />

      <button className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Start Learning
      </button>
    </div>
  );
}

// EXAMPLE 2: WikiRace Start Screen
export function WikiRaceStart({ startPage, targetPage }: { startPage: string; targetPage: string }) {
  return (
    <div className="text-center p-6">
      <LexMascot
        state="racing"
        size="medium"
        message={`Race from ${startPage} to ${targetPage}!`}
      />

      <div className="mt-6 space-y-3">
        <div className="text-lg">
          <span className="font-bold text-blue-600">{startPage}</span>
          {' → '}
          <span className="font-bold text-green-600">{targetPage}</span>
        </div>

        <button className="px-8 py-4 bg-red-500 text-white rounded-lg text-xl font-bold hover:bg-red-600">
          START RACE! 🏁
        </button>
      </div>
    </div>
  );
}

// EXAMPLE 3: Victory Screen
export function VictoryScreen({ score, clicks, time }: { score: number; clicks: number; time: number }) {
  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-b from-yellow-50 to-white rounded-lg">
      <LexMascot
        state="victory"
        size="large"
        message="Incredible! You're a true WikiHero! 🏆"
      />

      <div className="mt-6 text-center space-y-2">
        <h2 className="text-3xl font-bold text-yellow-600">Victory!</h2>
        <div className="text-xl">Score: {score}/100</div>
        <div className="text-gray-600">
          {clicks} clicks • {time} seconds
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Race Again
        </button>
        <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
          View Stats
        </button>
      </div>
    </div>
  );
}

// EXAMPLE 4: Hearts Empty / Tired
export function HeartsEmpty({ refillTime }: { refillTime: string }) {
  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-b from-gray-50 to-white rounded-lg">
      <LexMascot
        state="tired"
        size="large"
        message="Time to rest! Even heroes need breaks. 💤"
      />

      <div className="mt-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Out of Hearts!</h2>
        <p className="text-gray-600">
          Next heart refills in: <span className="font-bold text-blue-600">{refillTime}</span>
        </p>

        <div className="flex gap-3">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Refill Now (50 Pages)
          </button>
          <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Wait
          </button>
        </div>
      </div>
    </div>
  );
}

// EXAMPLE 5: Loading / Thinking State
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LexMascot
        state="thinking"
        size="medium"
        message="Finding the perfect path..."
      />

      <div className="mt-4 text-gray-600 animate-pulse">
        Loading...
      </div>
    </div>
  );
}

// EXAMPLE 6: Achievement Unlocked Popup
export function AchievementPopup({ title, description }: { title: string; description: string }) {
  return (
    <div className="fixed top-20 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-sm animate-bounce-in z-50">
      <div className="flex items-start gap-4">
        <LexMascot state="victory" size="small" />

        <div className="flex-1">
          <div className="text-sm text-yellow-600 font-semibold">ACHIEVEMENT UNLOCKED!</div>
          <h3 className="text-lg font-bold text-gray-900 mt-1">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="text-sm text-blue-600 mt-2">+50 XP • +25 Pages</div>
        </div>
      </div>
    </div>
  );
}

// EXAMPLE 7: Extension Popup (Small Space)
export function ExtensionPopupHeader({ streak, xp, level }: { streak: number; xp: number; level: number }) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-lg">
      <div className="flex items-center justify-between">
        {/* Left: Mascot */}
        <LexMascot state="wave" size="small" />

        {/* Right: Stats */}
        <div className="text-white text-right">
          <div className="text-sm opacity-90">Level {level}</div>
          <div className="text-2xl font-bold">{xp} XP</div>
          <div className="text-sm opacity-90">🔥 {streak} day streak</div>
        </div>
      </div>
    </div>
  );
}

// EXAMPLE 8: Daily Challenge Complete
export function DailyChallengeComplete({ challenge, reward }: { challenge: string; reward: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="text-center">
        <LexMascot
          state="victory"
          size="medium"
          message="Challenge complete! Well done! 🎉"
        />

        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-600">Daily Challenge</div>
          <h3 className="text-xl font-bold text-gray-900">{challenge}</h3>
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
            {reward}
          </div>
        </div>

        <button className="mt-6 w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Claim Reward
        </button>
      </div>
    </div>
  );
}

// EXAMPLE 9: First Time User Onboarding
export function OnboardingWelcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <LexMascot
        state="wave"
        size="large"
        message="Hi! I'm Lex, your guide to becoming a WikiHero!"
      />

      <div className="mt-8 text-center max-w-md space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to WikiHero</h1>
        <p className="text-lg text-gray-600">
          Learn, explore, and race through Wikipedia with Lex the turtle!
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-sm font-semibold">Learn</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🏁</div>
            <div className="text-sm font-semibold">Race</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-sm font-semibold">Achieve</div>
          </div>
        </div>

        <button className="mt-8 w-full px-8 py-4 bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600">
          Let's Start!
        </button>
      </div>
    </div>
  );
}

// EXAMPLE 10: Empty State (No Races Yet)
export function EmptyRaceHistory() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <LexMascot
        state="neutral"
        size="large"
        message="No races yet! Want to start your first WikiRace?"
      />

      <div className="mt-6 space-y-3">
        <h3 className="text-xl font-bold text-gray-900">Ready to Race?</h3>
        <p className="text-gray-600 max-w-md">
          Challenge yourself to navigate from one Wikipedia article to another using only links!
        </p>

        <button className="mt-4 px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
          Start First Race 🏁
        </button>
      </div>
    </div>
  );
}
