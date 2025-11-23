// WikiQuest Content Script - Runs on Wikipedia pages
import { API_URL } from '../config';

console.log('🎮 WikiQuest activated!');

interface ArticleData {
  url: string;
  title: string;
  categories: string[];
  totalParagraphs: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

class WikiQuestContent {
  private userId: string | null = null;
  private articleId: string | null = null;
  private articleData: ArticleData | null = null;
  private sectionsRead: string[] = []; // Track sections we've read
  private currentSection: string = '';
  private currentSectionContent: string[] = []; // Paragraphs in current section
  private startTime: number = Date.now();
  private lastQuizTime: number = 0;
  private quizCooldown: number = 30000; // 30 seconds between quizzes
  private quizActive: boolean = false;
  private isStructuredMode: boolean = false; // Track if in Adventure/Explorer mode

  constructor() {
    this.init();
  }

  async init() {
    // Get user ID from storage (using sync storage with wq_ prefix)
    const result = await chrome.storage.sync.get(['wq_userId', 'wq_structuredMode']);
    this.userId = result.wq_userId;

    // Check if we're in structured mode (Adventure/Explorer)
    this.isStructuredMode = result.wq_structuredMode || false;

    // Also check URL parameters for structured mode flag
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('wq_mode') === 'structured') {
      this.isStructuredMode = true;
    }

    if (!this.userId) {
      console.log('No user logged in - please login at http://localhost:3001');
      // Show a subtle notification
      this.showLoginPrompt();
      return;
    }

    console.log('User authenticated:', this.userId);
    console.log('Structured mode:', this.isStructuredMode);

    // Detect if we're on a Wikipedia article
    if (this.isWikipediaArticle()) {
      this.startTracking();
    }
  }

  isWikipediaArticle(): boolean {
    const url = window.location.href;
    return url.includes('wikipedia.org/wiki/') && !url.includes('Wikipedia:');
  }

  async startTracking() {
    // Extract article data
    this.articleData = this.extractArticleData();
    console.log('Tracking article:', this.articleData);

    // Start tracking on backend
    try {
      const response = await fetch(`${API_URL}/articles/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          wikipediaUrl: this.articleData.url,
          wikipediaTitle: this.articleData.title,
          wikipediaCategories: this.articleData.categories,
          totalParagraphs: this.articleData.totalParagraphs
        })
      });

      const data = await response.json();
      this.articleId = data.article.id;

      // Notify quest system that article is being read
      await this.checkQuestProgress(this.articleData.title);

      // Set up scroll tracking
      this.setupScrollTracking();

      // Show welcome notification
      this.showNotification('🎮 WikiQuest Active!', 'Read and answer quizzes to earn XP');
    } catch (error) {
      console.error('Error starting article tracking:', error);
    }
  }

  async checkQuestProgress(articleTitle: string) {
    try {
      // Notify backend that this article is being read for quest progress
      const response = await fetch(`${API_URL}/quests/article-completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          articleTitle: articleTitle
        })
      });

      const data = await response.json();
      if (data.updates && data.updates.length > 0) {
        data.updates.forEach((update: any) => {
          if (update.stage_completed) {
            this.showNotification('🎉 Stage Complete!', `You've completed a quest stage! +${update.xp_earned} XP`);
          } else if (update.quest_completed) {
            this.showNotification('🏆 Quest Complete!', 'Congratulations! You\'ve completed the entire quest!');
          } else if (update.article_completed) {
            this.showNotification('✅ Article Read', `Progress saved for quest: ${update.article_completed}`);
          }
        });
      }
    } catch (error) {
      console.error('Error checking quest progress:', error);
    }
  }

  extractArticleData(): ArticleData {
    const url = window.location.href;
    const title = document.querySelector('#firstHeading')?.textContent || '';

    // Extract and properly categorize article topics
    const categoryLinks = document.querySelectorAll('#mw-normal-catlinks ul li a');
    const rawCategories = Array.from(categoryLinks).map(link => link.textContent || '');

    // Map Wikipedia categories to proper topics
    const categories = this.categorizeArticle(rawCategories, title);

    // Count paragraphs in main content
    const content = document.querySelector('#mw-content-text .mw-parser-output');
    const paragraphs = content?.querySelectorAll('p') || [];
    const totalParagraphs = Array.from(paragraphs).filter(p => p.textContent && p.textContent.trim().length > 100).length;

    return { url, title, categories, totalParagraphs };
  }

  categorizeArticle(rawCategories: string[], title: string): string[] {
    const topics = new Set<string>();

    // Category mapping rules
    const categoryMappings: Record<string, string[]> = {
      'Science': ['physics', 'chemistry', 'biology', 'astronomy', 'geology', 'mathematics', 'science', 'scientific', 'atom', 'molecule', 'cell'],
      'History': ['history', 'historical', 'ancient', 'medieval', 'war', 'battle', 'empire', 'dynasty', 'civilization', 'revolution', 'century', 'monarchs', 'kings', 'queens', 'emperor'],
      'Geography': ['geography', 'countries', 'cities', 'continents', 'oceans', 'mountains', 'rivers', 'islands', 'capitals', 'regions'],
      'Technology': ['technology', 'computer', 'software', 'internet', 'programming', 'artificial intelligence', 'engineering', 'innovation'],
      'Politics': ['politics', 'government', 'democracy', 'political', 'presidents', 'ministers', 'elections', 'parliament', 'congress'],
      'Arts': ['art', 'music', 'literature', 'painting', 'sculpture', 'poetry', 'theater', 'cinema', 'artists', 'writers', 'composers'],
      'Philosophy': ['philosophy', 'philosophers', 'ethics', 'logic', 'metaphysics', 'existential', 'thought'],
      'Religion': ['religion', 'religious', 'christianity', 'islam', 'buddhism', 'hinduism', 'judaism', 'spiritual', 'theology'],
      'Sports': ['sports', 'athletes', 'olympics', 'football', 'basketball', 'tennis', 'championship', 'tournament'],
      'Medicine': ['medicine', 'medical', 'disease', 'health', 'anatomy', 'surgery', 'pharmaceutical', 'doctors', 'hospital'],
      'Economics': ['economics', 'economy', 'finance', 'business', 'trade', 'market', 'commerce', 'banking', 'investment'],
      'Military': ['military', 'army', 'navy', 'warfare', 'defense', 'weapons', 'generals', 'admirals'],
      'Nature': ['nature', 'animals', 'plants', 'ecology', 'environment', 'wildlife', 'species', 'conservation'],
      'Space': ['space', 'astronomy', 'planets', 'stars', 'galaxies', 'cosmos', 'nasa', 'spacecraft', 'astronauts'],
      'Biography': ['births', 'deaths', 'people', 'biography', 'living people', 'alumni']
    };

    // Check each raw category against our mappings
    rawCategories.forEach(category => {
      const lowerCategory = category.toLowerCase();

      for (const [topic, keywords] of Object.entries(categoryMappings)) {
        if (keywords.some(keyword => lowerCategory.includes(keyword))) {
          topics.add(topic);
        }
      }
    });

    // If no topics found, try to infer from title
    if (topics.size === 0) {
      const lowerTitle = title.toLowerCase();
      for (const [topic, keywords] of Object.entries(categoryMappings)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
          topics.add(topic);
        }
      }
    }

    // Default to General Knowledge if still no topics
    if (topics.size === 0) {
      topics.add('General Knowledge');
    }

    return Array.from(topics);
  }

  setupScrollTracking() {
    const contentDiv = document.querySelector('#mw-content-text .mw-parser-output');
    if (!contentDiv) return;

    // Track section headings (h2 elements in Wikipedia)
    const headings = Array.from(contentDiv.querySelectorAll('h2'));

    // Get all section titles including the lead section
    const sections: string[] = [];

    // The lead section (before first h2) - use article title or "Lead Section"
    const articleTitle = document.querySelector('#firstHeading')?.textContent || 'Article';
    const leadSectionName = `${articleTitle} - Overview`;
    sections.push(leadSectionName);

    // Add all other sections - try multiple selectors for compatibility
    headings.forEach(h => {
      // Try different ways to get the section title
      let title = h.querySelector('.mw-headline')?.textContent ||
                  h.querySelector('.mw-headline-text')?.textContent ||
                  h.textContent?.trim();

      // Clean up the title - remove edit links etc
      if (title) {
        title = title.replace(/\[edit\]/gi, '').trim();

        // Filter out non-content sections
        const skipSections = ['Contents', 'References', 'External links', 'See also', 'Notes', 'Further reading'];
        const shouldSkip = skipSections.some(skip => title.toLowerCase().includes(skip.toLowerCase()));

        if (!shouldSkip && title.length > 0) {
          sections.push(title);
        }
      }
    });

    console.log('Article sections found:', sections);
    console.log('Total h2 elements:', headings.length);

    // Use Intersection Observer to detect when we scroll to a new section
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const heading = entry.target as HTMLHeadingElement;

          // Try different ways to get the section title
          let sectionTitle = heading.querySelector('.mw-headline')?.textContent ||
                            heading.querySelector('.mw-headline-text')?.textContent ||
                            heading.textContent?.trim() ||
                            leadSectionName;

          // Clean up the title
          sectionTitle = sectionTitle.replace(/\[edit\]/gi, '').trim();

          // Check if this is a new section
          if (sectionTitle !== this.currentSection) {
            this.onSectionChange(sectionTitle);
          }
        }
      });
    }, { threshold: 0.5 });

    // Observe all section headings
    headings.forEach(h => observer.observe(h));

    // Start with the lead section (content before first h2)
    this.currentSection = leadSectionName;
    this.collectSectionContent(leadSectionName);

    // Also observe when we scroll back to the top (lead section)
    const firstParagraph = contentDiv.querySelector('p');
    if (firstParagraph) {
      const topObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            if (this.currentSection !== leadSectionName) {
              this.onSectionChange(leadSectionName);
            }
          }
        });
      }, { threshold: 0.5 });
      topObserver.observe(firstParagraph);
    }
  }

  collectSectionContent(sectionTitle: string) {
    const contentDiv = document.querySelector('#mw-content-text .mw-parser-output');
    if (!contentDiv) return;

    // Find all paragraphs in the current section
    const headings = Array.from(contentDiv.querySelectorAll('h2'));

    // Check if this is the lead section (dynamically named)
    const articleTitle = document.querySelector('#firstHeading')?.textContent || 'Article';
    const leadSectionName = `${articleTitle} - Overview`;

    let startElement: Element;
    let endElement: Element | null;

    if (sectionTitle === leadSectionName) {
      // Lead section is from start to first h2
      startElement = contentDiv.firstElementChild!;
      endElement = headings[0] || null;
    } else {
      // Find the heading for this section - try multiple ways
      const currentHeadingIndex = headings.findIndex(h => {
        let headingTitle = h.querySelector('.mw-headline')?.textContent ||
                          h.querySelector('.mw-headline-text')?.textContent ||
                          h.textContent?.trim() || '';

        // Clean up the title for comparison
        headingTitle = headingTitle.replace(/\[edit\]/gi, '').trim();

        return headingTitle === sectionTitle;
      });

      if (currentHeadingIndex === -1) {
        console.warn(`Section "${sectionTitle}" not found`);
        return;
      }

      startElement = headings[currentHeadingIndex];
      endElement = headings[currentHeadingIndex + 1] || null;
    }

    // Collect all paragraphs between start and end
    this.currentSectionContent = [];
    let element = startElement;

    while (element && element !== endElement) {
      if (element.tagName === 'P' && element.textContent && element.textContent.trim().length > 50) {
        this.currentSectionContent.push(element.textContent.trim());
      }
      element = element.nextElementSibling!;
    }

    console.log(`Section "${sectionTitle}" has ${this.currentSectionContent.length} paragraphs`);
  }

  async onSectionChange(newSection: string) {
    console.log(`Moving from section "${this.currentSection}" to "${newSection}"`);

    // Skip quizzes if in structured mode (Adventure/Explorer)
    if (this.isStructuredMode) {
      console.log('Structured mode active - skipping random quiz');
      this.currentSection = newSection;
      this.collectSectionContent(newSection);
      return;
    }

    // Only show quiz button if we've read a section and have content
    if (this.currentSection &&
        this.currentSectionContent.length > 0 &&
        !this.sectionsRead.includes(this.currentSection)) {

      // Mark section as read
      this.sectionsRead.push(this.currentSection);

      // Check if we should offer a quiz
      const now = Date.now();
      const timeSinceLastQuiz = now - this.lastQuizTime;

      if (timeSinceLastQuiz >= this.quizCooldown && !this.quizActive) {
        // Show a button to take quiz instead of forcing it
        this.showQuizPrompt(this.currentSection, this.currentSectionContent);
      }
    }

    // Update to new section
    this.currentSection = newSection;
    this.collectSectionContent(newSection);

    // Update progress on backend
    if (this.articleId) {
      await this.updateProgress();
    }
  }

  showQuizPrompt(sectionTitle: string, sectionContent: string[]) {
    // Remove any existing quiz prompts
    const existingPrompt = document.getElementById('wikiquest-quiz-prompt');
    if (existingPrompt) {
      existingPrompt.remove();
    }

    // Create floating quiz prompt button
    const prompt = document.createElement('div');
    prompt.id = 'wikiquest-quiz-prompt';
    prompt.innerHTML = `
      <div class="wq-quiz-prompt-container">
        <div class="wq-quiz-prompt-content">
          <div class="wq-quiz-prompt-icon">🎯</div>
          <div class="wq-quiz-prompt-text">
            <strong>Section Complete!</strong>
            <p>Test your knowledge of "${sectionTitle}"</p>
          </div>
        </div>
        <div class="wq-quiz-prompt-actions">
          <button id="wq-take-quiz-btn" class="wq-prompt-btn wq-prompt-btn-primary">Take Quiz (+XP)</button>
          <button id="wq-dismiss-quiz-btn" class="wq-prompt-btn wq-prompt-btn-secondary">Continue Reading</button>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    // Add event listeners
    document.getElementById('wq-take-quiz-btn')?.addEventListener('click', async () => {
      prompt.remove();
      this.lastQuizTime = Date.now();
      this.quizActive = true;
      await this.showSectionQuiz(sectionTitle, sectionContent);
    });

    document.getElementById('wq-dismiss-quiz-btn')?.addEventListener('click', () => {
      prompt.remove();
      this.lastQuizTime = Date.now(); // Update cooldown even if dismissed
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (document.getElementById('wikiquest-quiz-prompt')) {
        prompt.classList.add('wq-quiz-prompt-fadeout');
        setTimeout(() => prompt.remove(), 300);
      }
    }, 15000);
  }

  async updateProgress() {
    try {
      const readingTime = Math.floor((Date.now() - this.startTime) / 1000);

      await fetch(`${API_URL}/articles/${this.articleId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraphsRead: this.sectionsRead.length * 5, // Estimate paragraphs from sections
          readingTimeSeconds: readingTime
        })
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  async showSectionQuiz(sectionTitle: string, sectionContent: string[]) {
    // Combine all paragraphs from the section
    const paragraphContent = sectionContent.join('\n\n');

    console.log(`Generating quiz for section "${sectionTitle}" with ${sectionContent.length} paragraphs`);

    // Generate quiz
    try {
      const response = await fetch(`${API_URL}/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          articleId: this.articleId,
          paragraphContent,
          paragraphRange: `Section: ${sectionTitle}`,
          wikipediaUrl: this.articleData?.url,
          userTier: 'free'
        })
      });

      if (!response.ok) {
        throw new Error(`Quiz generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.quiz || !data.quiz.questions || data.quiz.questions.length === 0) {
        console.error('Invalid quiz data received:', data);
        throw new Error('Invalid quiz data structure');
      }

      console.log('Section quiz generated successfully:', data.quiz);

      // Display quiz with section title
      this.displayQuizOverlay(data.quiz, sectionTitle);
    } catch (error) {
      console.error('Error generating section quiz:', error);
      this.showNotification('❌ Quiz Error', 'Could not generate quiz. Please try again.');
      this.quizActive = false;
    }
  }

  async showQuiz(paragraphIndex: number, paragraph: HTMLElement) {
    // Get last 2-3 paragraphs of content
    const contentDiv = document.querySelector('#mw-content-text .mw-parser-output');
    const paragraphs = Array.from(contentDiv?.querySelectorAll('p') || [])
      .filter(p => p.textContent && p.textContent.trim().length > 100);

    const startIdx = Math.max(0, paragraphIndex - 2);
    const endIdx = paragraphIndex + 1;
    const contextParagraphs = paragraphs.slice(startIdx, endIdx);
    const paragraphContent = contextParagraphs.map(p => p.textContent).join('\n\n');

    // Generate quiz
    try {
      const response = await fetch(`${API_URL}/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          articleId: this.articleId,
          paragraphContent,
          paragraphRange: `${startIdx}-${endIdx}`,
          wikipediaUrl: this.articleData?.url,
          userTier: 'free' // TODO: Get from user profile
        })
      });

      if (!response.ok) {
        throw new Error(`Quiz generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.quiz || !data.quiz.questions || data.quiz.questions.length === 0) {
        console.error('Invalid quiz data received:', data);
        throw new Error('Invalid quiz data structure');
      }

      console.log('Quiz generated successfully:', data.quiz);
      this.displayQuizOverlay(data.quiz);
    } catch (error) {
      console.error('Error generating quiz:', error);
      // Show error message to user
      this.showNotification('❌ Quiz Error', 'Could not generate quiz. Please try again.');
    }
  }

  displayQuizOverlay(quiz: any, sectionTitle?: string) {
    // Check if a quiz is already showing
    const existingQuiz = document.getElementById('wikiquest-quiz-overlay');
    if (existingQuiz) {
      console.log('Quiz already showing, skipping');
      return;
    }

    // Validate quiz data
    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      console.error('Invalid quiz data in displayQuizOverlay:', quiz);
      this.showNotification('❌ Quiz Error', 'Invalid quiz format received');
      this.quizActive = false;
      return;
    }

    console.log('Displaying quiz with', quiz.questions.length, 'questions');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'wikiquest-quiz-overlay';
    overlay.innerHTML = `
      <div class="wq-quiz-container">
        <div class="wq-quiz-header">
          <h3>🎯 Section Complete!</h3>
          <p>${sectionTitle ? `You just read: "${sectionTitle}"` : 'Test your comprehension to earn XP'}</p>
          <p class="wq-quiz-subtitle">Answer these questions about what you just learned</p>
        </div>
        <div class="wq-quiz-questions" id="wq-questions"></div>
        <div class="wq-quiz-actions">
          <button id="wq-skip-btn" class="wq-btn wq-btn-secondary">Skip (-0 XP)</button>
          <button id="wq-submit-btn" class="wq-btn wq-btn-primary">Submit</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Render questions
    const questionsContainer = document.getElementById('wq-questions');
    if (!questionsContainer) {
      console.error('Questions container not found in DOM');
      return;
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      console.error('No questions array in quiz:', quiz);
      questionsContainer.innerHTML = '<p style="color: red;">Error: No questions available</p>';
      return;
    }

    console.log('Rendering', quiz.questions.length, 'questions');

    quiz.questions.forEach((q: QuizQuestion, qIndex: number) => {
      console.log(`Rendering question ${qIndex + 1}:`, q);

      if (!q.question || !q.options || !Array.isArray(q.options)) {
        console.error('Invalid question format:', q);
        return;
      }

      const questionEl = document.createElement('div');
      questionEl.className = 'wq-question';
      questionEl.innerHTML = `
        <p class="wq-question-text"><strong>Q${qIndex + 1}:</strong> ${q.question}</p>
        <div class="wq-options">
          ${q.options.map((option: string, oIndex: number) => `
            <label class="wq-option">
              <input type="radio" name="question-${qIndex}" value="${oIndex}">
              <span>${option}</span>
            </label>
          `).join('')}
        </div>
      `;
      questionsContainer.appendChild(questionEl);
    });

    console.log('Questions rendered successfully');

    // Add event listeners
    document.getElementById('wq-skip-btn')?.addEventListener('click', () => {
      overlay.remove();
      this.quizActive = false; // Reset active flag
    });

    document.getElementById('wq-submit-btn')?.addEventListener('click', () => {
      this.submitQuiz(quiz, overlay);
    });
  }

  async submitQuiz(quiz: any, overlay: HTMLElement) {
    // Collect answers
    const answers: number[] = [];
    quiz.questions.forEach((_: any, qIndex: number) => {
      const selected = document.querySelector(`input[name="question-${qIndex}"]:checked`) as HTMLInputElement;
      answers.push(selected ? parseInt(selected.value) : -1);
    });

    // Check if all answered
    if (answers.includes(-1)) {
      alert('Please answer all questions!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/quizzes/${quiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          articleId: this.articleId,
          answers: answers.map(a => ({ selected: a })),
          timeTakenSeconds: 30 // TODO: Track actual time
        })
      });

      const result = await response.json();

      // Show results
      this.showQuizResults(result, overlay);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }

  showQuizResults(result: any, overlay: HTMLElement) {
    const questionsContainer = overlay.querySelector('#wq-questions');
    if (!questionsContainer) return;

    questionsContainer.innerHTML = `
      <div class="wq-results">
        <div class="wq-results-header">
          <h3>${result.isPerfect ? '🎉 Perfect Score!' : '✅ Quiz Complete!'}</h3>
          <p class="wq-score">${result.correctCount}/${result.totalQuestions} correct</p>
          <p class="wq-xp-earned">+${result.xpEarned} XP</p>
        </div>
        <div class="wq-results-details">
          ${result.attempt.answers.map((a: any, i: number) => `
            <div class="wq-result-item ${a.is_correct ? 'correct' : 'incorrect'}">
              <p><strong>Q${i + 1}:</strong> ${a.is_correct ? '✅ Correct!' : '❌ Incorrect'}</p>
              ${!a.is_correct ? `<p class="wq-explanation">${a.explanation}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Replace actions
    const actionsDiv = overlay.querySelector('.wq-quiz-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <button id="wq-continue-btn" class="wq-btn wq-btn-primary">Continue Reading</button>
      `;

      document.getElementById('wq-continue-btn')?.addEventListener('click', () => {
        overlay.remove();
        this.quizActive = false; // Reset active flag

        // Show XP notification
        this.showNotification('🎉 XP Earned!', `+${result.xpEarned} XP | ${result.correctCount}/${result.totalQuestions} correct`);

        // Notify background to update badge and stats
        chrome.runtime.sendMessage({
          type: 'QUIZ_COMPLETED',
          xpEarned: result.xpEarned
        });
      });
    }
  }

  showLoginPrompt() {
    // Show a subtle prompt at the top of the page
    const prompt = document.createElement('div');
    prompt.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(79, 195, 247, 0.3);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 320px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    prompt.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">🎮</div>
        <div>
          <strong style="font-size: 14px; font-weight: 600;">WikiQuest is ready!</strong>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.95;">Sign in to start earning XP</p>
        </div>
      </div>
    `;

    prompt.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
      prompt.remove();
    });

    prompt.addEventListener('mouseenter', () => {
      prompt.style.transform = 'translateY(-2px)';
      prompt.style.boxShadow = '0 12px 30px rgba(79, 195, 247, 0.4)';
    });

    prompt.addEventListener('mouseleave', () => {
      prompt.style.transform = 'translateY(0)';
      prompt.style.boxShadow = '0 10px 25px rgba(79, 195, 247, 0.3)';
    });

    document.body.appendChild(prompt);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      prompt.style.opacity = '0';
      prompt.style.transform = 'translateX(400px)';
      setTimeout(() => prompt.remove(), 300);
    }, 10000);
  }

  showNotification(title: string, message: string) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'wq-toast';
    toast.innerHTML = `
      <div class="wq-toast-content">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('wq-toast-show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('wq-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WikiQuestContent());
} else {
  new WikiQuestContent();
}
