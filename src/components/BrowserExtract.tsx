import { useState } from 'react';

const EXTRACT_SCRIPT = `// YouTube History Extractor v5
(async () => {
  const entries = [];
  const seen = new Set();
  let lastCount = 0;
  let stableCount = 0;
  let running = true;
  let lastSaveCount = 0;
  const SAVE_INTERVAL = 1000;
  const startTime = Date.now();

  // Stop function - type stop() in console
  window.stop = () => {
    running = false;
    console.log('🛑 Stopping... will download shortly');
  };

  // Resume function - paste previous JSON to continue where you left off
  window.resume = (prevData) => {
    if (!Array.isArray(prevData)) {
      console.log('❌ Invalid data. Use: resume(JSON.parse(\\'[paste your JSON here]\\'))');
      return;
    }
    let added = 0;
    prevData.forEach(entry => {
      if (entry.titleUrl && !seen.has(entry.titleUrl)) {
        seen.add(entry.titleUrl);
        entries.push(entry);
        added++;
      }
    });
    lastSaveCount = entries.length;
    console.log(\`✅ Loaded \${added} previous videos. Total: \${entries.length}\`);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'watch-history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  console.log('🎬 YouTube History Extractor v5');
  console.log('');
  console.log('📍 Commands:');
  console.log('   stop()  - Stop and download');
  console.log('   resume(data) - Load previous export first');
  console.log('');
  console.log('💡 To resume: Open previous JSON, copy contents,');
  console.log('   then run: resume(JSON.parse(\\'<paste here>\\'))');
  console.log('');
  console.log('⏳ Starting in 3s... (run resume() now if needed)');
  await new Promise(r => setTimeout(r, 3000));
  console.log('🚀 Scrolling...\\n');

  const collectVideos = () => {
    document.querySelectorAll('a[href*="watch?v="], a[href*="/shorts/"]').forEach(link => {
      const url = link.href?.split('&')[0];
      if (!url || seen.has(url)) return;
      if (!url.includes('watch?v=') && !url.includes('/shorts/')) return;

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
        const titleEl = container.querySelector('#video-title, [id*="video-title"], h3, span#video-title');
        title = titleEl?.textContent?.trim();
      }
      if (!title && link.textContent?.trim().length > 5) {
        title = link.textContent.trim();
      }
      if (!title) title = 'Unknown Title';

      let channelName = '';
      let channelUrl = '';
      const channelLink = container.querySelector('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], #channel-name a');
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
  console.log(\`📺 Initial: \${entries.length} videos\\n\`);

  while (running && stableCount < 10) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 1200));
    collectVideos();

    // Auto-save checkpoint
    if (entries.length - lastSaveCount >= SAVE_INTERVAL) {
      console.log(\`💾 Auto-saving checkpoint (\${entries.length} videos)...\`);
      download();
      lastSaveCount = entries.length;
    }

    if (entries.length === lastCount) {
      stableCount++;
      if (stableCount >= 3) {
        window.scrollBy(0, -500);
        await new Promise(r => setTimeout(r, 400));
        window.scrollTo(0, document.documentElement.scrollHeight);
      }
    } else {
      const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
      console.log(\`📺 \${entries.length.toLocaleString()} videos (\${elapsed} min)\`);
      stableCount = 0;
      lastCount = entries.length;
    }
  }

  const totalTime = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(\`\\n✅ Done! \${entries.length.toLocaleString()} videos in \${totalTime} min\`);
  console.log('💾 Downloading...');
  download();
  delete window.stop;
  delete window.resume;
})();`;

// Create minified bookmarklet
const BOOKMARKLET = `javascript:(function(){${encodeURIComponent(EXTRACT_SCRIPT.replace(/\s+/g, ' '))}})()`;

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

  return (
    <div className="yt-card max-w-2xl mx-auto">
      {/* Main Extract Section */}
      <div className="p-4">
        <div className="text-center mb-4">
          <h3 className="font-bold text-[14px] text-[var(--yt-black)] mb-1">⚡ Quick Extract</h3>
          <p className="text-[12px] text-[var(--yt-gray)]">Two simple steps to get your watch history</p>
        </div>

        {/* Two-step process */}
        <div className="space-y-3 mb-4">
          {/* Step 1: Drag bookmarklet */}
          <div className="flex gap-3 items-start p-3 bg-[#f9f9f9] border border-[#eee] rounded">
            <div className="w-6 h-6 flex items-center justify-center bg-[var(--yt-red)] text-white text-[11px] font-bold rounded-sm flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <div className="font-bold text-[12px] text-[var(--yt-black)]">Drag this to your bookmarks bar:</div>
              <a
                href={BOOKMARKLET}
                onClick={(e) => e.preventDefault()}
                draggable="true"
                className="inline-block mt-2 px-4 py-2 bg-gradient-to-b from-[#f8f8f8] to-[#e8e8e8] border border-[#ccc] rounded text-[12px] font-bold text-[var(--yt-black)] cursor-move hover:from-[#fff] hover:to-[#f0f0f0] shadow-sm"
              >
                📺 Extract YT History
              </a>
              <p className="text-[10px] text-[var(--yt-gray)] mt-1">Drag the button above to your bookmarks bar (one-time setup)</p>
            </div>
          </div>

          {/* Step 2: Go to YouTube and click */}
          <div className="flex gap-3 items-start p-3 bg-[#f9f9f9] border border-[#eee] rounded">
            <div className="w-6 h-6 flex items-center justify-center bg-[var(--yt-red)] text-white text-[11px] font-bold rounded-sm flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <div className="font-bold text-[12px] text-[var(--yt-black)]">Open YouTube History, then click the bookmarklet</div>
              <a
                href="https://www.youtube.com/feed/history"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 yt-btn yt-btn-primary text-[12px]"
              >
                Open YouTube History →
              </a>
              <p className="text-[10px] text-[var(--yt-gray)] mt-1">Once there, click "Extract YT History" in your bookmarks bar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable manual method */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="yt-expand-header w-full border-t border-[var(--yt-gray-border)]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--yt-gray)]">Alternative: Manual console method</span>
        </div>
        <span className={`yt-expand-arrow ${isExpanded ? 'open' : ''}`}>▼</span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[700px]' : 'max-h-0'}`}>
        <div className="p-4 border-t border-[var(--yt-gray-border)] bg-[#fafafa]">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 flex items-center justify-center bg-[var(--yt-gray)] text-white text-[10px] font-bold rounded-sm flex-shrink-0">1</div>
              <div className="text-[11px]">
                <span className="font-bold">Open </span>
                <a href="https://www.youtube.com/feed/history" target="_blank" rel="noopener noreferrer" className="text-[var(--yt-link)] hover:underline">youtube.com/feed/history</a>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 flex items-center justify-center bg-[var(--yt-gray)] text-white text-[10px] font-bold rounded-sm flex-shrink-0">2</div>
              <div className="text-[11px]"><span className="font-bold">Open DevTools:</span> F12 or Cmd+Option+J</div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 flex items-center justify-center bg-[var(--yt-gray)] text-white text-[10px] font-bold rounded-sm flex-shrink-0">3</div>
              <div className="text-[11px]"><span className="font-bold">Go to Console tab</span></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 flex items-center justify-center bg-[var(--yt-gray)] text-white text-[10px] font-bold rounded-sm flex-shrink-0">4</div>
              <div className="flex-1">
                <span className="text-[11px] font-bold">Paste script & run</span>
                <button
                  onClick={handleCopy}
                  className={`mt-2 w-full py-2 px-4 text-[11px] font-bold transition-all ${
                    copied ? 'bg-[#1a7a1a] text-white' : 'yt-btn'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Script'}
                </button>
              </div>
            </div>
          </div>

          {/* Script preview */}
          <details className="mt-4 pt-3 border-t border-[#eee]">
            <summary className="cursor-pointer text-[11px] text-[var(--yt-link)] hover:underline">
              View full script
            </summary>
            <pre className="mt-2 p-3 bg-[#f5f5f5] border border-[#ddd] text-[10px] text-[var(--yt-gray-dark)] overflow-x-auto max-h-[150px] overflow-y-auto">
              {EXTRACT_SCRIPT}
            </pre>
          </details>

          {/* Commands */}
          <div className="mt-3 pt-3 border-t border-[#eee] text-[10px] text-[var(--yt-gray)]">
            <strong>Console commands:</strong> <code className="bg-[#f0f0f0] px-1">stop()</code> to download early, <code className="bg-[#f0f0f0] px-1">resume(data)</code> to continue previous export
          </div>
        </div>
      </div>
    </div>
  );
}
