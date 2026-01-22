import { WatchHistoryEntry, ParsedStats, ChannelStats } from '../types';

const AVERAGE_VIDEO_DURATION_MINUTES = 10;

export function parseWatchHistory(data: WatchHistoryEntry[]): ParsedStats {
  const channelMap = new Map<string, { name: string; url: string; count: number }>();

  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;
  let validVideoCount = 0;

  for (const entry of data) {
    // Skip non-YouTube entries or entries without proper data
    if (entry.header !== 'YouTube') continue;

    // Skip ads and other non-video entries
    if (!entry.titleUrl || !entry.title.startsWith('Watched ')) continue;

    validVideoCount++;

    // Parse the timestamp
    const watchDate = new Date(entry.time);
    if (!isNaN(watchDate.getTime())) {
      if (!oldestDate || watchDate < oldestDate) {
        oldestDate = watchDate;
      }
      if (!newestDate || watchDate > newestDate) {
        newestDate = watchDate;
      }
    }

    // Extract channel info
    if (entry.subtitles && entry.subtitles.length > 0) {
      const channel = entry.subtitles[0];
      const existing = channelMap.get(channel.url);

      if (existing) {
        existing.count++;
      } else {
        channelMap.set(channel.url, {
          name: channel.name,
          url: channel.url,
          count: 1,
        });
      }
    }
  }

  // Convert channel map to sorted array
  const channelStats: ChannelStats[] = Array.from(channelMap.values())
    .map(ch => ({
      name: ch.name,
      url: ch.url,
      watchCount: ch.count,
      estimatedHours: (ch.count * AVERAGE_VIDEO_DURATION_MINUTES) / 60,
    }))
    .sort((a, b) => b.watchCount - a.watchCount);

  const totalEstimatedHours = (validVideoCount * AVERAGE_VIDEO_DURATION_MINUTES) / 60;

  return {
    totalVideos: validVideoCount,
    totalEstimatedHours,
    oldestWatchDate: oldestDate,
    newestWatchDate: newestDate,
    channelStats,
  };
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }
  const days = hours / 24;
  if (days < 30) {
    return `${days.toFixed(1)} days`;
  }
  const months = days / 30;
  return `${months.toFixed(1)} months`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function calculateAccountAge(oldestDate: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - oldestDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 30) {
    return `${Math.round(diffDays)} days`;
  }

  const diffMonths = diffDays / 30;
  if (diffMonths < 12) {
    return `${Math.round(diffMonths)} months`;
  }

  const diffYears = diffDays / 365;
  const years = Math.floor(diffYears);
  const remainingMonths = Math.round((diffYears - years) * 12);

  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}
