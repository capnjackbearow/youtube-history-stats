import { useState } from 'react';

const API_SCRIPT = `(async function() {
  var entries = [];
  var seen = {};
  var running = true;
  var pageCount = 0;
  var videoCount = 0;
  var shortsCount = 0;
  var startTime = Date.now();

  var elapsed = function() {
    var s = Math.floor((Date.now() - startTime) / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m > 0 ? m + 'm ' : '') + s + 's';
  };

  window.stop = function() { running = false; console.log('[' + elapsed() + '] Stopping...'); };
  window.status = function() { console.log('[' + elapsed() + '] Total: ' + entries.length + ' (Videos: ' + videoCount + ', Shorts: ' + shortsCount + ') Pages: ' + pageCount); };

  var getAuth = async function() {
    var sapisid = document.cookie.split('; ').find(function(c) { return c.startsWith('SAPISID='); })?.split('=')[1];
    var timestamp = Math.floor(Date.now() / 1000);
    var input = timestamp + ' ' + sapisid + ' https://www.youtube.com';
    var hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
    var hashHex = Array.from(new Uint8Array(hashBuffer)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    return 'SAPISIDHASH ' + timestamp + '_' + hashHex;
  };

  var getToken = function(obj) { var t = null; (function find(o) { if (!o || t) return; if (typeof o !== 'object') return; if (o.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) { t = o.continuationItemRenderer.continuationEndpoint.continuationCommand.token; return; } for (var k in o) find(o[k]); })(obj); return t; };

  var extractAll = function(obj) {
    var vids = [];
    (function find(o) {
      if (!o || typeof o !== 'object') return;

      if (o.lockupViewModel) {
        var v = o.lockupViewModel;
        var id = v.contentId;
        if (id && !seen[id]) {
          seen[id] = 1;
          var meta = v.metadata?.lockupMetadataViewModel;
          var title = meta?.title?.content || 'Unknown';
          var channelPart = meta?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0];
          var channel = channelPart?.text?.content || '';
          var channelUrl = channelPart?.text?.commandRuns?.[0]?.onTap?.innertubeCommand?.browseEndpoint?.canonicalBaseUrl || '';
          vids.push({ header: 'YouTube', title: 'Watched ' + title, titleUrl: 'https://www.youtube.com/watch?v=' + id, subtitles: channel ? [{ name: channel, url: channelUrl ? 'https://www.youtube.com' + channelUrl : '' }] : [], time: new Date().toISOString(), type: 'video' });
          videoCount++;
        }
        return;
      }

      if (o.videoRenderer) {
        var vr = o.videoRenderer;
        var vid = vr.videoId;
        if (vid && !seen[vid]) {
          seen[vid] = 1;
          var vrChannel = vr.shortBylineText?.runs?.[0]?.text || '';
          var vrChannelUrl = vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || '';
          vids.push({ header: 'YouTube', title: 'Watched ' + (vr.title?.runs?.[0]?.text || 'Unknown'), titleUrl: 'https://www.youtube.com/watch?v=' + vid, subtitles: vrChannel ? [{ name: vrChannel, url: vrChannelUrl ? 'https://www.youtube.com' + vrChannelUrl : '' }] : [], time: new Date().toISOString(), type: 'video' });
          videoCount++;
        }
        return;
      }

      if (o.shortsLockupViewModel) {
        var s = o.shortsLockupViewModel;
        var shortId = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
        if (shortId && !seen[shortId]) {
          seen[shortId] = 1;
          var accText = s.accessibilityText || '';
          var shortTitle = accText.split(/,\\s*[\\d.]+\\s*(million|thousand|billion)?\\s*views/i)[0] || 'Short';
          vids.push({ header: 'YouTube', title: 'Watched ' + shortTitle, titleUrl: 'https://www.youtube.com/shorts/' + shortId, subtitles: [], time: new Date().toISOString(), type: 'short' });
          shortsCount++;
        }
        return;
      }

      for (var k in o) find(o[k]);
    })(obj);
    return vids;
  };

  var getAvatars = async function(channelUrls) {
    var avatars = {};
    for (var i = 0; i < channelUrls.length; i++) {
      var url = channelUrls[i];
      try {
        console.log('[' + elapsed() + '] Avatar ' + (i + 1) + '/' + channelUrls.length);
        var resp = await fetch(url);
        var html = await resp.text();
        var match = html.match(/"avatar":\\{"thumbnails":\\[.*?\\{"url":"([^"]+)"/);
        if (match) avatars[url] = match[1];
      } catch (e) {}
      await new Promise(function(r) { setTimeout(r, 200); });
    }
    return avatars;
  };

  console.log('=== YouTube History Scraper ===');
  console.log('Commands: stop() status()');
  console.log('[0s] Starting...');

  var auth = await getAuth();
  var context = window.ytcfg?.data_?.INNERTUBE_CONTEXT;

  var initial = extractAll(window.ytInitialData);
  entries = entries.concat(initial);
  console.log('[' + elapsed() + '] Initial: ' + initial.length + ' (V: ' + videoCount + ' S: ' + shortsCount + ')');

  var continuation = getToken(window.ytInitialData);

  while (running && continuation) {
    try {
      var resp = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': auth, 'X-Origin': 'https://www.youtube.com' }, credentials: 'include', body: JSON.stringify({ context: context, continuation: continuation }) });
      var data = await resp.json();
      pageCount++;
      var newVids = extractAll(data);
      entries = entries.concat(newVids);
      if (pageCount % 10 === 0) { console.log('[' + elapsed() + '] Page ' + pageCount + ': ' + entries.length + ' total (V: ' + videoCount + ' S: ' + shortsCount + ')'); }
      if (newVids.length === 0) { console.log('[' + elapsed() + '] No new content, stopping'); break; }
      continuation = getToken(data);
      if (!continuation) { console.log('[' + elapsed() + '] Reached end of history'); break; }
      await new Promise(function(r) { setTimeout(r, 150); });
    } catch (e) { console.log('[' + elapsed() + '] Error: ' + e.message); break; }
  }

  console.log('[' + elapsed() + '] History complete: ' + entries.length + ' total (V: ' + videoCount + ' S: ' + shortsCount + ')');

  // Get top channels separately for videos and shorts (matching parser logic)
  console.log('[' + elapsed() + '] Analyzing channels...');
  var videoChannels = {};
  var shortsChannels = {};
  entries.forEach(function(e) {
    if (!e.subtitles || !e.subtitles[0] || !e.subtitles[0].name) return;
    var name = e.subtitles[0].name;
    var url = e.subtitles[0].url || '';
    var key = name.toLowerCase();
    var isShort = e.type === 'short' || (e.titleUrl && e.titleUrl.includes('/shorts/'));
    var map = isShort ? shortsChannels : videoChannels;
    if (!map[key]) {
      map[key] = { name: name, url: url, count: 0 };
    }
    map[key].count++;
    if (url && url.length > 0 && (!map[key].url || map[key].url.length === 0)) {
      map[key].url = url;
    }
  });

  // Get top 10 from each category
  var topVideos = Object.values(videoChannels).sort(function(a, b) { return b.count - a.count; }).slice(0, 10);
  var topShorts = Object.values(shortsChannels).sort(function(a, b) { return b.count - a.count; }).slice(0, 10);

  // Combine and dedupe by URL
  var urlSet = {};
  var topUrls = [];
  topVideos.concat(topShorts).forEach(function(c) {
    if (c.url && c.url.length > 0 && !urlSet[c.url]) {
      urlSet[c.url] = true;
      topUrls.push(c.url);
    }
  });
  console.log('[' + elapsed() + '] Top channels: ' + topVideos.length + ' video, ' + topShorts.length + ' shorts (' + topUrls.length + ' unique URLs)');

  var avatars = await getAvatars(topUrls);
  console.log('[' + elapsed() + '] Fetched ' + Object.keys(avatars).length + ' avatars');

  // Add avatars to entries (match by lowercase name)
  var nameToAvatar = {};
  topVideos.concat(topShorts).forEach(function(c) {
    if (c.url && avatars[c.url]) {
      nameToAvatar[c.name.toLowerCase()] = avatars[c.url];
    }
  });
  entries.forEach(function(e) {
    if (e.subtitles && e.subtitles[0] && e.subtitles[0].name) {
      var avatar = nameToAvatar[e.subtitles[0].name.toLowerCase()];
      if (avatar) e.subtitles[0].avatar = avatar;
    }
  });

  console.log('[' + elapsed() + '] Done! Downloading...');

  var blob = new Blob([JSON.stringify(entries, null, 2)], {type: 'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'watch-history-' + entries.length + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  console.log('[' + elapsed() + '] Complete!');
  window.allEntries = entries;
})();`;

export function BrowserExtract() {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(API_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = API_SCRIPT;
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
      number: 1,
      title: 'Open YouTube History',
      description: 'Go to your YouTube watch history page',
      action: (
        <a
          href="https://www.youtube.com/feed/history"
          target="_blank"
          rel="noopener noreferrer"
          className="step-btn"
          onClick={(e) => e.stopPropagation()}
        >
          Open YouTube History
          <span className="btn-icon">→</span>
        </a>
      ),
    },
    {
      number: 2,
      title: 'Open Browser Console',
      description: (
        <>
          Press <kbd>F12</kbd> then click the <strong>Console</strong> tab
          <div className="keyboard-hint">
            Mac: <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>J</kbd>
          </div>
        </>
      ),
    },
    {
      number: 3,
      title: 'Run the Script',
      description: 'Paste the script and press Enter',
      action: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className={`step-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? (
            <>
              <span className="btn-check">✓</span>
              Copied!
            </>
          ) : (
            <>
              <span className="btn-icon">📋</span>
              Copy Script
            </>
          )}
        </button>
      ),
      note: 'This may take a few minutes depending on your history size.',
    },
    {
      number: 4,
      title: 'Upload the File',
      description: 'The JSON file will auto-download when complete. Upload it above.',
    },
  ];

  return (
    <div className="browser-extract">
      <div className="steps-container">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className={`step-card ${expandedStep === idx ? 'expanded' : ''}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div
              className="step-header"
              onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-chevron">{expandedStep === idx ? '−' : '+'}</div>
            </div>

            <div className="step-body">
              <div className="step-description">{step.description}</div>
              {step.action && <div className="step-action">{step.action}</div>}
              {step.note && <div className="step-note">{step.note}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="script-toggle">
        <button onClick={() => setShowScript(!showScript)} className="toggle-btn">
          {showScript ? 'Hide script' : 'View script before running'}
        </button>
      </div>

      {showScript && (
        <div className="script-preview">
          <pre>{API_SCRIPT}</pre>
        </div>
      )}

      <div className="commands-hint">
        <span className="hint-label">Console commands:</span>
        <code>stop()</code>
        <span className="hint-separator">•</span>
        <code>status()</code>
      </div>
    </div>
  );
}
