const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Log network errors
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url(), request.failure().errorText);
  });

  try {
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Check if we're on login page or dashboard
    const url = page.url();
    console.log('Current URL:', url);

    // Take a screenshot
    await page.screenshot({ path: 'dashboard-state.png', fullPage: true });
    console.log('Screenshot saved as dashboard-state.png');

    // Check for login elements
    const hasLogin = await page.locator('text=/login/i').count() > 0;
    if (hasLogin) {
      console.log('Page shows login screen');
    }

    // Check for dashboard elements
    const hasOverview = await page.locator('text=/overview/i').count() > 0;
    const hasAdventure = await page.locator('text=/adventure/i').count() > 0;
    const hasChallenges = await page.locator('text=/challenge/i').count() > 0;

    console.log('Dashboard elements found:');
    console.log('- Overview tab:', hasOverview);
    console.log('- Adventure tab:', hasAdventure);
    console.log('- Challenges:', hasChallenges);

    // Try to get text content of main areas
    const bodyText = await page.locator('body').innerText();
    console.log('\n=== Page Content Preview ===');
    console.log(bodyText.substring(0, 500));

    // Check for specific data sections if on dashboard
    if (hasOverview) {
      // Click on Daily Challenges tab if it exists
      const challengeButton = page.locator('button:has-text("Daily Challenges")');
      if (await challengeButton.count() > 0) {
        await challengeButton.click();
        await page.waitForTimeout(1000);

        // Check for challenge content
        const challengeContent = await page.locator('.challenges-tab').innerText().catch(() => 'No challenges content');
        console.log('\n=== Daily Challenges Content ===');
        console.log(challengeContent.substring(0, 300));
      }

      // Click on Adventure Mode
      const adventureButton = page.locator('button:has-text("Adventure Mode")');
      if (await adventureButton.count() > 0) {
        await adventureButton.click();
        await page.waitForTimeout(1000);

        const adventureContent = await page.locator('.adventure-tab').innerText().catch(() => 'No adventure content');
        console.log('\n=== Adventure Mode Content ===');
        console.log(adventureContent.substring(0, 300));
      }
    }

    // Check network requests to API
    console.log('\n=== Checking API calls ===');
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });

    // Reload to capture API calls
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('API calls made:');
    responses.forEach(r => {
      console.log(`- ${r.url}: ${r.status} (${r.ok ? 'OK' : 'FAILED'})`);
    });

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();