// Debug script for WikiQuest
const API_URL = 'http://localhost:3000/api';

async function showStorage() {
  try {
    const result = await chrome.storage.local.get(null);
    document.getElementById('info').textContent = 'Current Storage:\n' + JSON.stringify(result, null, 2);
  } catch (error) {
    document.getElementById('info').textContent = 'Error: ' + error.message;
  }
}

async function clearAndCreate() {
  try {
    // Clear storage
    await chrome.storage.local.clear();
    document.getElementById('info').innerHTML = '<div class="success">✅ Storage cleared!</div>';

    // Create new UUID user
    const newUserId = crypto.randomUUID();
    document.getElementById('info').innerHTML += `<div class="success">Creating new user: ${newUserId}</div>`;

    // Register with backend
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newUserId })
    });

    const data = await response.json();

    if (response.ok) {
      // Save to storage
      await chrome.storage.local.set({ userId: newUserId });
      document.getElementById('info').innerHTML += '<div class="success">✅ User registered and saved!</div>';
      document.getElementById('info').innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    } else {
      document.getElementById('info').innerHTML += '<div style="background: #fee; color: #c00; padding: 12px; border-radius: 8px;">❌ Registration failed: ' + JSON.stringify(data) + '</div>';
    }
  } catch (error) {
    document.getElementById('info').innerHTML += '<div style="background: #fee; color: #c00; padding: 12px; border-radius: 8px;">❌ Error: ' + error.message + '</div>';
  }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('showStorageBtn').addEventListener('click', showStorage);
  document.getElementById('clearCreateBtn').addEventListener('click', clearAndCreate);

  // Auto-show storage on load
  showStorage();
});
