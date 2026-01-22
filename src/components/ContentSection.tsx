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
    const duration = 1000;

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
  const [visibleCount, setVisibleCount] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');

  const isShorts = type === 'shorts';
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
      <div className="p-8 text-center text-[var(--yt-gray)]">
        <p className="text-[14px]">No {itemLabel} found in your history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 border-b border-[var(--yt-gray-border)]">
        <div className="yt-stat-box border-r border-b border-[var(--yt-gray-border)]">
          <span className="yt-stat-value">
            <AnimatedNumber value={stats.totalVideos} />
          </span>
          <span className="yt-stat-label">{itemLabel} watched</span>
        </div>
        <div className="yt-stat-box border-b border-[var(--yt-gray-border)]">
          <span className="yt-stat-value">{formatDuration(stats.totalEstimatedHours)}</span>
          <span className="yt-stat-label">time watched</span>
        </div>
        <div className="yt-stat-box border-r border-[var(--yt-gray-border)]">
          <span className="yt-stat-value">
            <AnimatedNumber value={stats.channelStats.length} />
          </span>
          <span className="yt-stat-label">channels</span>
        </div>
        <div className="yt-stat-box">
          <span className="yt-stat-value text-[20px]">
            {stats.oldestWatchDate ? calculateAccountAge(stats.oldestWatchDate) : 'N/A'}
          </span>
          <span className="yt-stat-label">history span</span>
          {stats.oldestWatchDate && (
            <span className="yt-stat-sub">Since {formatDate(stats.oldestWatchDate)}</span>
          )}
        </div>
      </div>

      {/* Top Channel */}
      {stats.channelStats.length > 0 && (
        <div className="p-3 border-b border-[var(--yt-gray-border)] bg-[#fffde7]">
          <div className="flex items-center gap-2 mb-2">
            <span className="yt-trophy">🏆</span>
            <span className="text-[11px] font-bold text-[var(--yt-gray)] uppercase">
              Most Watched Channel
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <a
                href={stats.channelStats[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--yt-link)] font-bold text-[13px] hover:underline block truncate"
              >
                {stats.channelStats[0].name}
              </a>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <div className="font-bold text-[14px]">{stats.channelStats[0].watchCount.toLocaleString()} {itemLabel}</div>
              <div className="text-[10px] text-[var(--yt-gray)]">{formatDuration(stats.channelStats[0].estimatedHours)}</div>
            </div>
          </div>
          <div className="mt-2 yt-progress">
            <div
              className={`yt-progress-fill ${isShorts ? 'shorts' : ''}`}
              style={{ width: `${(stats.channelStats[0].watchCount / stats.totalVideos) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-[var(--yt-gray)] mt-1 text-right">
            {((stats.channelStats[0].watchCount / stats.totalVideos) * 100).toFixed(1)}% of your {itemLabel}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-[var(--yt-gray-border)] flex items-center justify-between bg-[#fafafa]">
        <span className="text-[11px] font-bold text-[var(--yt-gray)] uppercase">
          All Channels ({filteredChannels.length})
        </span>
        <input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="yt-input w-[140px] text-[11px]"
        />
      </div>

      {/* Channel List */}
      <div className="max-h-[300px] overflow-y-auto">
        {visibleChannels.map((channel) => {
          const rank = stats.channelStats.indexOf(channel) + 1;
          const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';

          return (
            <div key={channel.url} className="yt-channel-item">
              <div className={`yt-channel-rank ${rankClass}`}>
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
              </div>
              <div className="yt-channel-name">
                <a href={channel.url} target="_blank" rel="noopener noreferrer">
                  {channel.name}
                </a>
              </div>
              <div className="yt-channel-meta">
                <div className="yt-channel-count">{channel.watchCount.toLocaleString()}</div>
                <div className="yt-channel-time">{formatDuration(channel.estimatedHours)}</div>
              </div>
            </div>
          );
        })}

        {hasMore && (
          <div className="p-3 text-center border-t border-[#eee]">
            <button
              onClick={() => setVisibleCount(c => c + 20)}
              className="yt-btn"
            >
              Show More ({filteredChannels.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {filteredChannels.length === 0 && (
          <div className="p-6 text-center text-[var(--yt-gray)]">
            No channels match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
