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

      if (o.lockupViewModel && o.lockupViewModel.contentId) {
        var v = o.lockupViewModel;
        var id = v.contentId;
        if (!seen[id]) {
          seen[id] = 1;
          var meta = v.metadata?.lockupMetadataViewModel;
          var title = meta?.title?.content || 'Unknown';
          var rows = meta?.metadata?.contentMetadataViewModel?.metadataRows;
          var channel = rows?.[0]?.metadataParts?.[0]?.text?.content || '';
          var channelUrl = meta?.image?.decoratedAvatarViewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint?.canonicalBaseUrl || '';
          vids.push({ header: 'YouTube', title: 'Watched ' + title, titleUrl: 'https://www.youtube.com/watch?v=' + id, subtitles: channel ? [{ name: channel, url: channelUrl ? 'https://www.youtube.com' + channelUrl : '' }] : [], time: new Date().toISOString(), type: 'video' });
          videoCount++;
        }
        return;
      }

      if (o.videoRenderer && o.videoRenderer.videoId) {
        var vr = o.videoRenderer;
        var vid = vr.videoId;
        if (!seen[vid]) {
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

  console.log('=== YouTube History Scraper (with Genre Enrichment) ===');
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

  console.log('[' + elapsed() + '] Scrape complete: V: ' + videoCount + ' | S: ' + shortsCount + ' | Total: ' + entries.length);

  // Build channel stats separately for videos and shorts
  console.log('[' + elapsed() + '] Analyzing channels...');
  var videoChannels = {};
  var shortsChannels = {};
  var channelVideos = {};

  entries.forEach(function(e) {
    if (!e.subtitles || !e.subtitles[0] || !e.subtitles[0].name) return;
    var name = e.subtitles[0].name;
    var url = e.subtitles[0].url || '';
    var key = name.toLowerCase();
    var isShort = e.type === 'short' || (e.titleUrl && e.titleUrl.includes('/shorts/'));
    var map = isShort ? shortsChannels : videoChannels;
    if (!map[key]) map[key] = { name: name, url: url, count: 0 };
    map[key].count++;
    if (url && url.length > 0 && !map[key].url) map[key].url = url;
    if (!isShort && !channelVideos[name]) channelVideos[name] = e.titleUrl.split('v=')[1];
  });

  // Get top channels for avatars
  var topVideos = Object.values(videoChannels).sort(function(a, b) { return b.count - a.count; }).slice(0, 10);
  var topShorts = Object.values(shortsChannels).sort(function(a, b) { return b.count - a.count; }).slice(0, 10);

  // Fetch avatars for top channels
  console.log('[' + elapsed() + '] Fetching avatars for top channels...');
  var urlSet = {};
  var topUrls = [];
  topVideos.concat(topShorts).forEach(function(c) {
    if (c.url && c.url.length > 0 && !urlSet[c.url]) {
      urlSet[c.url] = true;
      topUrls.push({ url: c.url, name: c.name });
    }
  });

  var nameToAvatar = {};
  for (var i = 0; i < topUrls.length; i++) {
    var item = topUrls[i];
    try {
      console.log('[' + elapsed() + '] Avatar ' + (i + 1) + '/' + topUrls.length + ': ' + item.name);
      var resp = await fetch(item.url, { credentials: 'include' });
      var html = await resp.text();
      var match = html.match(/"avatar":\\{"thumbnails":\\[.*?\\{"url":"([^"]+)"/);
      if (match) nameToAvatar[item.name.toLowerCase()] = match[1];
    } catch (e) {}
    await new Promise(function(r) { setTimeout(r, 200); });
  }

  // Apply avatars to entries
  entries.forEach(function(e) {
    if (e.subtitles && e.subtitles[0] && e.subtitles[0].name) {
      var avatar = nameToAvatar[e.subtitles[0].name.toLowerCase()];
      if (avatar) e.subtitles[0].avatar = avatar;
    }
  });
  console.log('[' + elapsed() + '] Fetched ' + Object.keys(nameToAvatar).length + ' avatars');

  // Get top 25 for genre enrichment
  console.log('[' + elapsed() + '] Enriching top 25 channels with genres...');
  var top25 = Object.values(videoChannels).sort(function(a, b) { return b.count - a.count; }).slice(0, 25);
  var top25Genres = {};

  for (var i = 0; i < top25.length; i++) {
    var ch = top25[i];
    var videoId = channelVideos[ch.name];
    if (!videoId) { top25Genres[ch.name] = 'Unknown'; continue; }

    try {
      var resp = await fetch('https://www.youtube.com/watch?v=' + videoId, { credentials: 'include' });
      var html = await resp.text();
      var match = html.match(/itemprop="genre"\\s*content="([^"]+)"/);
      var genre = match?.[1] || 'Unknown';
      top25Genres[ch.name] = genre;
      console.log('[' + elapsed() + '] Genre ' + (i + 1) + '/25: ' + ch.name + ' - ' + genre);
    } catch (e) {
      top25Genres[ch.name] = 'Unknown';
    }
    await new Promise(function(r) { setTimeout(r, 200); });
  }

  console.log('[' + elapsed() + '] Done! Downloading...');

  var output = {
    entries: entries,
    topChannels: top25.map(function(c) {
      return { name: c.name, count: c.count, genre: top25Genres[c.name] || 'Unknown' };
    }),
    stats: {
      videos: videoCount,
      shorts: shortsCount,
      total: entries.length,
      pages: pageCount
    }
  };

  var blob = new Blob([JSON.stringify(output, null, 2)], {type: 'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'watch-history-' + entries.length + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  console.log('[' + elapsed() + '] Complete!');
  window.allEntries = entries;
  window.topChannels = output.topChannels;
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
