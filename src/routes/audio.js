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

const {
  isStreamAllowed,
  extractPlaylistUuid,
  fetchPlaylist,
} = require('../utils/bambicloud');

const router = express.Router();

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
    const playlist = await fetchPlaylist(uuid);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or not public.' });
    }
    return res.json(playlist);
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
