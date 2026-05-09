'use strict';

/**
 * Audio proxy route
 *
 * GET  /api/audio/fetch-playlist?url=<bambicloudUrl>
 *      Calls the BambiCloud REST API (api.bambicloud.com) server-side,
 *      returns structured JSON with real cdn.bambicloud.com audioURL fields.
 *
 * GET  /api/audio/stream?url=<remoteUrl>
 *      Proxy-streams a remote .mp3, forwarding Range headers so the browser can seek.
 *      Only cdn.bambicloud.com URLs are allowed (security allowlist).
 */

const express = require('express');
const https   = require('https');
const http    = require('http');
const { URL } = require('url');

const router = express.Router();

// ── Security allowlists ──────────────────────────────────────────────────────
// Hosts allowed for the stream proxy (audio CDN only)
const STREAM_ALLOWED_HOSTS = new Set(['cdn.bambicloud.com']);

// Hosts whose /playlist/<uuid> pages are accepted as input URLs
const PLAYLIST_PAGE_HOSTS  = new Set(['bambicloud.com', 'www.bambicloud.com']);

const PLAYLIST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isStreamAllowed(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return STREAM_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Extract playlist UUID from a bambicloud.com/playlist/<uuid> URL */
function extractPlaylistUuid(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!PLAYLIST_PAGE_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    const m = parsed.pathname.match(/^\/playlist\/([0-9a-f-]{36})$/i);
    if (!m) return null;
    return PLAYLIST_ID_RE.test(m[1]) ? m[1] : null;
  } catch {
    return null;
  }
}

// ── BambiCloud REST API ──────────────────────────────────────────────────────
const BC_API_BASE = 'https://api.bambicloud.com';

function fetchJson(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    https.request(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BambiSleepChurch/1.0)',
          'Accept':     'application/json',
          'Origin':     'https://bambicloud.com',
          'Referer':    'https://bambicloud.com/',
          ...extraHeaders,
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`API returned HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
          catch { reject(new Error('Invalid JSON from API')); }
        });
        res.on('error', reject);
      },
    )
    .on('error', reject)
    .setTimeout(12000, function () { this.destroy(new Error('Request timeout')); })
    .end();
  });
}

/** Format milliseconds → human duration string, e.g. "31m" or "1h 34m" */
function fmtDuration(ms) {
  if (!ms) return '';
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * Fetch any BambiCloud playlist via the real REST API.
 * GET /api/audio/fetch-playlist?url=https://bambicloud.com/playlist/<uuid>
 */
router.get('/fetch-playlist', async (req, res) => {
  const rawUrl = (req.query.url || '').trim();
  const uuid   = extractPlaylistUuid(rawUrl);

  if (!uuid) {
    return res.status(400).json({ error: 'Provide a valid bambicloud.com/playlist/<uuid> URL.' });
  }

  try {
    const apiUrl  = `${BC_API_BASE}/playlists?uuid=${encodeURIComponent(uuid)}`;
    const data    = await fetchJson(apiUrl);
    const raw     = data?.playlists?.[0];

    if (!raw) {
      return res.status(404).json({ error: 'Playlist not found or not public.' });
    }

    const tracks = (raw.files || []).map((f, i) => ({
      index:    i + 1,
      title:    f.name  || `Track ${i + 1}`,
      author:   f.author?.username || raw.creator?.username || '',
      duration: fmtDuration(f.duration),
      // audioURL is the direct cdn.bambicloud.com mp3; null for Patreon-locked files
      url:      (f.patreonTiers && f.patreonTiers.length > 0) ? null : (f.audioURL || null),
      locked:   !!(f.patreonTiers && f.patreonTiers.length > 0),
      fileUuid: f.uuid || null,
    }));

    return res.json({
      id:     raw.uuid,
      title:  raw.name,
      author: raw.creator?.username || 'Unknown',
      tracks,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch playlist', detail: err.message });
  }
});

/**
 * Proxy-stream a remote audio file from cdn.bambicloud.com only.
 * Forwards Range headers so the browser can seek.
 * GET /api/audio/stream?url=https://cdn.bambicloud.com/<uuid>.mp3
 */
router.get('/stream', (req, res) => {
  const rawUrl = (req.query.url || '').trim();

  if (!rawUrl || !isStreamAllowed(rawUrl)) {
    return res.status(400).json({ error: 'URL must be a cdn.bambicloud.com https:// URL.' });
  }

  const headers = {
    'User-Agent': 'BambiSleepChurch/1.0',
    'Referer':    'https://bambicloud.com/',
  };
  if (req.headers.range) headers['Range'] = req.headers.range;

  const upstream = https.request(rawUrl, { headers }, (upRes) => {
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
