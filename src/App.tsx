import { useState } from 'react';
import { WatchHistoryEntry, ParsedStats } from './types';
import { parseWatchHistory } from './lib/parser';
import { TakeoutUploader } from './components/TakeoutUploader';
import { BrowserExtract } from './components/BrowserExtract';
import { ContentSection } from './components/ContentSection';

function App() {
  const [stats, setStats] = useState<ParsedStats | null>(null);

  const handleDataLoaded = (data: WatchHistoryEntry[]) => {
    const parsedStats = parseWatchHistory(data);
    setStats(parsedStats);
  };

  const handleReset = () => {
    setStats(null);
  };

  const totalVideos = stats ? stats.longForm.totalVideos + stats.shorts.totalVideos : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Classic YouTube Header */}
      <header className="yt-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="yt-logo">
            <div className="yt-logo-tube">
              <div className="yt-logo-play" />
            </div>
            <span className="yt-logo-text">YouTube</span>
            <span className="text-white font-bold text-[16px] ml-1">Stats</span>
          </div>
          {stats && (
            <button onClick={handleReset} className="yt-btn">
              ← Upload New File
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {!stats ? (
            <div className="space-y-3">
              {/* Upload Section */}
              <div className="yt-card">
                <div className="yt-card-header">
                  <span className="yt-card-header-icon">📊</span>
                  Analyze Your Watch History
                </div>
                <div className="yt-card-body">
                  <TakeoutUploader onDataLoaded={handleDataLoaded} />
                </div>
              </div>

              {/* Methods Section */}
              <div className="text-center pt-2 pb-3">
                <p className="text-[13px] text-[var(--yt-gray)]">
                  Need your <code className="bg-[#f0f0f0] px-2 py-1 text-[var(--yt-red)] font-bold">watch-history.json</code> file? Follow the instructions below:
                </p>
              </div>

              <BrowserExtract />

              {/* Info Box */}
              <div className="yt-card mt-3">
                <div className="yt-card-body text-center py-4">
                  <p className="text-[11px] text-[var(--yt-gray)]">
                    🔒 <strong>100% Private</strong> — All data is processed locally in your browser. Nothing is uploaded to any server.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade">
              {/* Summary Bar */}
              <div className="yt-card">
                <div className="yt-card-body py-3">
                  <div className="flex items-center justify-center gap-6 text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="yt-badge yt-badge-videos">Videos</span>
                      <span className="font-bold">{stats.longForm.totalVideos.toLocaleString()}</span>
                    </div>
                    <span className="text-[var(--yt-gray)]">+</span>
                    <div className="flex items-center gap-2">
                      <span className="yt-badge yt-badge-shorts">Shorts</span>
                      <span className="font-bold">{stats.shorts.totalVideos.toLocaleString()}</span>
                    </div>
                    <span className="text-[var(--yt-gray)]">=</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[16px]">{totalVideos.toLocaleString()}</span>
                      <span className="text-[var(--yt-gray)]">total watched</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Long Form Videos */}
                <div className="yt-card">
                  <div className="yt-card-header" style={{ borderLeft: '4px solid var(--yt-red)' }}>
                    <span className="yt-card-header-icon">🎬</span>
                    Long Form Videos
                    <span className="yt-badge yt-badge-videos ml-auto">{stats.longForm.totalVideos.toLocaleString()}</span>
                  </div>
                  <div className="yt-card-body p-0">
                    <ContentSection stats={stats.longForm} type="longForm" />
                  </div>
                </div>

                {/* Right: Shorts */}
                <div className="yt-card">
                  <div className="yt-card-header" style={{ borderLeft: '4px solid var(--yt-shorts)' }}>
                    <span className="yt-card-header-icon">📱</span>
                    Shorts
                    <span className="yt-badge yt-badge-shorts ml-auto">{stats.shorts.totalVideos.toLocaleString()}</span>
                  </div>
                  <div className="yt-card-body p-0">
                    <ContentSection stats={stats.shorts} type="shorts" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="yt-footer">
        <p>
          All data processed locally in your browser • Long form: ~10 min avg • Shorts: ~30 sec avg
        </p>
        <p className="mt-2">
          <a href="https://github.com/capnjackbearow/youtube-history-stats" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
