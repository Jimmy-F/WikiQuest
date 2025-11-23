# Lex the Turtle - WikiHero Mascot Implementation Guide

## 🐢 Meet Lex!

**Full Name:** Lex the Turtle
**From:** "Lexicon" (encyclopedia/dictionary of knowledge)
**Personality:** Wise, patient, encouraging, heroic

---

## 📁 Assets Location

### Current Assets:
- **Static Image:** `/frontend/public/assets/mascot/lex-neutral.png` (641KB)
- **Wave Animation:** `/frontend/public/assets/mascot/lex-wave.mp4` (1.8MB)

### Recommended Asset Structure:
```
frontend/public/assets/mascot/
├── lex-neutral.png          # Default standing pose
├── lex-wave.mp4             # Animated wave (video)
├── lex-victory.png          # Trophy celebration (generate next)
├── lex-racing.png           # Racing/determined pose (generate next)
├── lex-tired.png            # Sleeping/exhausted (generate next)
├── lex-thinking.png         # Pondering/loading (generate next)
├── lex-reading.png          # Reading book (generate next)
├── lex-celebrating.png      # Achievement unlocked (generate next)
└── expressions/
    ├── happy.png
    ├── surprised.png
    ├── confused.png
    └── excited.png
```

---

## 🎨 How to Use Lex in Your App

### 1. Basic Component Usage

```tsx
import { LexMascot } from '@/components/LexMascot';

// Simple usage
<LexMascot state="wave" size="medium" />

// With message
<LexMascot
  state="victory"
  size="large"
  message="You did it! Gold medal earned!"
/>
```

### 2. Available States

| State | Use Case | Asset Type | Status |
|-------|----------|-----------|--------|
| `neutral` | Default, idle | PNG | ✅ Ready |
| `wave` | Welcome, greeting | MP4 | ✅ Ready |
| `victory` | Win race, achievement | PNG | 🔴 Need to generate |
| `racing` | WikiRace start | PNG | 🔴 Need to generate |
| `tired` | Hearts empty | PNG | 🔴 Need to generate |
| `thinking` | Loading, processing | PNG | 🔴 Need to generate |
| `reading` | Quiz/article | PNG | 🔴 Need to generate |
| `celebrating` | Level up, streak | PNG | 🔴 Need to generate |

### 3. Size Options

```tsx
size="small"   // 64x64px  - Extension popup, notifications
size="medium"  // 128x128px - Standard UI elements
size="large"   // 192x192px - Hero sections, welcome screens
```

---

## 🎯 Where to Use Lex

### Frontend Dashboard:
- **Dashboard Welcome:** `state="wave"` + greeting message
- **WikiRace Start:** `state="racing"` + race instructions
- **Victory Screen:** `state="victory"` + celebration
- **Achievement Popup:** `state="celebrating"` + badge earned
- **Hearts Empty:** `state="tired"` + refill prompt
- **Loading States:** `state="thinking"` + "Processing..."

### Chrome Extension:
- **Popup Header:** `state="wave"` small size
- **Article Complete:** `state="victory"` + XP earned
- **Quiz Failed:** `state="tired"` + encouragement

### Marketing Website:
- **Hero Section:** Large animated Lex with value prop
- **Features Section:** Different states for each feature
- **Testimonials:** Lex endorsing user quotes

---

## 📝 Implementation Examples

### Example 1: Dashboard Welcome
```tsx
import { LexMascot } from '@/components/LexMascot';

export function Dashboard({ user }) {
  return (
    <div className="p-8">
      <LexMascot
        state="wave"
        size="large"
        message={`Welcome back, ${user.name}! You're on a ${user.streak} day streak!`}
      />

      <div className="mt-6">
        {/* Dashboard content */}
      </div>
    </div>
  );
}
```

### Example 2: WikiRace Victory
```tsx
import { LexMascot } from '@/components/LexMascot';

export function RaceVictory({ score, medal }) {
  return (
    <div className="text-center p-8">
      <LexMascot
        state="victory"
        size="large"
        message={`${medal} Medal! Score: ${score}/100`}
      />

      <button className="mt-6 btn-primary">
        Race Again
      </button>
    </div>
  );
}
```

### Example 3: Extension Popup
```tsx
import { LexMascot } from '@/components/LexMascot';

export function ExtensionPopup({ xp, level, streak }) {
  return (
    <div className="w-80 p-4">
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
        <LexMascot state="wave" size="small" />

        <div className="text-white">
          <div className="text-lg font-bold">Level {level}</div>
          <div className="text-sm">{xp} XP • {streak} 🔥</div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎬 Video Asset Optimization

### Current Status:
- `lex-wave.mp4`: 1.8MB (good for web, could optimize further)

### Optimization Tips:

**1. Reduce file size (if needed):**
```bash
# Using ffmpeg to compress
ffmpeg -i lex-wave.mp4 -vcodec libx264 -crf 28 lex-wave-optimized.mp4

# Convert to WebM (better compression)
ffmpeg -i lex-wave.mp4 -c:v libvpx-vp9 -b:v 500k lex-wave.webm
```

**2. Multiple formats for browser compatibility:**
```tsx
<video autoPlay loop muted playsInline>
  <source src="/assets/mascot/lex-wave.webm" type="video/webm" />
  <source src="/assets/mascot/lex-wave.mp4" type="video/mp4" />
  Your browser doesn't support video.
</video>
```

**3. Lazy loading for performance:**
```tsx
<video
  src="/assets/mascot/lex-wave.mp4"
  loading="lazy"
  preload="none"
  autoPlay
  loop
  muted
  playsInline
/>
```

---

## 🎨 Generating More Assets

### Prompts for Missing States:

**Victory/Celebration Pose:**
```
Lex the turtle mascot standing on winner podium holding golden trophy
high above head, both arms raised triumphantly, huge excited smile,
cyan blue shell with geometric patterns gleaming, red superhero cape
flowing majestically, confetti and sparkles falling around, one foot
on first place podium, round glasses slightly tilted from excitement,
Pixar animation style, celebratory lighting, white background
--v 6 --ar 1:1 --seed YOUR_SEED
```

**Racing/Determined Pose:**
```
Lex the turtle mascot in determined racing stance, leaning forward
dynamically, focused determined expression, racing goggles over glasses,
cyan blue shell with speed motion lines, red cape flowing dramatically
behind, one arm forward reaching, athletic ready stance,
Pixar style, dynamic action pose, vibrant colors, white background
--v 6 --ar 1:1 --seed YOUR_SEED
```

**Tired/Sleeping Pose:**
```
Lex the turtle mascot looking exhausted, partially retreated into
cyan blue shell, droopy tired eyes behind glasses, mid-yawn expression,
red cape drooping down, sleepy defeated posture, floating ZZZ symbols
above head, Pixar animation style, sympathetic but cute, soft muted colors,
white background --v 6 --ar 1:1 --seed YOUR_SEED
```

**Thinking/Loading Pose:**
```
Lex the turtle mascot in thoughtful contemplative pose, one finger on chin,
looking upward curiously, glowing lightbulb floating above head,
cyan blue shell with geometric patterns, red cape, round glasses,
curious wondering expression, Pixar animation style, simple clean composition,
white background --v 6 --ar 1:1 --seed YOUR_SEED
```

**Reading/Learning Pose:**
```
Lex the turtle sitting peacefully cross-legged, holding open book in
both hands, reading glasses on nose, content peaceful smile, absorbed
in learning, cyan blue shell visible, red cape draped behind,
cozy atmosphere, soft warm lighting, Pixar style, educational theme,
white background --v 6 --ar 1:1 --seed YOUR_SEED
```

### Important: Use the SAME seed number from your original generation to maintain consistency!

---

## 🚀 Performance Best Practices

### 1. Image Optimization
```bash
# Compress PNG (use TinyPNG or similar)
# Target: < 200KB per image

# Create @2x and @3x versions for retina displays
cp lex-neutral.png lex-neutral@2x.png
cp lex-neutral.png lex-neutral@3x.png
```

### 2. Lazy Loading
```tsx
<img
  src="/assets/mascot/lex-neutral.png"
  alt="Lex the turtle"
  loading="lazy"
  width="128"
  height="128"
/>
```

### 3. Preload Critical Assets
```html
<!-- In index.html -->
<link rel="preload" as="image" href="/assets/mascot/lex-neutral.png" />
```

### 4. Use CDN (Production)
```tsx
const MASCOT_CDN = process.env.NODE_ENV === 'production'
  ? 'https://cdn.wikihero.com/mascot'
  : '/assets/mascot';

<img src={`${MASCOT_CDN}/lex-neutral.png`} />
```

---

## 🎨 Styling & Animations

### Available CSS Classes:
- `.animate-fade-in` - Gentle fade in
- `.animate-bounce-in` - Bouncy entrance
- `.animate-float` - Floating hover effect
- `.animate-pulse-glow` - Glowing pulse

### Example Usage:
```tsx
<div className="lex-mascot-container state-victory">
  <img
    src="/assets/mascot/lex-victory.png"
    className="animate-bounce-in"
  />
</div>
```

---

## 📦 Asset Checklist

### Priority 1 (Generate These Next):
- [ ] Victory pose (WikiRace wins, achievements)
- [ ] Racing pose (WikiRace start screen)
- [ ] Tired pose (Hearts empty)
- [ ] Thinking pose (Loading states)

### Priority 2 (Nice to Have):
- [ ] Reading pose (Quiz mode)
- [ ] Celebrating pose (Level up, streaks)
- [ ] Teaching pose (Onboarding tutorials)
- [ ] Superhero pose (Hero mode activation)

### Priority 3 (Polish):
- [ ] Expression variations (8 expressions)
- [ ] Seasonal variants (holiday themes)
- [ ] Animated transitions (victory dance, etc.)
- [ ] Interactive poses (click reactions)

---

## 🎯 Next Steps

1. **Generate missing poses** using Midjourney prompts above
2. **Optimize all assets** (compress to <200KB each)
3. **Implement in Dashboard** (welcome screen first)
4. **Add to WikiRace flow** (start, racing, victory screens)
5. **Integrate in Extension** (popup header)
6. **Test on multiple devices** (mobile, tablet, desktop)
7. **Add analytics** (track which states users see most)

---

## 💡 Creative Usage Ideas

### 1. Animated Tutorials
Use Lex with speech bubbles to explain features:
```tsx
<LexMascot state="wave" message="Click any Wikipedia link to start racing!" />
```

### 2. Error States
Friendly error handling:
```tsx
<LexMascot state="thinking" message="Hmm, couldn't find that article. Try another?" />
```

### 3. Empty States
Encourage action:
```tsx
<LexMascot state="neutral" message="No races yet! Want to start your first WikiRace?" />
```

### 4. Loading States
Make waiting fun:
```tsx
<LexMascot state="thinking" message="Finding the perfect path..." />
```

### 5. Social Sharing
Generate images with Lex for sharing:
```tsx
// Victory card with Lex for Twitter/Facebook
<VictoryCard>
  <LexMascot state="victory" />
  <Stats score={score} />
</VictoryCard>
```

---

## 🎨 Brand Consistency

### Lex's Color Palette:
```css
--lex-shell-blue: #4FC3F7;    /* Cyan blue shell */
--lex-shell-pattern: #FFD700;  /* Golden patterns */
--lex-body-green: #81C784;     /* Soft green skin */
--lex-belly-cream: #FFF9C4;    /* Cream underbelly */
--lex-cape-red: #FF5252;       /* Superhero red cape */
--lex-glasses-brown: #6D4C41;  /* Warm brown frames */
```

### Design Guidelines:
- Always show Lex's glasses (wisdom/learning)
- Always show Wikipedia "W" badge (brand identity)
- Cape flows based on action (subtle for calm, dramatic for action)
- Keep friendly, approachable expression
- Maintain consistent proportions across all poses

---

## 📊 Analytics Events

Track Lex interactions:
```tsx
// Track which mascot states users see
analytics.track('mascot_shown', {
  state: 'victory',
  context: 'race_complete',
  timestamp: Date.now()
});

// Track engagement with mascot messages
analytics.track('mascot_message_viewed', {
  message: 'Welcome back!',
  duration: 5000 // ms
});
```

---

## ✅ SUMMARY

**Assets Created:**
✅ Lex neutral pose (PNG, 641KB)
✅ Lex wave animation (MP4, 1.8MB)
✅ LexMascot React component
✅ CSS animations and styles
✅ 10+ usage examples

**Ready to Use:**
✅ Dashboard welcome screen
✅ Extension popup
✅ Victory/achievement screens
✅ Loading states
✅ Empty states

**Next Steps:**
1. Generate 4 priority poses (victory, racing, tired, thinking)
2. Implement in Dashboard component
3. Add to WikiRace flow
4. Test across devices

**Name Recommendation:**
🏆 **"Lex"** (from Lexicon) - Short, memorable, Wiki-linked!

---

Built with ❤️ for WikiHero
