import { useState } from 'react';

const EXTRACT_SCRIPT = `// YouTube History Extractor v7 - Memory Safe
(async () => {
  const STORAGE_KEY = 'yt_history_extract';
  const entries = [];
  const seen = new Set();
  let lastCount = 0;
  let stableCount = 0;
  let running = true;
  let lastSaveCount = 0;
  let sessionStart = 0;
  const SAVE_INTERVAL = 250;
  const BATCH_LIMIT = 5000; // Pause for refresh after this many new videos
  const startTime = Date.now();

  // Load from localStorage
  const loadSaved = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        let added = 0;
        data.forEach(entry => {
          if (entry.titleUrl && !seen.has(entry.titleUrl)) {
            seen.add(entry.titleUrl);
            entries.push(entry);
            added++;
          }
        });
        if (added > 0) {
          console.log(\`✅ Loaded \${added.toLocaleString()} videos from previous session\`);
          lastSaveCount = entries.length;
          sessionStart = entries.length;
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.log('⚠️ localStorage full, downloading backup...');
      download();
    }
  };

  // Download file
  const download = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'watch-history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Stop and save
  window.stop = () => {
    running = false;
    console.log('🛑 Stopping...');
  };

  // Clear saved data to start fresh
  window.clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared saved data. Refresh page and run again to start fresh.');
  };

  // Manual download
  window.download = download;

  console.log('🎬 YouTube History Extractor v7');
  console.log('');
  console.log('📍 Commands:');
  console.log('   stop()     - Pause and save');
  console.log('   download() - Download JSON file');
  console.log('   clear()    - Start fresh');
  console.log('');

  const hadSaved = loadSaved();
  if (hadSaved) {
    console.log(\`📂 Starting with \${entries.length.toLocaleString()} videos from previous session\`);
    console.log('');
  }

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

  const prevCount = entries.length;
  collectVideos();
  const initialNew = entries.length - prevCount;
  if (initialNew > 0) {
    console.log(\`📺 Found \${initialNew} videos on screen (Total: \${entries.length.toLocaleString()})\\n\`);
  } else {
    console.log(\`📺 Total: \${entries.length.toLocaleString()} videos\\n\`);
  }
  lastCount = entries.length;

  while (running && stableCount < 10) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 1200));
    collectVideos();

    // Auto-save to localStorage
    if (entries.length - lastSaveCount >= SAVE_INTERVAL) {
      saveToStorage();
      console.log(\`💾 Auto-saved (\${entries.length.toLocaleString()} videos)\`);
      lastSaveCount = entries.length;
    }

    // Check if we need to refresh to prevent crash
    const sessionVideos = entries.length - sessionStart;
    if (sessionVideos >= BATCH_LIMIT) {
      saveToStorage();
      console.log('');
      console.log(\`⚠️ Collected \${sessionVideos.toLocaleString()} videos this session.\`);
      console.log(\`💾 Total: \${entries.length.toLocaleString()} videos saved.\`);
      console.log('🔄 Refreshing page to free memory...');
      console.log('');
      console.log('👆 Click the bookmarklet again after refresh!');
      alert('Refreshing to free memory. Click the bookmarklet again to continue!\\n\\nTotal saved: ' + entries.length.toLocaleString() + ' videos');
      location.reload();
      return;
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
      const sessionCount = entries.length - sessionStart;
      console.log(\`📺 \${entries.length.toLocaleString()} total (\${sessionCount.toLocaleString()} this session, \${elapsed} min)\`);
      stableCount = 0;
      lastCount = entries.length;
    }
  }

  const totalTime = ((Date.now() - startTime) / 60000).toFixed(1);
  saveToStorage();
  console.log(\`\\n✅ \${running ? 'Complete!' : 'Paused.'} \${entries.length.toLocaleString()} videos (\${totalTime} min)\`);
  console.log('');
  console.log('📁 Data saved. Options:');
  console.log('   • Run script again to continue');
  console.log('   • Type download() to get JSON file');
  console.log('   • Type clear() to start fresh');
  if (running) {
    console.log('');
    console.log('💾 Downloading final file...');
    download();
    localStorage.removeItem(STORAGE_KEY);
  }
  delete window.stop;
  delete window.clear;
})();`;

export function BrowserExtract() {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

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
      <div className="p-4">
        <div className="text-center mb-4">
          <h3 className="font-bold text-[14px] text-[var(--yt-black)] mb-1">⚡ Extract Your History</h3>
          <p className="text-[12px] text-[var(--yt-gray)]">Three quick steps</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex gap-3 items-start p-3 bg-[#f9f9f9] border border-[#eee] rounded">
            <div className="w-6 h-6 flex items-center justify-center bg-[var(--yt-red)] text-white text-[11px] font-bold rounded-sm flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <div className="font-bold text-[12px] text-[var(--yt-black)]">Open YouTube History</div>
              <a
                href="https://www.youtube.com/feed/history"
                target="_blank"
                rel="noopener noreferrer"
                className="yt-btn yt-btn-primary mt-2"
              >
                Open YouTube History →
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 items-start p-3 bg-[#f9f9f9] border border-[#eee] rounded">
            <div className="w-6 h-6 flex items-center justify-center bg-[var(--yt-red)] text-white text-[11px] font-bold rounded-sm flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <div className="font-bold text-[12px] text-[var(--yt-black)]">Open browser console</div>
              <p className="text-[11px] text-[var(--yt-gray)] mt-1">
                Press <code className="bg-[#eee] px-1 py-0.5 rounded text-[var(--yt-black)]">F12</code> then click the <strong>Console</strong> tab
              </p>
              <p className="text-[10px] text-[var(--yt-gray)] mt-1">
                Mac: <code className="bg-[#eee] px-1 py-0.5 rounded">Cmd+Option+J</code>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 items-start p-3 bg-[#f9f9f9] border border-[#eee] rounded">
            <div className="w-6 h-6 flex items-center justify-center bg-[var(--yt-red)] text-white text-[11px] font-bold rounded-sm flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <div className="font-bold text-[12px] text-[var(--yt-black)]">Paste script and press Enter</div>
              <button
                onClick={handleCopy}
                className={`yt-btn mt-2 w-full ${copied ? 'yt-btn-success' : 'yt-btn-primary'}`}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Script'}
              </button>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 p-2 bg-[#e8f5e9] border border-[#c8e6c9] rounded text-[11px] text-[var(--yt-gray)]">
          <strong>💾 Auto-save:</strong> Progress saves automatically. Every ~5000 videos, the page refreshes to prevent crashes — just paste the script again to continue.
        </div>

        {/* View script link */}
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowScript(!showScript)}
            className="text-[11px] text-[var(--yt-link)] hover:underline"
          >
            {showScript ? 'Hide script' : 'View script before running'}
          </button>
        </div>

        {showScript && (
          <pre className="mt-2 p-3 bg-[#f5f5f5] border border-[#ddd] text-[10px] text-[var(--yt-gray-dark)] overflow-x-auto max-h-[200px] overflow-y-auto">
            {EXTRACT_SCRIPT}
          </pre>
        )}

        {/* Commands reference */}
        <div className="mt-3 pt-3 border-t border-[#eee] text-[10px] text-[var(--yt-gray)]">
          <strong>Console commands:</strong> <code className="bg-[#f0f0f0] px-1">stop()</code> pause, <code className="bg-[#f0f0f0] px-1">download()</code> get file, <code className="bg-[#f0f0f0] px-1">clear()</code> reset
        </div>
      </div>
    </div>
  );
}
