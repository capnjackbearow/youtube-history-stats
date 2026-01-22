import { useEffect, useState } from 'react';
import { ParsedStats } from '../types';
import { formatDuration, formatDate, calculateAccountAge } from '../lib/parser';

interface StatsOverviewProps {
  stats: ParsedStats;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}

function AnimatedNumber({ value, duration = 1500, format }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (value - startValue) * easeOutQuart;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = format ? format(displayValue) : Math.round(displayValue).toLocaleString();

  return <span>{formatted}</span>;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      label: 'ACCOUNT AGE',
      value: stats.oldestWatchDate ? calculateAccountAge(stats.oldestWatchDate) : 'Unknown',
      subtext: stats.oldestWatchDate ? `Since ${formatDate(stats.oldestWatchDate)}` : '',
      icon: '📅',
      color: 'amber',
    },
    {
      label: 'VIDEOS WATCHED',
      value: stats.totalVideos,
      subtext: 'Total plays recorded',
      icon: '▶️',
      color: 'cyan',
      animate: true,
    },
    {
      label: 'TIME WATCHED',
      value: formatDuration(stats.totalEstimatedHours),
      subtext: `~${Math.round(stats.totalEstimatedHours)} hours estimated`,
      icon: '⏱️',
      color: 'orange',
    },
    {
      label: 'CHANNELS',
      value: stats.channelStats.length,
      subtext: 'Unique channels',
      icon: '📺',
      color: 'red',
      animate: true,
    },
  ];

  const colorClasses: Record<string, string> = {
    amber: 'text-[var(--accent-amber)]',
    cyan: 'text-[var(--accent-cyan)]',
    orange: 'text-[var(--accent-orange)]',
    red: 'text-[var(--accent-red)]',
  };

  const glowClasses: Record<string, string> = {
    amber: 'text-glow',
    cyan: 'text-glow-cyan',
    orange: 'text-glow',
    red: 'text-glow',
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="font-['VT323'] text-4xl text-[var(--accent-amber)] text-glow mb-2">
          ▸ PLAYBACK STATISTICS ◂
        </h2>
        <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-[var(--accent-amber)] to-transparent" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className="vhs-card rounded-lg p-6 animate-fade-in-up glitch-hover"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{card.icon}</span>
              <span className="font-['VT323'] text-sm text-[var(--text-secondary)] tracking-wider">
                {card.label}
              </span>
            </div>

            <div className={`stat-number ${colorClasses[card.color]} ${glowClasses[card.color]}`}>
              {card.animate && typeof card.value === 'number' ? (
                <AnimatedNumber value={card.value} />
              ) : (
                card.value
              )}
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {card.subtext}
            </p>
          </div>
        ))}
      </div>

      {/* Top Channel Highlight */}
      {stats.channelStats.length > 0 && (
        <div
          className="vhs-card rounded-lg p-6 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏆</span>
            <span className="font-['VT323'] text-xl text-[var(--accent-amber)]">
              YOUR #1 CHANNEL
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-['VT323'] text-3xl text-[var(--text-primary)] text-glow mb-1">
                {stats.channelStats[0].name}
              </h3>
              <a
                href={stats.channelStats[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent-cyan)] hover:underline"
              >
                View Channel →
              </a>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-['VT323'] text-2xl text-[var(--accent-amber)]">
                  <AnimatedNumber value={stats.channelStats[0].watchCount} />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">videos</div>
              </div>
              <div className="text-center">
                <div className="font-['VT323'] text-2xl text-[var(--accent-orange)]">
                  {formatDuration(stats.channelStats[0].estimatedHours)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">estimated</div>
              </div>
            </div>
          </div>

          {/* Progress bar showing dominance */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>Watch share</span>
              <span>
                {((stats.channelStats[0].watchCount / stats.totalVideos) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
              <div
                className="h-full progress-bar transition-all duration-1000 ease-out"
                style={{
                  width: `${(stats.channelStats[0].watchCount / stats.totalVideos) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
