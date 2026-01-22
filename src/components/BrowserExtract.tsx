import { useState } from 'react';

const EXTRACT_SCRIPT = `// YouTube History Extractor v3
(async () => {
  const entries = [];
  const seen = new Set();
  let lastCount = 0;
  let stableCount = 0;
  let scrollAttempts = 0;
  const maxStable = 15;

  console.log('🎬 YouTube History Extractor v3');
  console.log('📍 URL:', window.location.href);
  console.log('⏳ Starting...');

  const debugSelectors = () => {
    const tests = {
      'a[href*="watch?v="]': document.querySelectorAll('a[href*="watch?v="]').length,
      'ytd-video-renderer': document.querySelectorAll('ytd-video-renderer').length,
      'ytd-rich-item-renderer': document.querySelectorAll('ytd-rich-item-renderer').length,
      'ytd-compact-video-renderer': document.querySelectorAll('ytd-compact-video-renderer').length,
      '#contents ytd-video-renderer': document.querySelectorAll('#contents ytd-video-renderer').length,
    };
    console.log('🔍 Element counts:', tests);
  };
  debugSelectors();

  const collectVideos = () => {
    document.querySelectorAll('a[href*="watch?v="]').forEach(link => {
      const url = link.href?.split('&')[0];
      if (!url || !url.includes('watch?v=') || seen.has(url)) return;

      let container = link;
      for (let i = 0; i < 8; i++) {
        if (!container.parentElement) break;
        container = container.parentElement;
        const tagName = container.tagName?.toLowerCase() || '';
        if (tagName.includes('renderer') || tagName.includes('item')) break;
      }

      let title = '';
      if (link.id === 'video-title' || link.id === 'video-title-link') {
        title = link.textContent?.trim();
      }
      if (!title) {
        const titleEl = container.querySelector('#video-title') ||
                        container.querySelector('[id*="video-title"]') ||
                        container.querySelector('h3') ||
                        container.querySelector('span#video-title') ||
                        container.querySelector('yt-formatted-string#video-title');
        title = titleEl?.textContent?.trim();
      }
      if (!title && link.textContent?.trim().length > 5) {
        title = link.textContent.trim();
      }
      if (!title) title = 'Unknown Title';

      let channelName = '';
      let channelUrl = '';
      const channelLink = container.querySelector('a[href*="/@"]') ||
                          container.querySelector('a[href*="/channel/"]') ||
                          container.querySelector('a[href*="/c/"]') ||
                          container.querySelector('a[href*="/user/"]') ||
                          container.querySelector('#channel-name a') ||
                          container.querySelector('ytd-channel-name a');

      if (channelLink) {
        channelName = channelLink.textContent?.trim() || '';
        channelUrl = channelLink.href || '';
      }

      seen.add(url);
      entries.push({
        header: "YouTube",
        title: "Watched " + title,
        titleUrl: url,
        subtitles: channelName ? [{ name: channelName, url: channelUrl }] : [],
        time: new Date().toISOString()
      });
    });
  };

  collectVideos();
  console.log(\`📺 Initial: \${entries.length} videos found\`);

  while (stableCount < maxStable) {
    scrollAttempts++;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 2500));
    collectVideos();

    if (entries.length === lastCount) {
      stableCount++;
      console.log(\`⏳ No new videos (attempt \${stableCount}/\${maxStable})\`);
      if (stableCount % 3 === 0) {
        window.scrollBy(0, -1000);
        await new Promise(r => setTimeout(r, 800));
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise(r => setTimeout(r, 2500));
        collectVideos();
      }
    } else {
      const newVideos = entries.length - lastCount;
      console.log(\`📺 +\${newVideos} videos (total: \${entries.length}) - scroll #\${scrollAttempts}\`);
      stableCount = 0;
      lastCount = entries.length;
    }
  }

  console.log('');
  console.log('✅ Extraction complete!');
  console.log(\`📊 Total: \${entries.length} videos\`);
  console.log('💾 Downloading...');

  const blob = new Blob([JSON.stringify(entries, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'watch-history.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log('✅ Done! Check downloads folder.');
})();`;

export function BrowserExtract() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXTRACT_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = EXTRACT_SCRIPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    { num: '1', title: 'Open YouTube History', desc: 'Go to youtube.com/feed/history (make sure you\'re signed in)', link: 'https://www.youtube.com/feed/history' },
    { num: '2', title: 'Open Developer Tools', desc: 'Press F12 (Windows/Linux) or Cmd+Option+J (Mac)' },
    { num: '3', title: 'Go to Console Tab', desc: 'Click the "Console" tab at the top of DevTools' },
    { num: '4', title: 'Copy the Script', desc: 'Click the button below to copy the extraction script', action: 'copy' },
    { num: '5', title: 'Paste & Run', desc: 'Paste into the console and press Enter' },
    { num: '6', title: 'Wait for Download', desc: 'The script auto-scrolls and downloads a JSON file when done' },
  ];

  return (
    <div className="yt-card max-w-2xl mx-auto">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="yt-expand-header w-full"
      >
        <div className="flex items-center gap-3">
          <span className="text-[18px]">⚡</span>
          <span className="font-bold text-[13px]">Instant Extract (Browser Script)</span>
          <span className="yt-badge bg-[#1a7a1a] text-white ml-2">RECOMMENDED</span>
        </div>
        <span className={`yt-expand-arrow ${isExpanded ? 'open' : ''}`}>▼</span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
        <div className="p-4 border-t border-[var(--yt-gray-border)]">
          {/* Speed note */}
          <div className="flex items-center gap-2 text-[12px] text-[var(--yt-gray)] mb-4 pb-3 border-b border-[#eee]">
            <span>⏱️</span>
            <span>No waiting for Google — extracts directly from YouTube in minutes</span>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-3 items-start">
                <div className="w-6 h-6 flex items-center justify-center bg-[var(--yt-red)] text-white text-[11px] font-bold rounded-sm flex-shrink-0">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[12px] text-[var(--yt-black)]">{step.title}</div>
                  <div className="text-[11px] text-[var(--yt-gray)]">{step.desc}</div>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--yt-link)] hover:underline"
                    >
                      → Open YouTube History
                    </a>
                  )}
                  {step.action === 'copy' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                      className={`mt-2 w-full py-2 px-4 text-[12px] font-bold transition-all ${
                        copied
                          ? 'bg-[#1a7a1a] text-white'
                          : 'yt-btn yt-btn-primary'
                      }`}
                    >
                      {copied ? '✓ Copied to Clipboard!' : '📋 Copy Script to Clipboard'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Script preview */}
          <details className="mt-4 pt-3 border-t border-[#eee]">
            <summary className="cursor-pointer text-[11px] text-[var(--yt-link)] hover:underline">
              Show script preview
            </summary>
            <pre className="mt-2 p-3 bg-[#f5f5f5] border border-[#ddd] text-[10px] text-[var(--yt-gray-dark)] overflow-x-auto max-h-[150px] overflow-y-auto">
              {EXTRACT_SCRIPT}
            </pre>
          </details>

          {/* Note */}
          <div className="mt-4 pt-3 border-t border-[#eee] text-[11px] text-[var(--yt-gray)]">
            <strong>Note:</strong> This method doesn't capture exact watch dates, so "History Span" will show as recent.
            For historical timestamps, use Google Takeout below.
          </div>
        </div>
      </div>
    </div>
  );
}
