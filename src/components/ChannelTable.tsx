import { useState, useMemo } from 'react';
import { ChannelStats } from '../types';
import { formatDuration } from '../lib/parser';

interface ChannelTableProps {
  channels: ChannelStats[];
  totalVideos: number;
}

type SortField = 'rank' | 'name' | 'watchCount' | 'estimatedHours';
type SortDirection = 'asc' | 'desc';

export function ChannelTable({ channels, totalVideos }: ChannelTableProps) {
  const [sortField, setSortField] = useState<SortField>('watchCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(25);

  const filteredAndSortedChannels = useMemo(() => {
    let result = [...channels];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ch => ch.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'watchCount':
          comparison = a.watchCount - b.watchCount;
          break;
        case 'estimatedHours':
          comparison = a.estimatedHours - b.estimatedHours;
          break;
        default:
          comparison = channels.indexOf(a) - channels.indexOf(b);
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [channels, sortField, sortDirection, searchQuery]);

  const visibleChannels = filteredAndSortedChannels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedChannels.length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-[var(--text-secondary)] opacity-30 ml-1">⬍</span>;
    }
    return (
      <span className="text-[var(--accent-amber)] ml-1">
        {sortDirection === 'desc' ? '▼' : '▲'}
      </span>
    );
  };

  const getRankDisplay = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="font-['VT323'] text-2xl text-[var(--accent-amber)]">
            CHANNEL BREAKDOWN
          </h2>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-[var(--bg-card)] border border-[var(--accent-amber)]/30 rounded px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            🔍
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="vhs-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="retro-table w-full">
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
                  onClick={() => handleSort('rank')}
                >
                  RANK <SortIcon field="rank" />
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  CHANNEL <SortIcon field="name" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
                  onClick={() => handleSort('watchCount')}
                >
                  VIDEOS <SortIcon field="watchCount" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
                  onClick={() => handleSort('estimatedHours')}
                >
                  TIME <SortIcon field="estimatedHours" />
                </th>
                <th className="px-4 py-3 text-right">SHARE</th>
              </tr>
            </thead>
            <tbody>
              {visibleChannels.map((channel, index) => {
                const originalIndex = channels.indexOf(channel);
                const percentage = (channel.watchCount / totalVideos) * 100;

                return (
                  <tr
                    key={channel.url}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`rank-badge ${originalIndex < 3 ? 'top-3' : 'text-[var(--text-secondary)]'}`}
                      >
                        {getRankDisplay(originalIndex)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-primary)] hover:text-[var(--accent-cyan)] transition-colors group"
                      >
                        <span className="group-hover:underline">{channel.name}</span>
                        <span className="text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 ml-1 transition-opacity">
                          →
                        </span>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right font-['VT323'] text-lg text-[var(--accent-amber)]">
                      {channel.watchCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-['VT323'] text-lg text-[var(--accent-orange)]">
                      {formatDuration(channel.estimatedHours)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                          <div
                            className="h-full progress-bar"
                            style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="p-4 text-center border-t border-[var(--accent-amber)]/20">
            <button
              onClick={() => setVisibleCount(c => c + 25)}
              className="retro-btn"
            >
              LOAD MORE ({filteredAndSortedChannels.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredAndSortedChannels.length === 0 && (
          <div className="p-8 text-center">
            <p className="font-['VT323'] text-xl text-[var(--text-secondary)]">
              NO CHANNELS FOUND
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
        Showing {visibleChannels.length} of {filteredAndSortedChannels.length} channels
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
    </div>
  );
}
