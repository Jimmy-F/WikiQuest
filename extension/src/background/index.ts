// WikiQuest Background Service Worker
import { API_URL } from '../config';

console.log('🎮 WikiQuest background service worker loaded');

// Check for due reviews periodically
chrome.alarms.create('checkReviews', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkReviews') {
    await checkDueReviews();
  }
});

async function checkDueReviews() {
  try {
    const result = await chrome.storage.sync.get(['wq_userId']);
    if (!result.wq_userId) return;

    const response = await fetch(`${API_URL}/reviews/due?userId=${result.wq_userId}`);
    const data = await response.json();

    if (data.reviews && data.reviews.length > 0) {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'WikiQuest - Time to Review!',
        message: `You have ${data.reviews.length} articles ready for review. Keep your knowledge fresh!`,
        priority: 1
      });
    }
  } catch (error) {
    console.error('Error checking reviews:', error);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.action.openPopup();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openDashboard') {
    // Open the dashboard in a new tab
    chrome.tabs.create({ url: 'http://localhost:3001' });
    return;
  }

  if (message.type === 'QUIZ_COMPLETED') {
    // Badge notification
    chrome.action.setBadgeText({ text: '+XP' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }

  if (message.type === 'ACHIEVEMENT_UNLOCKED') {
    // Show achievement notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🏆 Achievement Unlocked!',
      message: message.achievementName,
      priority: 2
    });
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page
    chrome.tabs.create({
      url: 'https://en.wikipedia.org/wiki/Main_Page'
    });

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Welcome to WikiQuest!',
      message: 'Turn Wikipedia into an RPG. Visit any Wikipedia article to start earning XP!',
      priority: 2
    });
  }
});
