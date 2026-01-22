export interface WatchHistoryEntry {
  header: string;
  title: string;
  titleUrl?: string;
  subtitles?: {
    name: string;
    url: string;
  }[];
  time: string;
  products?: string[];
  activityControls?: string[];
}

export interface ChannelStats {
  name: string;
  url: string;
  watchCount: number;
  estimatedHours: number;
}

export interface ParsedStats {
  totalVideos: number;
  totalEstimatedHours: number;
  oldestWatchDate: Date | null;
  newestWatchDate: Date | null;
  channelStats: ChannelStats[];
}
