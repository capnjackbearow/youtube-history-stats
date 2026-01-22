import { useState, useEffect, useMemo } from 'react';
import { ContentStats } from '../types';
import { formatDuration, formatDate, calculateAccountAge } from '../lib/parser';

interface ContentSectionProps {
  stats: ContentStats;
  type: 'longForm' | 'shorts';
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(value * easeOutQuart);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{Math.round(displayValue).toLocaleString()}</span>;
}

export function ContentSection({ stats, type }: ContentSectionProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const isShorts = type === 'shorts';
  const accentColor = isShorts ? 'var(--accent-red)' : 'var(--accent-amber)';
  const title = isShorts ? 'SHORTS' : 'LONG FORM';
  const icon = isShorts ? '📱' : '🎬';
  const itemLabel = isShorts ? 'shorts' : 'videos';

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return stats.channelStats;
    const query = searchQuery.toLowerCase();
    return stats.channelStats.filter(ch => ch.name.toLowerCase().includes(query));
  }, [stats.channelStats, searchQuery]);

  const visibleChannels = filteredChannels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredChannels.length;

  if (stats.totalVideos === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">{icon}</span>
          <h2
            className="font-['VT323'] text-3xl mb-1"
            style={{ color: accentColor }}
          >
            {title}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-secondary)] text-center">
            No {itemLabel} found in your history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-4xl mb-2 block">{icon}</span>
        <h2
          className="font-['VT323'] text-3xl mb-1"
          style={{ color: accentColor }}
        >
          {title}
        </h2>
        <div
          className="h-0.5 w-24 mx-auto"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="vhs-card rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1 font-['VT323']">
            {isShorts ? 'SHORTS WATCHED' : 'VIDEOS WATCHED'}
          </div>
          <div
            className="font-['VT323'] text-2xl"
            style={{ color: accentColor }}
          >
            <AnimatedNumber value={stats.totalVideos} />
          </div>
        </div>

        <div className="vhs-card rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1 font-['VT323']">TIME WATCHED</div>
          <div
            className="font-['VT323'] text-2xl"
            style={{ color: accentColor }}
          >
            {formatDuration(stats.totalEstimatedHours)}
          </div>
        </div>

        <div className="vhs-card rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1 font-['VT323']">CHANNELS</div>
          <div
            className="font-['VT323'] text-2xl"
            style={{ color: accentColor }}
          >
            <AnimatedNumber value={stats.channelStats.length} />
          </div>
        </div>

        <div className="vhs-card rounded-lg p-4">
          <div className="text-xs text-[var(--text-secondary)] mb-1 font-['VT323']">HISTORY SPAN</div>
          <div
            className="font-['VT323'] text-lg"
            style={{ color: accentColor }}
          >
            {stats.oldestWatchDate ? calculateAccountAge(stats.oldestWatchDate) : 'N/A'}
          </div>
          {stats.oldestWatchDate && (
            <div className="text-[10px] text-[var(--text-secondary)]">
              Since {formatDate(stats.oldestWatchDate)}
            </div>
          )}
        </div>
      </div>

      {/* Top Channel */}
      {stats.channelStats.length > 0 && (
        <div className="vhs-card rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span>🏆</span>
            <span className="font-['VT323'] text-sm" style={{ color: accentColor }}>
              #1 CHANNEL
            </span>
          </div>
          <div className="font-['VT323'] text-xl text-[var(--text-primary)] mb-1 truncate">
            {stats.channelStats[0].name}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>{stats.channelStats[0].watchCount} {itemLabel}</span>
            <span>{formatDuration(stats.channelStats[0].estimatedHours)}</span>
          </div>
          <div className="mt-2 h-1.5 bg-[var(--bg-dark)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(stats.channelStats[0].watchCount / stats.totalVideos) * 100}%`,
                background: accentColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Channel List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <span className="font-['VT323'] text-sm" style={{ color: accentColor }}>
            ALL CHANNELS
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-32 bg-[var(--bg-card)] border border-[var(--text-secondary)]/20 rounded px-2 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {visibleChannels.map((channel, index) => (
            <div
              key={channel.url}
              className="flex items-center gap-2 p-2 rounded hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <span
                className="font-['VT323'] text-sm w-8 text-center"
                style={{ color: index < 3 ? accentColor : 'var(--text-secondary)' }}
              >
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-primary)] hover:text-[var(--accent-cyan)] truncate block"
                >
                  {channel.name}
                </a>
              </div>
              <div className="text-right">
                <div className="font-['VT323'] text-sm" style={{ color: accentColor }}>
                  {channel.watchCount}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {formatDuration(channel.estimatedHours)}
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setVisibleCount(c => c + 15)}
              className="w-full py-2 text-xs font-['VT323'] hover:bg-[var(--bg-elevated)] rounded transition-colors"
              style={{ color: accentColor }}
            >
              LOAD MORE ({filteredChannels.length - visibleCount} remaining)
            </button>
          )}

          {filteredChannels.length === 0 && (
            <p className="text-center text-xs text-[var(--text-secondary)] py-4">
              No channels match "{searchQuery}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
