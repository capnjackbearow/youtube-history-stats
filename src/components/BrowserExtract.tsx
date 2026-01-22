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
    { num: '6', title: 'Wait or Stop Early', desc: 'Auto-saves every 1000 videos. Type stop() to finish early and download.' },
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
        </div>
        <span className={`yt-expand-arrow ${isExpanded ? 'open' : ''}`}>▼</span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[900px]' : 'max-h-0'}`}>
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
          <div className="mt-4 pt-3 border-t border-[#eee] text-[11px] text-[var(--yt-gray)] space-y-2">
            <p><strong>Commands:</strong></p>
            <p>• <code className="bg-[#f0f0f0] px-1">stop()</code> — Stop early and download what's collected</p>
            <p>• <code className="bg-[#f0f0f0] px-1">resume(data)</code> — Load a previous export before scrolling starts</p>
            <p className="pt-1 text-[10px]">To resume: Open your previous JSON, copy the contents, then run <code className="bg-[#f0f0f0] px-1">resume(JSON.parse('...'))</code> within the first 3 seconds.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
