export interface WatchHistoryEntry {
  header: string;
  title: string;
  titleUrl?: string;
  subtitles?: {
    name: string;
    url: string;
    avatar?: string;
  }[];
  time: string;
  type?: 'video' | 'short';
  products?: string[];
  activityControls?: string[];
}

export interface ChannelStats {
  name: string;
  url: string;
  watchCount: number;
  estimatedHours: number;
  avatarUrl?: string;
}

export interface ParsedStats {
  totalVideos: number;
  videoCount: number;
  shortsCount: number;
  totalEstimatedHours: number;
  videoEstimatedHours: number;
  shortsEstimatedHours: number;
  videoChannelCount: number;
  shortsChannelCount: number;
  oldestWatchDate: Date | null;
  channelStats: ChannelStats[];
  videoChannelStats: ChannelStats[];
  shortsChannelStats: ChannelStats[];
}
