import { useState, useEffect, useMemo } from 'react';
import { ParsedStats, ChannelStats } from '../types';
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

interface StatCardProps {
  value: string | number;
  label: string;
  sublabel?: string;
  gradient: string;
  delay: number;
  isNumber?: boolean;
}

function StatCard({ value, label, sublabel, gradient, delay, isNumber = false }: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`stat-card ${gradient} ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="stat-value">
        {isNumber ? <AnimatedNumber value={value as number} duration={2000} /> : value}
      </div>
      <div className="stat-label">{label}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  );
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

interface CategorySectionProps {
  title: string;
  emoji: string;
  count: number;
  hours: number;
  channelCount: number;
  channelStats: ChannelStats[];
  gradientClass: string;
  accentColor: string;
  baseDelay: number;
}

function CategorySection({
  title,
  emoji,
  count,
  hours,
  channelCount,
  channelStats,
  gradientClass,
  accentColor,
  baseDelay
}: CategorySectionProps) {
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

  if (count === 0) return null;

  return (
    <div className="category-section">
      {/* Hero Stats */}
      <div className={`category-hero ${gradientClass}`}>
        <div className="category-title">
          <span className="category-emoji">{emoji}</span>
          <span>{title}</span>
        </div>

        <div className="hero-stats">
          <StatCard
            value={count}
            label="watched"
            gradient="stat-gradient-1"
            delay={baseDelay}
            isNumber
          />
          <StatCard
            value={formatDuration(hours)}
            label="time spent"
            gradient="stat-gradient-2"
            delay={baseDelay + 100}
          />
          {channelCount > 0 && (
            <StatCard
              value={channelCount}
              label="creators"
              gradient="stat-gradient-3"
              delay={baseDelay + 200}
              isNumber
            />
          )}
        </div>
      </div>

      {/* Top Channels */}
      {channelStats.length > 0 && (
        <div className="top-channels-section">
          <div className="section-header">
            <span className="header-icon">🏆</span>
            <span>Your Top Creators</span>
          </div>

          <div className="top-channels-list">
            {channelStats.slice(0, 10).map((channel, idx) => (
              <TopChannelCard
                key={channel.name}
                channel={channel}
                rank={idx + 1}
                total={count}
                delay={baseDelay + 300 + idx * 100}
                accentColor={accentColor}
              />
            ))}
          </div>

          {/* Expandable Channel Explorer */}
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
      )}
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

      {/* Videos Section */}
      <CategorySection
        title="Videos"
        emoji="🎬"
        count={stats.videoCount}
        hours={stats.videoEstimatedHours}
        channelCount={stats.videoChannelCount}
        channelStats={stats.videoChannelStats}
        gradientClass="gradient-videos"
        accentColor="#FF6B6B"
        baseDelay={400}
      />

      {/* Shorts Section */}
      <CategorySection
        title="Shorts"
        emoji="⚡"
        count={stats.shortsCount}
        hours={stats.shortsEstimatedHours}
        channelCount={stats.shortsChannelCount}
        channelStats={stats.shortsChannelStats}
        gradientClass="gradient-shorts"
        accentColor="#4ECDC4"
        baseDelay={800}
      />
    </div>
  );
}
