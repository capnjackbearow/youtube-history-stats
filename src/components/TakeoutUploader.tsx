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
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`yt-upload-zone ${isDragging ? 'active' : ''}`}
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
          <div className="space-y-3">
            <div className="yt-upload-icon">⏳</div>
            <p className="yt-upload-text">Processing your data...</p>
            <p className="yt-upload-subtext">This may take a moment for large files</p>
          </div>
        ) : (
          <>
            <div className="yt-upload-icon">📁</div>
            <p className="yt-upload-text">Drop your watch-history.json file here</p>
            <p className="yt-upload-subtext">or click to browse your files</p>
            <button className="yt-btn yt-btn-primary mt-4">
              Select File
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-[#fff0f0] border border-[var(--yt-red)] text-[var(--yt-red)] text-[12px]">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
