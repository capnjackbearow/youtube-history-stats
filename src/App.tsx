import { useState } from 'react';
import { WatchHistoryEntry, ParsedStats } from './types';
import { parseWatchHistory } from './lib/parser';
import { TakeoutUploader } from './components/TakeoutUploader';
import { BrowserExtract } from './components/BrowserExtract';
import { Instructions } from './components/Instructions';
import { StatsOverview } from './components/StatsOverview';
import { ChannelTable } from './components/ChannelTable';

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

      <div className="relative z-10 max-w-6xl mx-auto">
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
          <main className="space-y-8">
            {/* Reset button */}
            <div className="flex justify-end">
              <button onClick={handleReset} className="retro-btn text-sm">
                ◂ UPLOAD NEW FILE
              </button>
            </div>

            <StatsOverview stats={stats} />
            <ChannelTable channels={stats.channelStats} totalVideos={stats.totalVideos} />

            {/* Footer */}
            <footer className="text-center pt-8 pb-4 border-t border-[var(--accent-amber)]/10">
              <p className="text-xs text-[var(--text-secondary)]">
                All data processed locally in your browser • Estimates based on 10 min average video length
              </p>
            </footer>
          </main>
        )}
      </div>

    </div>
  );
}

export default App;
