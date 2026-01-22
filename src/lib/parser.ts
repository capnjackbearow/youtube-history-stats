import { WatchHistoryEntry, ParsedStats, ChannelStats } from '../types';

const AVERAGE_VIDEO_DURATION_MINUTES = 12;
const AVERAGE_SHORT_DURATION_MINUTES = 0.5; // 30 seconds

export function parseWatchHistory(data: WatchHistoryEntry[]): ParsedStats {
  const channelMap = new Map<string, { name: string; url: string; count: number; avatar?: string }>();
  const videoChannelMap = new Map<string, { name: string; url: string; count: number; avatar?: string }>();
  const shortsChannelMap = new Map<string, { name: string; url: string; count: number; avatar?: string }>();
  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;
  let videoCount = 0;
  let shortsCount = 0;

  for (const entry of data) {
    if (entry.header !== 'YouTube') continue;
    if (!entry.titleUrl || !entry.title.startsWith('Watched ')) continue;

    // Determine type: use explicit type field, or fallback to URL detection
    const isShort = entry.type === 'short' || entry.titleUrl.includes('/shorts/');

    if (isShort) {
      shortsCount++;
    } else {
      videoCount++;
    }

    const watchDate = new Date(entry.time);
    if (!isNaN(watchDate.getTime())) {
      if (!oldestDate || watchDate < oldestDate) {
        oldestDate = watchDate;
      }
      if (!newestDate || watchDate > newestDate) {
        newestDate = watchDate;
      }
    }

    if (entry.subtitles && entry.subtitles.length > 0 && entry.subtitles[0].name) {
      const channel = entry.subtitles[0];
      const key = channel.name.toLowerCase();
      const avatar = channel.avatar;

      // Add to combined map
      const existing = channelMap.get(key);
      if (existing) {
        existing.count++;
        if (avatar && !existing.avatar) existing.avatar = avatar;
      } else {
        channelMap.set(key, { name: channel.name, url: channel.url, count: 1, avatar });
      }

      // Add to type-specific map
      const typeMap = isShort ? shortsChannelMap : videoChannelMap;
      const typeExisting = typeMap.get(key);
      if (typeExisting) {
        typeExisting.count++;
        if (avatar && !typeExisting.avatar) typeExisting.avatar = avatar;
      } else {
        typeMap.set(key, { name: channel.name, url: channel.url, count: 1, avatar });
      }
    }
  }

  const channelStats: ChannelStats[] = Array.from(channelMap.values())
    .map(ch => ({
      name: ch.name,
      url: ch.url,
      watchCount: ch.count,
      estimatedHours: (ch.count * AVERAGE_VIDEO_DURATION_MINUTES) / 60,
      avatarUrl: ch.avatar,
    }))
    .sort((a, b) => b.watchCount - a.watchCount);

  const videoChannelStats: ChannelStats[] = Array.from(videoChannelMap.values())
    .map(ch => ({
      name: ch.name,
      url: ch.url,
      watchCount: ch.count,
      estimatedHours: (ch.count * AVERAGE_VIDEO_DURATION_MINUTES) / 60,
      avatarUrl: ch.avatar,
    }))
    .sort((a, b) => b.watchCount - a.watchCount);

  const shortsChannelStats: ChannelStats[] = Array.from(shortsChannelMap.values())
    .map(ch => ({
      name: ch.name,
      url: ch.url,
      watchCount: ch.count,
      estimatedHours: (ch.count * AVERAGE_SHORT_DURATION_MINUTES) / 60,
      avatarUrl: ch.avatar,
    }))
    .sort((a, b) => b.watchCount - a.watchCount);

  const totalVideos = videoCount + shortsCount;
  const videoEstimatedHours = (videoCount * AVERAGE_VIDEO_DURATION_MINUTES) / 60;
  const shortsEstimatedHours = (shortsCount * AVERAGE_SHORT_DURATION_MINUTES) / 60;

  // Check if dates have meaningful range (more than 1 day apart)
  // If all dates are within 1 day, they're likely scrape timestamps, not actual watch dates
  let meaningfulOldestDate: Date | null = null;
  if (oldestDate && newestDate) {
    const diffMs = newestDate.getTime() - oldestDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 1) {
      meaningfulOldestDate = oldestDate;
    }
  }

  return {
    totalVideos,
    videoCount,
    shortsCount,
    totalEstimatedHours: videoEstimatedHours + shortsEstimatedHours,
    videoEstimatedHours,
    shortsEstimatedHours,
    videoChannelCount: videoChannelMap.size,
    shortsChannelCount: shortsChannelMap.size,
    oldestWatchDate: meaningfulOldestDate,
    channelStats,
    videoChannelStats,
    shortsChannelStats,
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
