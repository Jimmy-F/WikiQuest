import React, { useState, useEffect } from 'react';
import './WikipediaViewer.css';

interface WikipediaViewerProps {
  article: string;
  articleIcon?: string;
  onStartQuiz: () => void;
  onClose: () => void;
}

const WikipediaViewer: React.FC<WikipediaViewerProps> = ({
  article,
  articleIcon,
  onStartQuiz,
  onClose
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticleContent();
  }, [article]);

  const fetchArticleContent = async () => {
    try {
      setLoading(true);
      // Use Wikipedia API to get clean article HTML
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(article.replace(/ /g, '_'))}`
      );

      if (!response.ok) throw new Error('Failed to fetch article');

      const html = await response.text();

      // Extract only the main content and clean it up
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove unwanted elements
      const unwantedSelectors = [
        '.mw-editsection',
        '.navbox',
        '.vertical-navbox',
        '.sidebar',
        '.infobox',
        '.ambox',
        '.metadata',
        'sup.reference',
        '.reflist',
        '#toc',
        '.toc'
      ];

      unwantedSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => el.remove());
      });

      // Get the main content
      const mainContent = doc.body.innerHTML;
      setContent(mainContent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Wikipedia content:', error);
      setLoading(false);
      setContent('<p>Failed to load article. Please try again.</p>');
    }
  };

  return (
    <div className="wikipedia-viewer-overlay">
      <div className="wikipedia-viewer-container">
        {/* Header */}
        <div className="viewer-header">
          <div className="viewer-title">
            {articleIcon && <span className="article-icon">{articleIcon}</span>}
            <h2>{article}</h2>
          </div>
          <div className="viewer-actions">
            <button
              className="btn-start-quiz"
              onClick={onStartQuiz}
              title="Start the quiz after reading"
            >
              📝 Start Quiz
            </button>
            <button
              className="btn-close-viewer"
              onClick={onClose}
              title="Close and skip quiz"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Wikipedia content */}
        <div className="viewer-content">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading article...</p>
            </div>
          ) : (
            <div
              className="wikipedia-article-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* Footer instructions */}
        <div className="viewer-footer">
          <p className="reading-tip">
            💡 <strong>Tip:</strong> Read the article carefully, then click "Start Quiz" to test your knowledge!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WikipediaViewer;
