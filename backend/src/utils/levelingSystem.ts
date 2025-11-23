/**
 * Leveling System with Exponential XP Curve
 * Designed to be quick at first, then exponentially harder
 *
 * Formula: XP = baseXP * (level ^ exponent) + (level * linearFactor)
 *
 * Level Examples:
 * - Level 1-5: Quick progression (100-400 XP per level)
 * - Level 10: ~1,200 XP
 * - Level 20: ~5,000 XP
 * - Level 30: ~12,000 XP
 * - Level 50: ~40,000 XP
 * - Level 100: ~200,000 XP
 */

const BASE_XP = 100;
const EXPONENT = 1.5; // Controls how steep the curve is
const LINEAR_FACTOR = 50; // Adds some linear growth

/**
 * Calculate total XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += getXPForNextLevel(i);
  }
  return Math.floor(totalXP);
}

/**
 * Calculate XP required to go from current level to next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.floor(BASE_XP * Math.pow(currentLevel, EXPONENT) + (currentLevel * LINEAR_FACTOR));
}

/**
 * Calculate current level based on total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  let xpForNextLevel = getXPForLevel(level + 1);

  while (totalXP >= xpForNextLevel) {
    level++;
    xpForNextLevel = getXPForLevel(level + 1);

    // Safety cap at level 100
    if (level >= 100) break;
  }

  return level;
}

/**
 * Get XP progress within current level
 */
export function getXPProgress(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const progressPercentage = Math.floor((xpInCurrentLevel / xpForNextLevel) * 100);

  return {
    currentLevel,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercentage
  };
}

/**
 * Check if user leveled up and return level-up info
 */
export function checkLevelUp(oldXP: number, newXP: number): {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
} {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel > oldLevel;

  return {
    leveledUp,
    oldLevel,
    newLevel,
    levelsGained: newLevel - oldLevel
  };
}

/**
 * Generate level requirements table for reference
 */
export function generateLevelTable(maxLevel: number = 50): Array<{
  level: number;
  xpRequired: number;
  totalXP: number;
}> {
  const table = [];
  for (let level = 1; level <= maxLevel; level++) {
    table.push({
      level,
      xpRequired: getXPForNextLevel(level),
      totalXP: getXPForLevel(level)
    });
  }
  return table;
}
