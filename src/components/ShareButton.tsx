import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { ParsedStats, ChannelStats } from '../types';
import { formatDuration } from '../lib/parser';

interface ShareButtonProps {
  stats: ParsedStats;
}

export function ShareButton({ stats }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const shareCardRef = useRef<HTMLDivElement>(null);

  const top3Creators = stats.videoChannelStats.slice(0, 3);

  const generateImage = async () => {
    if (!shareCardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setImageDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isModalOpen && !imageDataUrl) {
      // Small delay to ensure the card is rendered
      const timer = setTimeout(generateImage, 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleCopyToClipboard = async () => {
    if (!imageDataUrl) return;

    setCopyStatus('copying');
    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    link.download = 'youtube-rewind.png';
    link.href = imageDataUrl;
    link.click();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setImageDataUrl(null);
    setCopyStatus('idle');
  };

  return (
    <>
      <button className="share-button" onClick={() => setIsModalOpen(true)}>
        <span className="share-icon">↗</span>
        <span>Share Your Rewind</span>
      </button>

      {isModalOpen && (
        <div className="share-modal-overlay" onClick={closeModal}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>

            <div className="modal-header">
              <h2>Share Your YouTube Rewind</h2>
              <p>Show off your viewing stats!</p>
            </div>

            <div className="share-preview-container">
              {isGenerating && (
                <div className="generating-overlay">
                  <div className="generating-spinner"></div>
                  <span>Generating image...</span>
                </div>
              )}

              {imageDataUrl ? (
                <img src={imageDataUrl} alt="Your YouTube Rewind" className="share-preview-image" />
              ) : (
                <div className="share-card-wrapper">
                  <ShareCard
                    ref={shareCardRef}
                    stats={stats}
                    topCreators={top3Creators}
                  />
                </div>
              )}
            </div>

            <div className="share-actions">
              <button
                className={`share-action-btn primary ${copyStatus === 'copied' ? 'success' : ''}`}
                onClick={handleCopyToClipboard}
                disabled={!imageDataUrl || copyStatus === 'copying'}
              >
                {copyStatus === 'copying' ? (
                  <>
                    <span className="btn-spinner"></span>
                    Copying...
                  </>
                ) : copyStatus === 'copied' ? (
                  <>
                    <span className="btn-check">✓</span>
                    Copied!
                  </>
                ) : copyStatus === 'error' ? (
                  <>
                    <span className="btn-x">✕</span>
                    Failed - Try Download
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📋</span>
                    Copy to Share
                  </>
                )}
              </button>

              <button
                className="share-action-btn secondary"
                onClick={handleDownload}
                disabled={!imageDataUrl}
              >
                <span className="btn-icon">⬇</span>
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ShareCardProps {
  stats: ParsedStats;
  topCreators: ChannelStats[];
}

import { forwardRef } from 'react';

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ stats, topCreators }, ref) => {
  return (
    <div ref={ref} className="share-card">
      {/* Background effects */}
      <div className="share-card-bg">
        <div className="share-glow share-glow-1"></div>
        <div className="share-glow share-glow-2"></div>
        <div className="share-glow share-glow-3"></div>
        <div className="share-noise"></div>
        <div className="share-scanlines"></div>
      </div>

      {/* Content */}
      <div className="share-card-content">
        {/* Header badge */}
        <div className="share-badge">MY YOUTUBE REWIND</div>

        {/* Main stat */}
        <div className="share-main-stat">
          <span className="share-number">{stats.totalVideos.toLocaleString()}</span>
          <span className="share-label">total videos & shorts watched</span>
        </div>

        {/* Time spent */}
        <div className="share-time">
          <span className="share-time-value">{formatDuration(stats.totalEstimatedHours)}</span>
          <span className="share-time-label">of my life</span>
        </div>

        {/* Divider */}
        <div className="share-divider">
          <div className="share-divider-line"></div>
          <span className="share-divider-text">TOP CREATORS</span>
          <div className="share-divider-line"></div>
        </div>

        {/* Top 3 creators */}
        <div className="share-creators">
          {topCreators.map((creator, idx) => (
            <div key={creator.name} className="share-creator">
              <div className="share-creator-rank">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
              <div className="share-creator-info">
                <span className="share-creator-name">{creator.name}</span>
                <span className="share-creator-count">{creator.watchCount.toLocaleString()} videos</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="share-footer">
          <span className="share-url">youtube-history-stats.vercel.app</span>
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
