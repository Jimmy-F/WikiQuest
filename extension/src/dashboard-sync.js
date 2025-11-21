// This content script runs on the dashboard to sync authentication with the extension
console.log('WikiQuest extension: Dashboard sync active');

// Listen for authentication messages from the web app
window.addEventListener('message', async (event) => {
  // Only accept messages from our dashboard
  if (event.origin !== 'http://localhost:3001') return;

  if (event.data.type === 'WIKIQUEST_AUTH') {
    const { action, userId } = event.data;

    if (action === 'LOGIN' && userId) {
      // Save user ID to extension storage
      await chrome.storage.sync.set({ wq_userId: userId });
      console.log('WikiQuest: User authenticated', userId);

      // Send confirmation back to the web app
      window.postMessage({ type: 'WIKIQUEST_AUTH_CONFIRMED', success: true }, '*');
    } else if (action === 'LOGOUT') {
      // Clear user ID from extension storage
      await chrome.storage.sync.remove('wq_userId');
      console.log('WikiQuest: User logged out');

      // Send confirmation back to the web app
      window.postMessage({ type: 'WIKIQUEST_AUTH_CONFIRMED', success: true }, '*');
    }
  }
});

// Check if user is already logged in when the page loads
chrome.storage.sync.get(['wq_userId'], (result) => {
  if (result.wq_userId) {
    // Notify the web app that a user is already authenticated
    window.postMessage({
      type: 'WIKIQUEST_EXISTING_AUTH',
      userId: result.wq_userId
    }, '*');
  }
});