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

  // Debug: Show what elements exist on the page
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
    // Strategy: Find ALL links to videos, then get context from parent elements
    document.querySelectorAll('a[href*="watch?v="]').forEach(link => {
      const url = link.href?.split('&')[0]; // Clean URL, remove extra params
      if (!url || !url.includes('watch?v=') || seen.has(url)) return;

      // Walk up to find the video container (usually 3-5 levels up)
      let container = link;
      for (let i = 0; i < 8; i++) {
        if (!container.parentElement) break;
        container = container.parentElement;

        // Check if this looks like a video container
        const tagName = container.tagName?.toLowerCase() || '';
        if (tagName.includes('renderer') || tagName.includes('item')) break;
      }

      // Get title - try the link text first, then search nearby
      let title = '';

      // Check if this link IS the title link
      if (link.id === 'video-title' || link.id === 'video-title-link') {
        title = link.textContent?.trim();
      }

      // Otherwise search for title in container
      if (!title) {
        const titleEl = container.querySelector('#video-title') ||
                        container.querySelector('[id*="video-title"]') ||
                        container.querySelector('h3') ||
                        container.querySelector('span#video-title') ||
                        container.querySelector('yt-formatted-string#video-title');
        title = titleEl?.textContent?.trim();
      }

      // Last resort: use link text if it's substantial
      if (!title && link.textContent?.trim().length > 5) {
        title = link.textContent.trim();
      }

      if (!title) title = 'Unknown Title';

      // Get channel - search in container and nearby
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

      // Skip if we already have this exact entry
      seen.add(url);

      entries.push({
        header: "YouTube",
        title: "Watched " + title,
        titleUrl: url,
        subtitles: channelName ? [{
          name: channelName,
          url: channelUrl
        }] : [],
        time: new Date().toISOString()
      });
    });
  };

  // Initial collection
  collectVideos();
  console.log(\`📺 Initial: \${entries.length} videos found\`);

  while (stableCount < maxStable) {
    scrollAttempts++;

    // Scroll down
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 2500));

    // Collect videos
    collectVideos();

    // Check progress
    if (entries.length === lastCount) {
      stableCount++;
      console.log(\`⏳ No new videos (attempt \${stableCount}/\${maxStable})\`);

      // Try to trigger more loading
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
    } catch (err) {
      // Fallback for older browsers
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
    {
      num: '01',
      title: 'Open YouTube History',
      desc: 'Go to youtube.com/feed/history in your browser (make sure you\'re signed in)',
      link: 'https://www.youtube.com/feed/history',
    },
    {
      num: '02',
      title: 'Open Developer Tools',
      desc: 'Press F12 (Windows/Linux) or Cmd+Option+J (Mac) to open DevTools',
    },
    {
      num: '03',
      title: 'Go to Console Tab',
      desc: 'Click the "Console" tab at the top of the DevTools panel',
    },
    {
      num: '04',
      title: 'Copy the Script',
      desc: 'Click the button below to copy the extraction script',
      action: 'copy',
    },
    {
      num: '05',
      title: 'Paste & Run',
      desc: 'Paste (Ctrl+V / Cmd+V) into the console and press Enter',
    },
    {
      num: '06',
      title: 'Wait for Completion',
      desc: 'The script will auto-scroll and collect your history. A JSON file will download when done.',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="vhs-card rounded-lg p-4 flex items-center justify-between glitch-hover border-[var(--accent-cyan)]/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <span className="font-['VT323'] text-xl text-[var(--text-primary)]">
                INSTANT EXTRACT
              </span>
              <span className="ml-2 text-xs text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-2 py-0.5 rounded">
                RECOMMENDED
              </span>
            </div>
          </div>
          <span
            className={`text-[var(--accent-cyan)] transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="vhs-card rounded-lg mt-2 p-6 space-y-4 border-[var(--accent-cyan)]/20">
          {/* Speed badge */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--accent-cyan)]">⏱️</span>
            <span className="text-[var(--text-secondary)]">
              No waiting for Google — extracts directly from YouTube in minutes
            </span>
          </div>

          {/* Steps */}
          {steps.map((step, index) => (
            <div
              key={step.num}
              className="flex gap-4 items-start animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[var(--accent-cyan)]/30 rounded bg-[var(--bg-elevated)] font-['VT323'] text-lg text-[var(--accent-cyan)]">
                {step.num}
              </div>
              <div className="flex-1">
                <h4 className="font-['VT323'] text-lg text-[var(--accent-cyan)]">
                  {step.title}
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {step.desc}
                </p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-[var(--accent-cyan)] hover:underline"
                  >
                    → Open YouTube History
                  </a>
                )}
                {step.action === 'copy' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    className={`mt-3 w-full py-3 px-4 rounded font-['VT323'] text-xl tracking-wider transition-all duration-200 ${
                      copied
                        ? 'bg-[var(--accent-cyan)] text-[var(--bg-dark)]'
                        : 'bg-[var(--accent-cyan)]/10 border-2 border-[var(--accent-cyan)] text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)] hover:text-[var(--bg-dark)]'
                    }`}
                  >
                    {copied ? '✓ COPIED TO CLIPBOARD!' : '📋 COPY SCRIPT TO CLIPBOARD'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Script preview */}
          <div className="pt-4 border-t border-[var(--accent-cyan)]/20">
            <details className="group">
              <summary className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors">
                <span className="group-open:hidden">▸ Show script preview</span>
                <span className="hidden group-open:inline">▾ Hide script preview</span>
              </summary>
              <pre className="mt-3 p-4 bg-[var(--bg-dark)] rounded text-xs text-[var(--text-secondary)] overflow-x-auto max-h-48 overflow-y-auto">
                {EXTRACT_SCRIPT}
              </pre>
            </details>
          </div>

          {/* Note */}
          <div className="pt-4 border-t border-[var(--accent-cyan)]/20">
            <p className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
              <span className="text-[var(--accent-amber)]">⚠️</span>
              <span>
                <strong className="text-[var(--text-primary)]">Note:</strong> This method doesn't capture exact watch dates,
                so "Account Age" will show as recent. For historical timestamps, use the Google Takeout method below.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
