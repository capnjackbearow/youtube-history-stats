import { useState, useRef, useEffect, forwardRef } from 'react';
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
    if (!shareCardRef.current) {
      console.error('Share card ref not found');
      return;
    }

    setIsGenerating(true);
    try {
      // Wait a bit for fonts to load
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0d0a14',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 600,
        height: 338,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setImageDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isModalOpen) {
      // Reset state when opening
      setImageDataUrl(null);
      setCopyStatus('idle');
      // Generate after a short delay to ensure render
      const timer = setTimeout(generateImage, 300);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleCopyToClipboard = async () => {
    if (!imageDataUrl) {
      console.error('No image to copy');
      return;
    }

    setCopyStatus('copying');
    try {
      // Convert data URL to blob
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();

      // Try clipboard API
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopyStatus('copied');
      } else {
        // Fallback: just trigger download
        handleDownload();
        setCopyStatus('error');
      }
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2500);
    }
  };

  const handleDownload = () => {
    if (!imageDataUrl) {
      console.error('No image to download');
      return;
    }
    const link = document.createElement('a');
    link.download = 'my-youtube-rewind.png';
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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

              {/* Always render the card, but show preview image on top when ready */}
              <div className="share-card-wrapper" style={{ opacity: imageDataUrl ? 0 : 1, position: imageDataUrl ? 'absolute' : 'relative', pointerEvents: 'none' }}>
                <ShareCard
                  ref={shareCardRef}
                  stats={stats}
                  topCreators={top3Creators}
                />
              </div>

              {imageDataUrl && (
                <img src={imageDataUrl} alt="Your YouTube Rewind" className="share-preview-image" />
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

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ stats, topCreators }, ref) => {
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

  return (
    <div ref={ref} className="share-card">
      {/* Background */}
      <div className="share-card-bg"></div>

      {/* Content - horizontal layout */}
      <div className="share-card-content">
        {/* Left side - Stats */}
        <div className="share-left">
          <div className="share-badge">MY YOUTUBE REWIND</div>

          <div className="share-main-stat">
            <span className="share-number">{stats.totalVideos.toLocaleString()}</span>
            <span className="share-label">videos & shorts watched</span>
          </div>

          <div className="share-time">
            <span className="share-time-value">{formatDuration(stats.totalEstimatedHours)}</span>
            <span className="share-time-label">of my life</span>
          </div>

          <div className="share-url">youtube-history-stats.vercel.app</div>
        </div>

        {/* Right side - Top Creators */}
        <div className="share-right">
          <div className="share-creators-title">TOP CREATORS</div>

          <div className="share-creators">
            {topCreators.map((creator, idx) => (
              <div key={creator.name} className="share-creator">
                <div
                  className="share-creator-rank"
                  style={{ color: rankColors[idx] }}
                >
                  #{idx + 1}
                </div>
                <div className="share-creator-info">
                  <span className="share-creator-name">{creator.name}</span>
                  <span className="share-creator-count">{creator.watchCount.toLocaleString()} Videos Watched</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
