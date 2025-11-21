// WikiRace Game Mode - Link Management
// Legal implementation that respects Wikipedia's CC BY-SA license

class WikiRaceMode {
  constructor() {
    this.isActive = false;
    this.startPage = null;
    this.targetPage = null;
  }

  /**
   * Activate WikiRace mode
   */
  activate(startPage, targetPage) {
    this.isActive = true;
    this.startPage = startPage;
    this.targetPage = targetPage;

    // Add game mode class to body
    document.body.classList.add('wikirace-active');

    // Add banner
    this.addBanner();

    // Intercept link clicks
    this.setupLinkInterception();

    console.log('WikiRace mode activated');
  }

  /**
   * Deactivate WikiRace mode
   */
  deactivate() {
    this.isActive = false;
    document.body.classList.remove('wikirace-active');

    // Remove banner
    const banner = document.querySelector('.wikirace-banner');
    if (banner) banner.remove();

    // Remove event listeners
    document.removeEventListener('click', this.handleClick, true);

    console.log('WikiRace mode deactivated');
  }

  /**
   * Add game mode banner
   */
  addBanner() {
    const banner = document.createElement('div');
    banner.className = 'wikirace-banner';
    banner.innerHTML = `
      <div class="wikirace-banner-content">
        <span>🏁 <strong>WikiRace Mode Active</strong> - Get from <em>${this.startPage}</em> to <em>${this.targetPage}</em></span>
        <button class="wikirace-exit-btn" id="wikirace-exit-btn">Exit Game</button>
      </div>
    `;

    document.body.prepend(banner);

    // Exit button handler
    document.getElementById('wikirace-exit-btn').addEventListener('click', () => {
      this.deactivate();
    });
  }

  /**
   * Setup link interception
   */
  setupLinkInterception() {
    this.handleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.handleClick, true);
  }

  /**
   * Handle link clicks during game
   */
  handleClick(e) {
    if (!this.isActive) return;

    const link = e.target.closest('a');
    if (!link) return;

    // Check if link is in footer
    const inFooter = link.closest('#footer, .mw-footer, footer');
    if (inFooter) {
      e.preventDefault();
      e.stopPropagation();
      this.showWarning(
        '⚠️',
        'Footer Links Disabled',
        'Footer links are blocked during WikiRace. Exit game mode to access Wikipedia footer links.'
      );
      return false;
    }

    // Check if external link (not wikipedia.org)
    const href = link.getAttribute('href') || '';
    const isExternal = href.startsWith('http') && !href.includes('wikipedia.org');

    if (isExternal) {
      e.preventDefault();
      e.stopPropagation();
      this.showWarning(
        '🚫',
        'External Link Blocked',
        'External links are disabled during the race. Stay on Wikipedia to reach your target!'
      );
      return false;
    }

    // Check if special page (File:, Category:, Help:, etc.)
    if (href.includes(':') && !href.includes('wikipedia.org/wiki/')) {
      const namespace = href.split(':')[0].split('/').pop();
      const blockedNamespaces = ['File', 'Category', 'Help', 'Wikipedia', 'Talk', 'Special', 'Portal'];

      if (blockedNamespaces.some(ns => namespace.includes(ns))) {
        e.preventDefault();
        e.stopPropagation();
        this.showWarning(
          '📁',
          'Special Page Blocked',
          `${namespace} pages don't count in WikiRace. Stay on article pages!`
        );
        return false;
      }
    }

    // Valid Wikipedia article link - allow it
    if (href.startsWith('/wiki/') && !href.includes(':')) {
      // Track click for game
      this.trackClick(link);
    }
  }

  /**
   * Show warning overlay
   */
  showWarning(icon, title, message) {
    // Remove existing warning
    const existing = document.querySelector('.wikirace-warning-overlay, .wikirace-warning-backdrop');
    if (existing) existing.remove();

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'wikirace-warning-backdrop';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'wikirace-warning-overlay';
    overlay.innerHTML = `
      <div class="icon">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      <button id="wikirace-warning-close">Got It</button>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(overlay);

    // Close handlers
    const closeWarning = () => {
      overlay.remove();
      backdrop.remove();
    };

    document.getElementById('wikirace-warning-close').addEventListener('click', closeWarning);
    backdrop.addEventListener('click', closeWarning);

    // Auto-close after 3 seconds
    setTimeout(closeWarning, 3000);
  }

  /**
   * Track valid article click
   */
  trackClick(link) {
    const articleName = link.getAttribute('href').replace('/wiki/', '');
    console.log('WikiRace click:', articleName);

    // Check if reached target
    if (articleName === this.targetPage) {
      this.showVictory();
    }

    // Send to backend for tracking
    // chrome.runtime.sendMessage({
    //   type: 'WIKIRACE_CLICK',
    //   article: articleName
    // });
  }

  /**
   * Show victory screen
   */
  showVictory() {
    this.showWarning(
      '🎉',
      'You Won!',
      `Congratulations! You reached ${this.targetPage}!`
    );

    setTimeout(() => {
      this.deactivate();
    }, 3000);
  }
}

// Export singleton instance
const wikiRaceMode = new WikiRaceMode();

// Example usage:
// wikiRaceMode.activate('Quantum_mechanics', 'Albert_Einstein');

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_WIKIRACE') {
    wikiRaceMode.activate(message.startPage, message.targetPage);
    sendResponse({ success: true });
  }

  if (message.type === 'STOP_WIKIRACE') {
    wikiRaceMode.deactivate();
    sendResponse({ success: true });
  }
});
