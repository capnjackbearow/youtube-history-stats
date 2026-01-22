import { useState, useEffect } from 'react';
import { WatchHistoryEntry, ParsedStats } from './types';
import { parseWatchHistory } from './lib/parser';
import { TakeoutUploader } from './components/TakeoutUploader';
import { BrowserExtract } from './components/BrowserExtract';
import { ContentSection } from './components/ContentSection';

function App() {
  const [stats, setStats] = useState<ParsedStats | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDataLoaded = (data: WatchHistoryEntry[]) => {
    const parsedStats = parseWatchHistory(data);
    setStats(parsedStats);
  };

  const handleReset = () => {
    setStats(null);
  };

  return (
    <div className={`rewind-app ${mounted ? 'mounted' : ''}`}>
      {/* Header */}
      <header className="rewind-header">
        <div className="header-content">
          <div className="rewind-logo">
            <div className="logo-icon">
              <div className="logo-play" />
            </div>
            <span className="logo-text">YouTube</span>
            <span className="logo-rewind">Rewind</span>
          </div>
          {stats && (
            <button onClick={handleReset} className="rewind-btn">
              <span className="btn-arrow">←</span>
              <span>New Analysis</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="rewind-main">
        {!stats ? (
          <div className="upload-page">
            {/* Hero Section */}
            <div className="upload-hero">
              <h1 className="hero-title">YouTube Rewind</h1>
              <p className="hero-subtitle">
                Discover your watching habits, top creators, and how much of your life you've spent on YouTube
              </p>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
              <TakeoutUploader onDataLoaded={handleDataLoaded} />
            </div>

            {/* Divider */}
            <div className="section-divider">
              <span className="divider-line" />
              <span className="divider-text">Need your watch history?</span>
              <span className="divider-line" />
            </div>

            {/* Instructions */}
            <BrowserExtract />

            {/* Privacy Note */}
            <div className="privacy-note">
              <span className="privacy-icon">🔒</span>
              <span>100% Private — All data is processed locally in your browser. Nothing is uploaded to any server.</span>
            </div>
          </div>
        ) : (
          <ContentSection stats={stats} />
        )}
      </main>

      {/* Footer */}
      <footer className="rewind-footer">
        <p>All data processed locally in your browser • ~8 min avg per video</p>
        <a
          href="https://github.com/capnjackbearow/youtube-history-stats"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;
