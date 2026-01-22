import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { WatchHistoryEntry } from '../types';

interface TakeoutUploaderProps {
  onDataLoaded: (data: WatchHistoryEntry[]) => void;
}

export function TakeoutUploader({ onDataLoaded }: TakeoutUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    setError(null);
    setIsLoading(true);
    setFileCount(files.length);

    const allEntries: WatchHistoryEntry[] = [];
    const seenUrls = new Set<string>();

    try {
      for (const file of Array.from(files)) {
        if (!file.name.endsWith('.json')) continue;

        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) continue;

        for (const entry of data) {
          if (entry.header === 'YouTube' && entry.titleUrl) {
            if (!seenUrls.has(entry.titleUrl)) {
              seenUrls.add(entry.titleUrl);
              allEntries.push(entry);
            }
          }
        }
      }

      if (allEntries.length === 0) {
        setError('No valid YouTube watch history found in the uploaded files');
        setIsLoading(false);
        return;
      }

      onDataLoaded(allEntries);
    } catch {
      setError('Failed to parse JSON files. Make sure they\'re valid JSON.');
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
      processFiles(files);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="uploader-container">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="upload-content">
          {isLoading ? (
            <>
              <div className="upload-icon spinning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </div>
              <div className="upload-title">Processing {fileCount} file{fileCount > 1 ? 's' : ''}...</div>
              <div className="upload-subtitle">Merging and deduplicating entries</div>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 16v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="upload-title">Drop your watch-history.json here</div>
              <div className="upload-subtitle">or click to browse</div>
              <div className="upload-hint">
                <code>watch-history.json</code>
              </div>
              <button type="button" className="upload-btn">
                Select Files
              </button>
            </>
          )}
        </div>

        <div className="upload-glow" />
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
