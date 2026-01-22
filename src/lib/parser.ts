import { WatchHistoryEntry, ParsedStats, ChannelStats } from '../types';

const AVERAGE_VIDEO_MINUTES = 12;
const AVERAGE_SHORT_MINUTES = 0.5;

type ChannelMap = Map<string, { name: string; url: string; count: number; avatar?: string }>;

function addToChannelMap(map: ChannelMap, channel: { name: string; url: string; avatar?: string }) {
  const key = channel.name.toLowerCase();
  const existing = map.get(key);
  if (existing) {
    existing.count++;
    if (channel.avatar && !existing.avatar) existing.avatar = channel.avatar;
  } else {
    map.set(key, { name: channel.name, url: channel.url, count: 1, avatar: channel.avatar });
  }
}

function mapToStats(map: ChannelMap, avgMinutes: number): ChannelStats[] {
  return Array.from(map.values())
    .map(ch => ({
      name: ch.name,
      url: ch.url,
      watchCount: ch.count,
      estimatedHours: (ch.count * avgMinutes) / 60,
      avatarUrl: ch.avatar,
    }))
    .sort((a, b) => b.watchCount - a.watchCount);
}

export function parseWatchHistory(data: WatchHistoryEntry[]): ParsedStats {
  const videoChannelMap: ChannelMap = new Map();
  const shortsChannelMap: ChannelMap = new Map();
  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;
  let videoCount = 0;
  let shortsCount = 0;

  for (const entry of data) {
    if (entry.header !== 'YouTube' || !entry.titleUrl || !entry.title.startsWith('Watched ')) continue;

    const isShort = entry.type === 'short' || entry.titleUrl.includes('/shorts/');
    isShort ? shortsCount++ : videoCount++;

    const watchDate = new Date(entry.time);
    if (!isNaN(watchDate.getTime())) {
      if (!oldestDate || watchDate < oldestDate) oldestDate = watchDate;
      if (!newestDate || watchDate > newestDate) newestDate = watchDate;
    }

    const channel = entry.subtitles?.[0];
    if (channel?.name) {
      addToChannelMap(isShort ? shortsChannelMap : videoChannelMap, channel);
    }
  }

  const videoEstimatedHours = (videoCount * AVERAGE_VIDEO_MINUTES) / 60;
  const shortsEstimatedHours = (shortsCount * AVERAGE_SHORT_MINUTES) / 60;

  // Only show oldest date if range > 1 day (otherwise it's just scrape timestamps)
  let meaningfulOldestDate: Date | null = null;
  if (oldestDate && newestDate) {
    const diffDays = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 1) meaningfulOldestDate = oldestDate;
  }

  return {
    totalVideos: videoCount + shortsCount,
    videoCount,
    shortsCount,
    totalEstimatedHours: videoEstimatedHours + shortsEstimatedHours,
    videoEstimatedHours,
    shortsEstimatedHours,
    videoChannelCount: videoChannelMap.size,
    shortsChannelCount: shortsChannelMap.size,
    oldestWatchDate: meaningfulOldestDate,
    videoChannelStats: mapToStats(videoChannelMap, AVERAGE_VIDEO_MINUTES),
    shortsChannelStats: mapToStats(shortsChannelMap, AVERAGE_SHORT_MINUTES),
  };
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = hours / 24;
  if (days < 30) return `${days.toFixed(1)} days`;
  return `${(days / 30).toFixed(1)} months`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
