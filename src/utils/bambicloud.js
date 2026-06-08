'use strict';

/**
 * bambicloud.js — shared BambiCloud REST helpers.
 *
 * Used by:
 *   - src/routes/audio.js      (playlist proxy + stream allowlist)
 *   - src/routes/challenge.js  (computing a playlist's playable length)
 */

const https   = require('https');
const { URL } = require('url');

// ── Security allowlists ──────────────────────────────────────────────────────
// Hosts allowed for the stream proxy (audio CDN only)
const STREAM_ALLOWED_HOSTS = new Set(['cdn.bambicloud.com']);

// Hosts whose /playlist/<uuid> pages are accepted as input URLs
const PLAYLIST_PAGE_HOSTS  = new Set(['bambicloud.com', 'www.bambicloud.com']);

const PLAYLIST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BC_API_BASE = 'https://api.bambicloud.com';

/** True if rawUrl is an https cdn.bambicloud.com URL (safe to proxy-stream). */
function isStreamAllowed(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return STREAM_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Extract playlist UUID from a bambicloud.com/playlist/<uuid> URL, else null. */
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

/** Fetch + parse JSON from a URL with BambiCloud-friendly headers. */
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

/** Format milliseconds → human duration string, e.g. "31m" or "1h 34m". */
function fmtDuration(ms) {
  if (!ms) return '';
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Fetch a playlist by UUID via the BambiCloud REST API and normalise it.
 *
 * Returns:
 *   {
 *     id, title, author,
 *     tracks: [{ index, title, author, duration, durationSeconds, url, locked, fileUuid }],
 *     playableSeconds  // sum of durations of UNLOCKED (playable) tracks only
 *   }
 *
 * Throws on network errors. Returns null if the playlist is not found.
 */
async function fetchPlaylist(uuid) {
  const apiUrl = `${BC_API_BASE}/playlists?uuid=${encodeURIComponent(uuid)}`;
  const data   = await fetchJson(apiUrl);
  const raw    = data?.playlists?.[0];
  if (!raw) return null;

  let playableSeconds = 0;

  const tracks = (raw.files || []).map((f, i) => {
    const locked = !!(f.patreonTiers && f.patreonTiers.length > 0);
    const durationSeconds = Math.round((f.duration || 0) / 1000);
    if (!locked) playableSeconds += durationSeconds;
    return {
      index:           i + 1,
      title:           f.name || `Track ${i + 1}`,
      author:          f.author?.username || raw.creator?.username || '',
      duration:        fmtDuration(f.duration),
      durationSeconds,
      // audioURL is the direct cdn.bambicloud.com mp3; null for Patreon-locked files
      url:             locked ? null : (f.audioURL || null),
      locked,
      fileUuid:        f.uuid || null,
    };
  });

  return {
    id:     raw.uuid,
    title:  raw.name,
    author: raw.creator?.username || 'Unknown',
    tracks,
    playableSeconds,
  };
}

module.exports = {
  STREAM_ALLOWED_HOSTS,
  PLAYLIST_PAGE_HOSTS,
  isStreamAllowed,
  extractPlaylistUuid,
  fetchJson,
  fmtDuration,
  fetchPlaylist,
};
