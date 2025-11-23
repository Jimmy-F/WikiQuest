import axios from 'axios';

export class WikiRaceBot {
  private difficulty: string;
  private mistakeRate: number;
  private baseClickDelay: number;

  constructor(difficulty: string = 'medium') {
    this.difficulty = difficulty;

    // Configure bot behavior based on difficulty
    const config = {
      'easy': { mistakeRate: 0.6, baseDelay: 4000 },
      'medium': { mistakeRate: 0.3, baseDelay: 2500 },
      'hard': { mistakeRate: 0.2, baseDelay: 1800 },
      'expert': { mistakeRate: 0.1, baseDelay: 1500 },
      'master': { mistakeRate: 0.05, baseDelay: 1200 }
    };

    const botConfig = config[difficulty as keyof typeof config] || config['medium'];
    this.mistakeRate = botConfig.mistakeRate;
    this.baseClickDelay = botConfig.baseDelay;
  }

  async raceAgainst(startArticle: string, endArticle: string): Promise<{
    timeSeconds: number;
    clicks: number;
    path: string[];
  }> {
    try {
      // Find optimal path (simplified - using BFS-like approach)
      const optimalPath = await this.findPath(startArticle, endArticle);

      // Add human-like imperfections
      const actualPath = this.addMistakes(optimalPath);

      // Calculate timing with variance
      const clickDelay = this.getClickDelay();
      const totalTime = actualPath.length * (clickDelay / 1000);

      return {
        timeSeconds: Math.round(totalTime),
        clicks: actualPath.length,
        path: actualPath
      };
    } catch (error) {
      console.error('Bot race error:', error);

      // Fallback: reasonable but not optimal performance
      return this.generateFallbackResult(startArticle, endArticle);
    }
  }

  private async findPath(startArticle: string, endArticle: string): Promise<string[]> {
    try {
      // Use Wikipedia API to find links from start article
      const links = await this.getArticleLinks(startArticle);

      // Check if target is directly linked
      if (links.includes(endArticle)) {
        return [startArticle, endArticle];
      }

      // Try 2-hop paths (start -> intermediate -> end)
      for (const intermediate of links.slice(0, 10)) {
        const intermediateLinks = await this.getArticleLinks(intermediate);
        if (intermediateLinks.includes(endArticle)) {
          return [startArticle, intermediate, endArticle];
        }
      }

      // Try 3-hop paths (simplified)
      const intermediate = links[0];
      const intermediateLinks = await this.getArticleLinks(intermediate);
      const secondIntermediate = intermediateLinks[0];

      return [startArticle, intermediate, secondIntermediate, endArticle];
    } catch (error) {
      console.error('Path finding error:', error);
      // Return a fallback path
      return [startArticle, 'Science', endArticle];
    }
  }

  private async getArticleLinks(articleTitle: string): Promise<string[]> {
    try {
      const response = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          titles: articleTitle,
          prop: 'links',
          pllimit: 50,
          format: 'json',
          formatversion: 2
        },
        timeout: 5000
      });

      const pages = response.data.query?.pages || [];
      if (pages.length === 0) return [];

      const links = pages[0].links || [];
      return links.map((link: any) => link.title);
    } catch (error) {
      console.error(`Error fetching links for ${articleTitle}:`, error);
      return [];
    }
  }

  private addMistakes(optimalPath: string[]): string[] {
    // Number of extra clicks to add
    const extraClicks = Math.floor(Math.random() * 4 * this.mistakeRate);

    if (extraClicks === 0 || optimalPath.length === 0) {
      return optimalPath;
    }

    // Insert "wrong turn" articles
    const modifiedPath = [...optimalPath];
    const wrongTurns = ['History', 'Geography', 'Science', 'Culture', 'Society'];

    for (let i = 0; i < extraClicks; i++) {
      const insertIndex = Math.floor(Math.random() * (modifiedPath.length - 1)) + 1;
      const randomArticle = wrongTurns[Math.floor(Math.random() * wrongTurns.length)];
      modifiedPath.splice(insertIndex, 0, randomArticle);
    }

    return modifiedPath;
  }

  private getClickDelay(): number {
    // Add ±30% randomness to click delay for human-like behavior
    const variance = 0.3;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    return this.baseClickDelay * randomFactor;
  }

  private generateFallbackResult(startArticle: string, endArticle: string): {
    timeSeconds: number;
    clicks: number;
    path: string[];
  } {
    // Generate a reasonable fallback based on difficulty
    const baseClicks = {
      'easy': 8,
      'medium': 5,
      'hard': 4,
      'expert': 3,
      'master': 3
    }[this.difficulty] || 5;

    const clicks = baseClicks + Math.floor(Math.random() * 3);
    const path = [startArticle];

    // Add intermediate articles
    const intermediates = ['Science', 'History', 'Geography', 'Culture'];
    for (let i = 1; i < clicks; i++) {
      const article = intermediates[Math.floor(Math.random() * intermediates.length)];
      path.push(article);
    }

    path.push(endArticle);

    const timeSeconds = Math.round(clicks * (this.baseClickDelay / 1000));

    return { timeSeconds, clicks: path.length, path };
  }
}
