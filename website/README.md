# WikiQuest Marketing Website

Apple-inspired landing page and marketing site for WikiQuest.

## 🎨 Design System

The website follows Apple's design principles:
- **Clean & Minimal**: Lots of whitespace, clear hierarchy
- **Typography**: SF Pro Display font (system font), bold headlines
- **Colors**: Soft gradients, primary blue (#4fc3f7), subtle shadows
- **Animations**: Smooth transitions, floating elements, fade-in effects
- **Responsive**: Mobile-first design, fluid typography

## 📁 Structure

```
website/
├── src/
│   ├── index.html           # Landing page
│   ├── pricing.html         # Pricing page
│   ├── about.html           # About page (create)
│   ├── privacy.html         # Privacy policy (create)
│   ├── terms.html           # Terms of service (create)
│   ├── attributions.html    # Wikipedia attribution (create)
│   ├── styles/
│   │   ├── main.css         # Global styles & design system
│   │   ├── landing.css      # Landing page specific styles
│   │   └── pricing-page.css # Pricing page specific styles
│   ├── scripts/
│   │   ├── main.js          # Global JavaScript
│   │   └── pricing.js       # Pricing page interactivity
│   └── assets/
│       └── favicon.svg      # (create icon)
└── README.md
```

## 🚀 Pages Included

### ✅ Completed Pages

1. **index.html** - Landing Page
   - Hero section with animated mockup
   - Features grid (6 cards)
   - How It Works (3 steps)
   - Pricing teaser
   - CTA section
   - Footer

2. **pricing.html** - Pricing Page
   - Monthly/Annual billing toggle
   - 3 pricing tiers (Free, Pro, Student)
   - Full feature comparison table
   - FAQ section
   - CTA

### 📝 Pages to Create (Templates Provided Below)

3. **about.html** - About page with team, mission, story
4. **privacy.html** - Privacy policy
5. **terms.html** - Terms of service
6. **attributions.html** - Wikipedia CC BY-SA attribution

## 🎯 Key Features

### Landing Page
- ✅ Responsive hero with floating cards
- ✅ Animated quiz mockup
- ✅ 6 feature cards with icons
- ✅ 3-step "How It Works" section
- ✅ Pricing preview cards
- ✅ Sticky navigation with blur effect
- ✅ Smooth scroll animations
- ✅ Mobile-responsive

### Pricing Page
- ✅ Monthly/Annual toggle
- ✅ 3 pricing tiers with feature lists
- ✅ Full comparison table
- ✅ FAQ accordion
- ✅ Highlight "Most Popular" plan
- ✅ Responsive grid layout

### Design System
- ✅ CSS variables for easy theming
- ✅ Apple-inspired color palette
- ✅ Responsive typography (clamp)
- ✅ Consistent spacing system
- ✅ Reusable button styles
- ✅ Card components
- ✅ Shadow system

## 🛠 To Deploy

### Option 1: Static Hosting (Netlify/Vercel)

1. **Connect Git Repository:**
   ```bash
   # Push to GitHub
   git add website/
   git commit -m "Add marketing website"
   git push
   ```

2. **Deploy on Netlify:**
   - Go to netlify.com
   - "New site from Git"
   - Select repo
   - Build settings:
     - Base directory: `website/src`
     - Publish directory: `website/src`
   - Deploy!

3. **Custom Domain:**
   - Add `wikiquest.io` in Netlify settings
   - Update DNS records

### Option 2: GitHub Pages

1. **Create gh-pages branch:**
   ```bash
   cd website/src
   git checkout -b gh-pages
   git add .
   git commit -m "Deploy website"
   git push origin gh-pages
   ```

2. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: gh-pages branch
   - Save

3. **Access at:** `https://yourusername.github.io/wikiquest`

### Option 3: Self-Hosted (Nginx)

1. **Copy files to server:**
   ```bash
   scp -r website/src/* user@server:/var/www/wikiquest
   ```

2. **Nginx config:**
   ```nginx
   server {
       listen 80;
       server_name wikiquest.io;
       root /var/www/wikiquest;
       index index.html;

       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

3. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

## 📋 Checklist Before Launch

- [ ] Create favicon.svg (icon for browser tab)
- [ ] Replace all `#` href links with actual URLs
- [ ] Add Google Analytics (optional)
- [ ] Test mobile responsiveness
- [ ] Test all links
- [ ] Add meta tags for SEO
- [ ] Create Open Graph images for social media
- [ ] Set up contact form (if needed)
- [ ] Add actual download links for Chrome extension
- [ ] Create about.html, privacy.html, terms.html
- [ ] Add team photos to about page
- [ ] Test in multiple browsers
- [ ] Run Lighthouse audit
- [ ] Compress images
- [ ] Minify CSS/JS for production

## 🎨 Design Tokens

```css
/* Colors */
--primary: #4fc3f7
--secondary: #7e57c2
--success: #81c784
--warning: #ffb74d

/* Spacing */
--space-xs: 4px
--space-sm: 8px
--space: 12px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
--space-4xl: 96px

/* Border Radius */
--radius-sm: 8px
--radius: 12px
--radius-md: 16px
--radius-lg: 20px
--radius-xl: 24px

/* Shadows */
--shadow-sm: soft small shadow
--shadow: medium shadow
--shadow-md: prominent shadow
--shadow-lg: large shadow
--shadow-xl: extra large shadow
```

## 🔧 Customization

### Change Colors

Edit `styles/main.css`:
```css
:root {
  --primary: #your-color;
  --secondary: #your-color;
}
```

### Add New Page

1. Copy index.html
2. Update content
3. Keep nav and footer
4. Link from main nav

### Modify Features

Edit `index.html` → `.features-grid` section

### Update Pricing

Edit `pricing.html` → pricing tiers and comparison table

## 📱 Mobile Optimization

- Responsive breakpoints: 768px, 1024px
- Touch-friendly buttons (min 44px)
- Optimized images
- Fast loading (<3s)
- Mobile navigation hamburger

## 🚀 Performance Tips

1. **Optimize Images:**
   ```bash
   # Use WebP format
   # Compress with TinyPNG
   # Lazy load images
   ```

2. **Minify Assets:**
   ```bash
   # Minify CSS
   npx cssnano styles/main.css -o styles/main.min.css

   # Minify JS
   npx terser scripts/main.js -o scripts/main.min.js
   ```

3. **Add CDN:**
   - Use Cloudflare for static assets
   - Enable caching headers

## 📊 Analytics (Optional)

Add Google Analytics:
```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## 🎯 SEO Optimization

Already included:
- ✅ Semantic HTML
- ✅ Meta descriptions
- ✅ Alt text for images (add when you add images)
- ✅ Proper heading hierarchy
- ✅ Mobile-friendly
- ✅ Fast loading

To add:
- [ ] robots.txt
- [ ] sitemap.xml
- [ ] Open Graph tags
- [ ] Twitter Cards
- [ ] Schema.org markup

## 📝 Content Checklist

- [x] Landing page hero
- [x] Feature descriptions
- [x] Pricing tiers
- [x] FAQ answers
- [ ] About page team bios
- [ ] Privacy policy content
- [ ] Terms of service content
- [ ] Contact information
- [ ] Social media links

## 🤝 Contributing

1. Edit HTML/CSS/JS files
2. Test locally (just open HTML files)
3. Commit changes
4. Deploy

## 📞 Support

Questions? Email: support@wikiquest.io

---

Built with ❤️ using pure HTML, CSS, and vanilla JavaScript.
No frameworks, no build process, just clean code.
