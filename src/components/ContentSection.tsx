import { useState, useEffect, useMemo } from 'react';
import { ParsedStats, ChannelStats, CategoryStats as CategoryStatsType } from '../types';
import { formatDuration, formatDate } from '../lib/parser';

interface ContentSectionProps {
  stats: ParsedStats;
}

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(value * easeOutQuart);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{Math.round(displayValue).toLocaleString()}</span>;
}

interface TopChannelCardProps {
  channel: ChannelStats;
  rank: number;
  total: number;
  delay: number;
  accentColor: string;
}

function TopChannelCard({ channel, rank, total, delay, accentColor }: TopChannelCardProps) {
  const [visible, setVisible] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const percentage = ((channel.watchCount / total) * 100).toFixed(1);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const medals = ['', '🥇', '🥈', '🥉'];

  // Generate initials for fallback
  const initials = channel.name
    .split(/[\s_-]+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Use avatar from data (scraped during extraction)
  const avatarUrl = channel.avatarUrl;

  return (
    <div className={`top-channel-card ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      {avatarUrl && !avatarError ? (
        <img
          src={avatarUrl}
          alt={channel.name}
          className="channel-avatar"
          onError={() => setAvatarError(true)}
        />
      ) : (
        <div className="channel-avatar-fallback" style={{ background: accentColor }}>
          {rank <= 3 ? medals[rank] : initials}
        </div>
      )}
      <div className="channel-info">
        {channel.url ? (
          <a href={channel.url} target="_blank" rel="noopener noreferrer" className="channel-name channel-link">{channel.name}</a>
        ) : (
          <div className="channel-name">{channel.name}</div>
        )}
        <div className="channel-stats">
          <span className="watch-count">{channel.watchCount.toLocaleString()} watched</span>
          <span className="watch-time">{formatDuration(channel.estimatedHours)}</span>
        </div>
        <div className="channel-bar-container">
          <div
            className="channel-bar"
            style={{
              width: visible ? `${Math.min(parseFloat(percentage) * 3, 100)}%` : '0%',
              background: accentColor
            }}
          />
        </div>
      </div>
      <div className="channel-percentage" style={{ color: accentColor }}>{percentage}%</div>
    </div>
  );
}

interface StatsTableProps {
  videoCount: number;
  videoHours: number;
  videoCreators: number;
  shortsCount: number;
  shortsHours: number;
  shortsCreators: number;
  baseDelay: number;
}

function StatsTable({ videoCount, videoHours, videoCreators, shortsCount, shortsHours, baseDelay }: StatsTableProps) {
  const [visible, setVisible] = useState(false);
  const hasVideos = videoCount > 0;
  const hasShorts = shortsCount > 0;
  const rowCount = (hasVideos ? 1 : 0) + (hasShorts ? 1 : 0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), baseDelay);
    return () => clearTimeout(timer);
  }, [baseDelay]);

  return (
    <div className={`stats-table-container ${visible ? 'visible' : ''}`}>
      <div className="stats-header-row">
        <div className="stats-header-spacer"></div>
        <div className="stats-header-title video-stats-header">Video Stats</div>
        <div className="stats-header-title creator-stats-header">Creator Stats</div>
      </div>
      <table className="stats-table">
        <colgroup>
          <col /><col /><col /><col />
        </colgroup>
        <thead>
          <tr className="sub-header-row">
            <th></th>
            <th>Watched</th>
            <th>Time Spent</th>
            <th>Channels</th>
          </tr>
        </thead>
        <tbody>
          {hasVideos && (
            <tr className="video-row">
              <td className="row-label"><span className="row-emoji">🎬</span> Videos</td>
              <td className="stat-cell">{visible ? <AnimatedNumber value={videoCount} duration={2000} /> : '0'}</td>
              <td className="stat-cell">{formatDuration(videoHours)}</td>
              <td className="stat-cell creators-merged" rowSpan={rowCount}>
                {visible ? <AnimatedNumber value={videoCreators} duration={2000} /> : '0'}
              </td>
            </tr>
          )}
          {hasShorts && (
            <tr className="shorts-row">
              <td className="row-label"><span className="row-emoji">⚡</span> Shorts</td>
              <td className="stat-cell">{visible ? <AnimatedNumber value={shortsCount} duration={2000} /> : '0'}</td>
              <td className="stat-cell">{formatDuration(shortsHours)}</td>
              {!hasVideos && (
                <td className="stat-cell creators-merged" rowSpan={rowCount}>0</td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface TopCreatorsSectionProps {
  title: string;
  emoji: string;
  channelStats: ChannelStats[];
  totalCount: number;
  accentColor: string;
  baseDelay: number;
}

function TopCreatorsSection({ title, emoji, channelStats, totalCount, accentColor, baseDelay }: TopCreatorsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channelStats;
    const query = searchQuery.toLowerCase();
    return channelStats.filter(ch => ch.name.toLowerCase().includes(query));
  }, [channelStats, searchQuery]);

  const visibleChannels = filteredChannels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredChannels.length;

  if (channelStats.length === 0) return null;

  return (
    <div className="top-channels-section">
      <div className="section-header">
        <span className="header-icon">{emoji}</span>
        <span>{title} Top Creators</span>
      </div>

      <div className="top-channels-list">
        {channelStats.slice(0, 10).map((channel, idx) => (
          <TopChannelCard
            key={channel.name}
            channel={channel}
            rank={idx + 1}
            total={totalCount}
            delay={baseDelay + idx * 100}
            accentColor={accentColor}
          />
        ))}
      </div>

      <div className={`channel-explorer ${expanded ? 'expanded' : ''}`}>
        <button
          className="explorer-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? 'Hide' : 'Explore'} all {channelStats.length.toLocaleString()} channels</span>
          <span className={`toggle-arrow ${expanded ? 'up' : ''}`}>↓</span>
        </button>

        {expanded && (
          <div className="explorer-content">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="channels-grid">
              {visibleChannels.map((channel) => {
                const rank = channelStats.indexOf(channel) + 1;
                return (
                  <div key={`${channel.name}-${rank}`} className="channel-item">
                    <span className="item-rank">#{rank}</span>
                    <span className="item-name">{channel.name}</span>
                    <span className="item-count">{channel.watchCount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <button
                className="load-more-btn"
                onClick={() => setVisibleCount(c => c + 20)}
              >
                Show more ({filteredChannels.length - visibleCount} remaining)
              </button>
            )}

            {filteredChannels.length === 0 && searchQuery && (
              <div className="no-results">No channels match "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const categoryEmojis: Record<string, string> = {
  'Gaming': '🎮',
  'Music': '🎵',
  'Entertainment': '🎭',
  'Sports': '⚽',
  'Education': '📚',
  'Science & Technology': '🔬',
  'News & Politics': '📰',
  'Comedy': '😂',
  'Film & Animation': '🎬',
  'People & Blogs': '👥',
  'Howto & Style': '✨',
  'Pets & Animals': '🐾',
  'Travel & Events': '✈️',
  'Autos & Vehicles': '🚗',
  'Nonprofits & Activism': '💚',
};

interface TopCategoriesSectionProps {
  categories: CategoryStatsType[];
  baseDelay: number;
}

function TopCategoriesSection({ categories, baseDelay }: TopCategoriesSectionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), baseDelay);
    return () => clearTimeout(timer);
  }, [baseDelay]);

  if (categories.length === 0) return null;

  const displayCategories = categories.slice(0, 5);
  const maxMinutes = displayCategories[0]?.totalMinutes || 1;

  return (
    <div className="top-categories-section">
      <div className="section-header">
        <span className="header-icon">📊</span>
        <span>Top Categories</span>
      </div>

      <div className="categories-list">
        {displayCategories.map((category, idx) => {
          const emoji = categoryEmojis[category.name] || '📁';
          const percentage = (category.totalMinutes / maxMinutes) * 100;
          const hours = category.totalMinutes / 60;

          return (
            <div
              key={category.name}
              className={`category-card ${visible ? 'visible' : ''}`}
              style={{ transitionDelay: `${baseDelay + idx * 100}ms` }}
            >
              <div className="category-rank">#{idx + 1}</div>
              <div className="category-icon">{emoji}</div>
              <div className="category-details">
                <div className="category-name-row">
                  <span className="category-label">{category.name}</span>
                  <span className="category-time">{formatDuration(hours)}</span>
                </div>
                <div className="category-meta">
                  {category.channelCount} creator{category.channelCount !== 1 ? 's' : ''} in top 25
                </div>
                <div className="category-bar-container">
                  <div
                    className="category-bar"
                    style={{ width: visible ? `${percentage}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContentSection({ stats }: ContentSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (stats.totalVideos === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <p>No videos found in your history</p>
      </div>
    );
  }

  return (
    <div className={`rewind-container ${mounted ? 'mounted' : ''}`}>
      {/* Grand Total Hero */}
      <div className="total-hero">
        <div className="total-badge">YOUR YOUTUBE REWIND</div>
        <div className="total-number">
          <AnimatedNumber value={stats.totalVideos} duration={2500} />
        </div>
        <div className="total-label">total videos & shorts watched</div>
        <div className="total-time">{formatDuration(stats.totalEstimatedHours)} of your life</div>

        {stats.oldestWatchDate && (
          <div className="history-badge">
            <span className="history-icon">📅</span>
            <span>History since {formatDate(stats.oldestWatchDate)}</span>
          </div>
        )}
      </div>

      {/* Stats Table */}
      <StatsTable
        videoCount={stats.videoCount}
        videoHours={stats.videoEstimatedHours}
        videoCreators={stats.videoChannelCount}
        shortsCount={stats.shortsCount}
        shortsHours={stats.shortsEstimatedHours}
        shortsCreators={stats.shortsChannelCount}
        baseDelay={400}
      />

      {/* Video Top Creators + Categories Side by Side */}
      <div className="creators-row">
        <TopCreatorsSection
          title="Video"
          emoji="🎬"
          channelStats={stats.videoChannelStats}
          totalCount={stats.videoCount}
          accentColor="#FF6B6B"
          baseDelay={700}
        />
        {stats.topCategories.length > 0 && (
          <TopCategoriesSection
            categories={stats.topCategories}
            baseDelay={700}
          />
        )}
      </div>

      {/* Shorts Top Creators */}
      <TopCreatorsSection
        title="Shorts"
        emoji="⚡"
        channelStats={stats.shortsChannelStats}
        totalCount={stats.shortsCount}
        accentColor="#4ECDC4"
        baseDelay={900}
      />
    </div>
  );
}
