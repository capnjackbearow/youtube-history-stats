import { useState } from 'react';
import { WatchHistoryEntry, ParsedStats } from './types';
import { parseWatchHistory } from './lib/parser';
import { TakeoutUploader } from './components/TakeoutUploader';
import { BrowserExtract } from './components/BrowserExtract';
import { Instructions } from './components/Instructions';
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

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-amber)] opacity-[0.02] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--accent-red)] opacity-[0.02] blur-[100px] rounded-full" />
      </div>

      <div className={`relative z-10 mx-auto ${stats ? 'max-w-7xl' : 'max-w-6xl'}`}>
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in-up">
          <div className="inline-block mb-4">
            {/* VHS-style logo */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-8 bg-gradient-to-b from-[var(--accent-amber)] to-[var(--accent-orange)] rounded-sm" />
              <div className="w-3 h-8 bg-gradient-to-b from-[var(--accent-orange)] to-[var(--accent-red)] rounded-sm" />
              <div className="w-3 h-8 bg-gradient-to-b from-[var(--accent-red)] to-[var(--accent-amber)] rounded-sm" />
            </div>
          </div>

          <h1 className="font-['VT323'] text-5xl sm:text-6xl text-[var(--text-primary)] text-glow mb-2">
            YOUTUBE STATS
          </h1>
          <p className="text-[var(--text-secondary)] text-sm tracking-widest">
            ▸ ANALYZE YOUR WATCH HISTORY ◂
          </p>

          {/* Decorative line */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--accent-amber)]" />
            <div className="w-2 h-2 bg-[var(--accent-amber)] rotate-45" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--accent-amber)]" />
          </div>
        </header>

        {/* Main Content */}
        {!stats ? (
          <main className="space-y-6">
            <TakeoutUploader onDataLoaded={handleDataLoaded} />

            {/* Methods section */}
            <div className="max-w-2xl mx-auto pt-4">
              <p className="text-center text-sm text-[var(--text-secondary)] mb-4">
                Need your <code className="text-[var(--accent-cyan)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded">watch-history.json</code> file? Choose a method:
              </p>
            </div>

            <BrowserExtract />
            <Instructions />

            {/* Footer note */}
            <div className="text-center mt-12">
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--accent-cyan)]">100% client-side</span> — Your data stays in your browser
              </p>
            </div>
          </main>
        ) : (
          <main className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Reset button */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--accent-amber)]">{stats.longForm.totalVideos.toLocaleString()}</span> videos +{' '}
                <span className="text-[var(--accent-red)]">{stats.shorts.totalVideos.toLocaleString()}</span> shorts ={' '}
                <span className="text-[var(--text-primary)]">{(stats.longForm.totalVideos + stats.shorts.totalVideos).toLocaleString()}</span> total
              </div>
              <button onClick={handleReset} className="retro-btn text-sm">
                ◂ UPLOAD NEW FILE
              </button>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              {/* Left: Long Form */}
              <div className="vhs-card rounded-lg p-6 overflow-hidden flex flex-col">
                <ContentSection stats={stats.longForm} type="longForm" />
              </div>

              {/* Right: Shorts */}
              <div className="vhs-card rounded-lg p-6 overflow-hidden flex flex-col border-[var(--accent-red)]/20">
                <ContentSection stats={stats.shorts} type="shorts" />
              </div>
            </div>

            {/* Footer */}
            <footer className="text-center pt-6 pb-2 mt-4 border-t border-[var(--accent-amber)]/10">
              <p className="text-xs text-[var(--text-secondary)]">
                All data processed locally • Long form: ~10 min avg • Shorts: ~30 sec avg
              </p>
            </footer>
          </main>
        )}
      </div>

    </div>
  );
}

export default App;
