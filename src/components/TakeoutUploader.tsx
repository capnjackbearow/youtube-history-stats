import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { WatchHistoryEntry } from '../types';

interface TakeoutUploaderProps {
  onDataLoaded: (data: WatchHistoryEntry[]) => void;
}

export function TakeoutUploader({ onDataLoaded }: TakeoutUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      setIsLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setError('Invalid format: Expected an array of watch history entries');
        setIsLoading(false);
        return;
      }

      // Basic validation - check if it looks like YouTube watch history
      const hasYouTubeEntries = data.some(
        (entry: WatchHistoryEntry) => entry.header === 'YouTube'
      );

      if (!hasYouTubeEntries) {
        setError('This doesn\'t appear to be YouTube watch history data');
        setIsLoading(false);
        return;
      }

      onDataLoaded(data);
    } catch {
      setError('Failed to parse JSON file. Make sure it\'s valid JSON.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`drop-zone rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragging ? 'active' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isLoading ? (
          <div className="space-y-4">
            <div className="inline-block">
              <svg
                className="animate-spin h-12 w-12 text-[var(--accent-amber)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="font-['VT323'] text-2xl text-[var(--accent-amber)]">
              LOADING DATA...
            </p>
          </div>
        ) : (
          <>
            {/* VHS Tape Icon */}
            <div className="mb-6 inline-block">
              <div className="vhs-tape w-32 h-20 rounded-md mx-auto relative">
                <div className="absolute inset-4 flex items-center justify-center">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full border-4 border-[var(--accent-amber)] opacity-60" />
                    <div className="w-6 h-6 rounded-full border-4 border-[var(--accent-amber)] opacity-60" />
                  </div>
                </div>
                <div className="absolute bottom-1 left-2 right-2 h-2 bg-gradient-to-r from-[var(--accent-amber)] via-[var(--accent-orange)] to-[var(--accent-red)] opacity-80" />
              </div>
            </div>

            <h3 className="font-['VT323'] text-3xl text-[var(--text-primary)] mb-2">
              DROP YOUR WATCH HISTORY
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Drag & drop your <code className="text-[var(--accent-cyan)] bg-[var(--bg-elevated)] px-2 py-1 rounded">watch-history.json</code> file here
            </p>
            <p className="text-[var(--text-secondary)] text-xs">
              or click to browse
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-lg">
          <p className="font-['VT323'] text-xl text-[var(--accent-red)]">
            ERROR: {error}
          </p>
        </div>
      )}
    </div>
  );
}
