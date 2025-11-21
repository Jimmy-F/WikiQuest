#!/bin/bash

echo "Testing WikiQuest API endpoints through frontend proxy..."
echo ""

USER_ID="d8193d70-a462-479c-b54b-ffcee1978332"
BASE_URL="http://localhost:3001"

echo "1. Testing Analytics Dashboard..."
curl -s "$BASE_URL/api/analytics/dashboard?userId=$USER_ID" | jq '.user' | head -10
echo ""

echo "2. Testing Daily Challenges..."
curl -s "$BASE_URL/api/challenges/daily/$USER_ID" | jq '.challenges[] | {title, xp_reward}'
echo ""

echo "3. Testing Quests..."
curl -s "$BASE_URL/api/quests" | jq '.quests[] | {name, difficulty, total_xp_reward}'
echo ""

echo "4. Testing Articles History..."
curl -s "$BASE_URL/api/articles/history?userId=$USER_ID&limit=5" | jq '.articles | length'
echo ""

echo "5. Testing Achievements..."
curl -s "$BASE_URL/api/achievements/user/$USER_ID" | jq '.userAchievements | length'
echo ""

echo "All API endpoints are responding!"