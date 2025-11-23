# Exponential Leveling System

## Overview
The new leveling system uses an exponential curve to make early levels quick while making higher levels increasingly challenging, similar to popular games like Diablo, WoW, and League of Legends.

## Formula
```
XP for Next Level = 100 * (level ^ 1.5) + (level * 50)
```

## Level Requirements Table

| Level | XP to Next Level | Total XP Needed | Time Estimate* |
|-------|------------------|-----------------|----------------|
| 1     | 150              | 0               | ~8 articles    |
| 2     | 282              | 150             | ~15 articles   |
| 3     | 460              | 432             | ~23 articles   |
| 4     | 650              | 892             | ~33 articles   |
| 5     | 861              | 1,542           | ~43 articles   |
| 10    | 1,711            | 7,237           | ~360 articles  |
| 15    | 2,808            | 19,785          | ~990 articles  |
| 20    | 4,142            | 41,993          | ~2,100 articles|
| 25    | 5,704            | 75,677          | ~3,780 articles|
| 30    | 7,485            | 123,318         | ~6,165 articles|
| 40    | 11,625           | 268,237         | ~13,400 articles|
| 50    | 16,461           | 518,337         | ~25,900 articles|
| 75    | 32,061           | 1,757,987       | ~87,900 articles|
| 100   | 50,050           | 3,993,187       | ~199,600 articles|

*Estimate based on 10 XP per article, 20 XP for golden completion

## XP Earning Rates

### Article Reading
- Regular Completion: **10 XP**
- Golden Completion (100% quiz): **20 XP**

### Quizzes
- Quiz XP is awarded through article completion

## Progression Comparison

### Old System (Linear)
- Level 10: 1,000 XP (100 articles)
- Level 50: 5,000 XP (500 articles)
- Level 100: 10,000 XP (1,000 articles)

### New System (Exponential)
- Level 10: 7,237 XP (~360 articles)
- Level 50: 518,337 XP (~25,900 articles)
- Level 100: 3,993,187 XP (~199,600 articles)

## Design Philosophy

1. **Quick Start** (Levels 1-5): Fast progression to keep new users engaged
2. **Steady Growth** (Levels 5-20): Moderate difficulty increase
3. **Challenging Climb** (Levels 20-50): Significant commitment required
4. **Endgame Grind** (Levels 50+): Reserved for dedicated players

## Implementation Details

The system is implemented in `/backend/src/utils/levelingSystem.ts` and automatically:
- Calculates current level from total XP
- Updates `current_level` in the database when XP is gained
- Provides progress tracking (XP in current level, XP to next level, progress %)
- Supports level-up detection for notifications
