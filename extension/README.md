# WikiQuest Chrome Extension

## Build & Install

### 1. Install dependencies
```bash
npm install
```

### 2. Build the extension
```bash
npm run build
```

This will create a `dist/` folder with the compiled extension.

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

### 4. Test it out!

1. Make sure the backend is running: `docker-compose up`
2. Visit any Wikipedia article: https://en.wikipedia.org/wiki/Quantum_mechanics
3. Start reading!
4. After 2-3 paragraphs, a quiz will pop up
5. Answer questions to earn XP
6. Click the extension icon to see your dashboard

## Development

### Watch mode (auto-rebuild)
```bash
npm run dev
```

### Manual build
```bash
npm run build
```

## Features

### Content Script
- Detects Wikipedia articles automatically
- Tracks reading progress with Intersection Observer
- Shows quizzes every N paragraphs
- Beautiful quiz overlay with animations
- Real-time XP notifications

### Popup Dashboard
- XP and level display with progress bar
- Current streak counter
- Weekly stats (articles, quizzes, XP)
- Achievements view
- Settings panel

### Background Worker
- Checks for due reviews every hour
- Shows notifications for reviews
- Handles achievement unlocks
- Badge notifications for XP gains

## File Structure

```
extension/
├── src/
│   ├── content/
│   │   ├── index.ts       # Main content script
│   │   └── content.css    # Quiz overlay styles
│   ├── popup/
│   │   ├── index.tsx      # React entry point
│   │   ├── App.tsx        # Main dashboard component
│   │   ├── popup.html     # Popup HTML
│   │   └── popup.css      # Dashboard styles
│   └── background/
│       └── index.ts       # Service worker
├── icons/                 # Extension icons
├── manifest.json          # Extension manifest
├── webpack.config.js      # Build configuration
└── package.json

```

## TODO: Add Icons

You need to add icon files to `icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

For now, the extension will work without icons but Chrome will show warnings.

## API Endpoints Used

- `POST /api/articles/start` - Start tracking article
- `PATCH /api/articles/:id/progress` - Update reading progress
- `POST /api/articles/:id/complete` - Complete article
- `POST /api/quizzes/generate` - Generate quiz with Claude
- `POST /api/quizzes/:id/attempt` - Submit quiz answers
- `GET /api/analytics/dashboard` - Get user stats
- `GET /api/achievements/user/:userId` - Get achievements
- `GET /api/reviews/due` - Get due reviews

## Troubleshooting

### Extension not loading
- Check that you built the extension first (`npm run build`)
- Make sure you selected the `dist/` folder, not the root folder

### API errors
- Make sure the backend is running on port 3000
- Check docker-compose logs: `docker-compose logs -f backend`

### Quizzes not showing
- Check browser console for errors
- Verify you're on a Wikipedia article page
- Check that the backend is generating quizzes correctly

### Popup not loading
- Check for React/TypeScript errors in build output
- Clear extension and reload

## Production Build

For production (smaller bundle size):
```bash
npm run build
```

This uses webpack production mode with optimizations.
