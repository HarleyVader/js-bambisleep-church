'use strict';

/**
 * Audio proxy route
 *
 * GET  /api/audio/fetch-playlist?url=<bambicloudUrl>
 *      Scrapes a BambiCloud playlist page server-side and returns structured JSON.
 *      Extraction order: __NEXT_DATA__ JSON → HTML regex fallback.
 *
 * GET  /api/audio/stream?url=<remoteUrl>
 *      Proxy-streams a remote .mp3, forwarding Range headers so the browser can seek.
 *      Only bambicloud.com origin URLs are allowed (security allowlist).
 */

const express = require('express');
const https   = require('https');
const http    = require('http');
const { URL } = require('url');

const router = express.Router();

// ── Security allowlist ───────────────────────────────────────────────────────
const ALLOWED_HOSTS = new Set(['bambicloud.com', 'www.bambicloud.com']);

const PLAYLIST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAllowedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOSTS.has(host);
  } catch {
    return false;
  }
}

function isBambicloudPlaylistUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) return false;
    const m = parsed.pathname.match(/^\/playlist\/([0-9a-f-]{36})$/i);
    return m ? PLAYLIST_ID_RE.test(m[1]) : false;
  } catch {
    return false;
  }
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

function fetchText(rawUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(rawUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.request(
      rawUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BambiSleepChurch/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      (res) => {
        // Follow one redirect
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, rawUrl).href;
          if (!isAllowedUrl(redirectUrl)) {
            return reject(new Error('Redirect to disallowed host'));
          }
          return fetchText(redirectUrl).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('Request timeout')); });
    req.end();
  });
}

// ── Playlist parsers ─────────────────────────────────────────────────────────

/**
 * Try to extract playlist data from Next.js __NEXT_DATA__ embedded JSON.
 * BambiCloud is a Next.js app that embeds its SSR props in the page.
 */
function parseNextData(html, playlistId) {
  const m = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/i);
  if (!m) return null;

  let nextData;
  try { nextData = JSON.parse(m[1]); } catch { return null; }

  // Walk common pageProps shapes
  const pp = nextData?.props?.pageProps ?? {};
  const raw = pp.playlist ?? pp.data?.playlist ?? pp.data ?? null;
  if (!raw) return null;

  const tracks = (raw.files ?? raw.tracks ?? raw.items ?? []).map((t, i) => {
    // Audio URL may be stored as audioUrl, url, fileUrl, src, streamUrl, etc.
    const audioUrl =
      t.audioUrl ?? t.url ?? t.fileUrl ?? t.src ?? t.streamUrl ?? t.audioSrc ?? '';
    return {
      index:    i + 1,
      title:    t.title ?? t.name ?? `Track ${i + 1}`,
      author:   t.user?.username ?? t.author ?? t.createdBy ?? '',
      duration: formatDuration(t.duration ?? t.length ?? t.durationSeconds ?? ''),
      url:      audioUrl,
    };
  });

  return {
    id:     playlistId,
    title:  raw.title ?? raw.name ?? 'Unnamed Playlist',
    author: raw.user?.username ?? raw.author ?? raw.createdBy ?? 'Unknown',
    tracks,
  };
}

/**
 * Regex HTML fallback – extracts what the browser renders:
 * track number, title, author, duration. Audio URLs unavailable this way.
 */
function parseHtmlFallback(html, playlistId) {
  // Playlist title — typically the first <h1>
  const titleM = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title  = titleM ? stripTags(titleM[1]).trim() : 'Unknown Playlist';

  // Author — appears after "By" link
  const authorM = html.match(/By\s*<a[^>]*>([^<]+)<\/a>/i);
  const author  = authorM ? authorM[1].trim() : 'Unknown';

  // Tracks — each block has an index number, an <h5> title, and a duration
  const tracks = [];
  // Pattern: leading digits (index), then h5 title, then author name, then duration
  const trackRe =
    /0*(\d{1,3})\s*<\/[^>]+>[\s\S]*?<h5[^>]*>([\s\S]*?)<\/h5>\s*([\s\S]*?)\s*(\d+(?:h\s*)?\d*m|\d+m)/gi;
  let tm;
  while ((tm = trackRe.exec(html)) !== null && tracks.length < 100) {
    const trackAuthorBlock = tm[3].replace(/<[^>]+>/g, ' ').trim().split(/\s{2,}/)[0].trim();
    tracks.push({
      index:    parseInt(tm[1], 10),
      title:    stripTags(tm[2]).trim(),
      author:   trackAuthorBlock || author,
      duration: tm[4].trim(),
      url:      '', // cannot determine without JS execution
    });
  }

  return { id: playlistId, title, author, tracks };
}

function stripTags(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function formatDuration(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'string') return val;
  // seconds → Xm or Xh Xm
  const s = parseInt(val, 10);
  if (!isFinite(s)) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * Dynamically scrape and return any BambiCloud playlist.
 * GET /api/audio/fetch-playlist?url=https://bambicloud.com/playlist/<uuid>
 */
router.get('/fetch-playlist', async (req, res) => {
  const rawUrl = (req.query.url || '').trim();

  if (!rawUrl || !isBambicloudPlaylistUrl(rawUrl)) {
    return res.status(400).json({ error: 'Provide a valid bambicloud.com/playlist/<uuid> URL.' });
  }

  const playlistId = new URL(rawUrl).pathname.split('/').pop();

  try {
    const html = await fetchText(rawUrl);

    // 1. Try Next.js embedded data (richest — includes audio URLs when available)
    const fromNext = parseNextData(html, playlistId);
    if (fromNext && fromNext.tracks.length > 0) {
      return res.json(fromNext);
    }

    // 2. HTML regex fallback (metadata only)
    const fromHtml = parseHtmlFallback(html, playlistId);
    if (fromHtml.tracks.length > 0) {
      return res.json(fromHtml);
    }

    return res.status(422).json({ error: 'Could not parse playlist from BambiCloud page.' });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch playlist', detail: err.message });
  }
});

/**
 * Proxy-stream a remote audio file.
 * Only bambicloud.com URLs are permitted.
 * GET /api/audio/stream?url=<remoteUrl>
 */
router.get('/stream', (req, res) => {
  const rawUrl = (req.query.url || '').trim();

  if (!rawUrl || !isAllowedUrl(rawUrl)) {
    return res.status(400).json({ error: 'Invalid or disallowed URL.' });
  }

  const parsed = new URL(rawUrl);
  const client = parsed.protocol === 'https:' ? https : http;

  const headers = { 'User-Agent': 'BambiSleepChurch/1.0' };
  if (req.headers.range) headers['Range'] = req.headers.range;

  const upstream = client.request(rawUrl, { headers }, (upRes) => {
    const forward = {};
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']
      .forEach((h) => { if (upRes.headers[h]) forward[h] = upRes.headers[h]; });
    res.writeHead(upRes.statusCode, forward);
    upRes.pipe(res);
  });

  upstream.on('error', (err) => {
    if (!res.headersSent) res.status(502).json({ error: 'Upstream error', detail: err.message });
  });

  req.on('close', () => upstream.destroy());
  upstream.end();
});

module.exports = router;
