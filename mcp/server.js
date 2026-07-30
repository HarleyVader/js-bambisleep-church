'use strict';

/**
 * BambiSleep Church — LM Studio MCP Server
 *
 * Exposes all site HTTP API endpoints and two direct SQLite admin tools as
 * Model Context Protocol tools consumable by LM Studio (stdio transport).
 *
 * Env vars:
 *   BASE_URL    – Running Express app base URL  (default: http://localhost:3000)
 *   SQLITE_PATH – Path to the SQLite DB file    (default: ../data/app.db relative to this file)
 */

const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z }                    = require('zod');
const http                     = require('http');
const https                    = require('https');
const path                     = require('path');
const Database                 = require('better-sqlite3');
const { io: ioClient }         = require('socket.io-client');

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL   || 'http://localhost:3000';
const DB_PATH  = process.env.SQLITE_PATH || path.join(__dirname, '../data/app.db');

// ─── HTTP helper ──────────────────────────────────────────────────────────────

/**
 * Make an HTTP/HTTPS request to the running Express app.
 * @param {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} method
 * @param {string} urlPath  – path + optional query string, e.g. '/api/chat/messages'
 * @param {object|null} body – JSON body (POST/PUT only)
 * @returns {Promise<{status:number, body:any}>}
 */
function apiRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const baseUrl  = new URL(BASE_URL);
    const fullPath = urlPath.startsWith('http') ? new URL(urlPath).pathname + new URL(urlPath).search : urlPath;
    const lib      = baseUrl.protocol === 'https:' ? https : http;
    const bodyStr  = body ? JSON.stringify(body) : null;

    const port = baseUrl.port
      ? Number(baseUrl.port)
      : baseUrl.protocol === 'https:' ? 443 : 80;

    const options = {
      hostname : baseUrl.hostname,
      port,
      path     : fullPath,
      method,
      headers  : {
        'Content-Type': 'application/json',
        'Accept'      : 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── BambiCloud URL helper ───────────────────────────────────────────────────

const _PLAYLIST_PAGE_HOSTS = new Set(['bambicloud.com', 'www.bambicloud.com']);
const _PLAYLIST_UUID_RE    = /^\/playlist\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Extract the UUID from a bambicloud.com/playlist/<uuid> URL.
 * Returns the UUID string or null if the URL is invalid.
 */
function extractPlaylistUuid(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!_PLAYLIST_PAGE_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    const m = parsed.pathname.match(_PLAYLIST_UUID_RE);
    return m ? m[1] : null;
  } catch { return null; }
}

// ─── Buttplug socket helper ───────────────────────────────────────────────────

/** Named patterns available on the server (mirrors buttplug-panel.js). */
const BP_PATTERNS = ['pulse', 'wave', 'surge', 'tease', 'throb'];

/**
 * Connect to the Socket.IO server as the given token-holder, emit a
 * bp:control event, then disconnect.  Resolves once the event has been sent
 * or rejects on connection failure / timeout.
 *
 * @param {string} senderToken   – session token of the sender (identifies them to the server)
 * @param {string} targetUsername
 * @param {'vibrate'|'pattern'|'stop'} action
 * @param {object} payload
 */
function sendBpControl(senderToken, targetUsername, action, payload) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(BASE_URL, {
      query        : { token: senderToken },
      reconnection : false,
      timeout      : 6000,
      transports   : ['websocket', 'polling'],
    });

    const guard = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket connection timed out'));
    }, 8000);

    socket.once('connect', () => {
      socket.emit('bp:control', { targetUsername, action, payload });
      // Allow one tick for the event to flush before disconnecting
      setTimeout(() => {
        clearTimeout(guard);
        socket.disconnect();
        resolve({ sent: true, targetUsername, action, payload });
      }, 250);
    });

    socket.once('connect_error', (err) => {
      clearTimeout(guard);
      socket.disconnect();
      reject(new Error(`Socket connect_error: ${err.message}`));
    });
  });
}

// ─── DB helper (admin tools, read-only) ──────────────────────────────────────

let _db = null;
function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return _db;
}

// ─── MCP response helpers ─────────────────────────────────────────────────────

function ok(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: 'text', text }] };
}

function fail(msg) {
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = new McpServer({
  name   : 'bambisleep-church',
  version: '1.0.0'
});

// ════════════════════════════════════════════════════════════════════════════
//  CHAT
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'get_messages',
  'Fetch all chat messages from the site, ordered by creation time ascending.',
  {},
  async () => {
    try {
      const res = await apiRequest('GET', '/api/chat/messages');
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'send_message',
  'Send a chat message to the site on behalf of a user.',
  {
    sender  : z.string().describe('Display name of the sender'),
    content : z.string().describe('Message text'),
    token   : z.string().describe('Session token of the sender'),
    attachment: z.object({
      url  : z.string(),
      type : z.string(),
      kind : z.string(),
      name : z.string(),
      size : z.number()
    }).optional().describe('Optional file attachment metadata')
  },
  async ({ sender, content, token, attachment }) => {
    try {
      const body = { sender, content, token };
      if (attachment) body.attachment = attachment;
      const res = await apiRequest('POST', '/api/chat/messages', body);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'react_to_message',
  'Toggle an emoji reaction on a chat message. Returns updated reactions array.',
  {
    id   : z.string().describe('Message ID (UUID)'),
    emoji: z.string().describe('Emoji character to react with (e.g. "❤️")'),
    token: z.string().describe('Session token of the reacting user')
  },
  async ({ id, emoji, token }) => {
    try {
      const res = await apiRequest('POST', `/api/messages/${encodeURIComponent(id)}/react`, { emoji, token });
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  USER
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'create_user',
  'Create or update a user session (upsert by username). Returns the user object, session token, and any XP gained.',
  {
    username: z.string().max(32).describe('Display name (max 32 chars)'),
    token   : z.string().optional().describe('Existing session token to reuse — omit to create a new session')
  },
  async ({ username, token }) => {
    try {
      const body = { username };
      if (token) body.token = token;
      const res = await apiRequest('POST', '/api/user', body);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'get_user',
  'Fetch full user record by session token. Includes XP, stats, Patreon info, challenge, and contract fields.',
  {
    token: z.string().describe('Session token')
  },
  async ({ token }) => {
    try {
      const res = await apiRequest('GET', `/api/user/${encodeURIComponent(token)}`);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'get_profile',
  'Fetch a user\'s public profile. Access requires the requesting user to be a creator, active patron (≥200¢), or have a signed contract.',
  {
    username: z.string().describe('Username whose profile to fetch'),
    session : z.string().describe('Session token of the requesting user')
  },
  async ({ username, session }) => {
    try {
      const res = await apiRequest(
        'GET',
        `/api/user/profile/${encodeURIComponent(username)}?session=${encodeURIComponent(session)}`
      );
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'end_session',
  'End a user session and award time-based XP (1 XP per 5 minutes, capped at 3 hours).',
  {
    token          : z.string().describe('Session token'),
    durationSeconds: z.number().int().min(0).describe('Session duration in seconds')
  },
  async ({ token, durationSeconds }) => {
    try {
      const res = await apiRequest('POST', `/api/user/${encodeURIComponent(token)}/session-end`, { durationSeconds });
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'sign_contract',
  'Sign the Bambi Covenant for a user. Requires the user to be an active patron OR already have a contract. Password must be ≥8 characters.',
  {
    session        : z.string().describe('Session token'),
    username       : z.string().describe('Username signing the covenant'),
    password       : z.string().min(8).describe('New password (min 8 characters)'),
    confirmPassword: z.string().describe('Password confirmation (must match password)'),
    contractVersion: z.string().optional().describe('Contract version string (optional)')
  },
  async ({ session, username, password, confirmPassword, contractVersion }) => {
    try {
      const body = { session, username, password, confirmPassword };
      if (contractVersion) body.contractVersion = contractVersion;
      const res = await apiRequest('POST', '/api/user/contract', body);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  AUDIO
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'fetch_playlist',
  'Fetch a BambiCloud playlist by URL. Returns full metadata plus all tracks (locked tracks have null URL).',
  {
    url: z.string().url().describe('BambiCloud playlist URL — e.g. https://bambicloud.com/playlist/<uuid>')
  },
  async ({ url }) => {
    try {
      const res = await apiRequest('GET', `/api/audio/fetch-playlist?url=${encodeURIComponent(url)}`);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'list_playlist_tracks',
  'Fetch a BambiCloud playlist and return only the playable (non-locked) tracks with their index, title, author, duration, and stream URL.',
  {
    url: z.string().url().describe('BambiCloud playlist URL')
  },
  async ({ url }) => {
    try {
      const res = await apiRequest('GET', `/api/audio/fetch-playlist?url=${encodeURIComponent(url)}`);
      if (res.status !== 200) return fail(res.body?.error || `HTTP ${res.status}`);
      const { id, title, author, tracks = [], playableSeconds } = res.body;
      const playable = tracks.filter((t) => !t.locked && t.url);
      return ok({
        id,
        title,
        author,
        playable_count    : playable.length,
        total_count       : tracks.length,
        playable_seconds  : playableSeconds,
        tracks            : playable.map(({ index, title: t, author: a, duration, durationSeconds, url: u }) => ({
          index, title: t, author: a, duration, durationSeconds, url: u,
        })),
      });
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'validate_playlist_url',
  'Check whether a URL is a valid BambiCloud playlist URL and extract its UUID. Useful before passing a URL to other audio or challenge tools.',
  {
    url: z.string().describe('URL to validate')
  },
  ({ url }) => {
    const uuid = extractPlaylistUuid(url);
    if (!uuid) {
      return ok({ valid: false, reason: 'URL must be https://bambicloud.com/playlist/<uuid>' });
    }
    return ok({ valid: true, uuid, canonical: `https://bambicloud.com/playlist/${uuid}` });
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  CHALLENGE
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'request_challenge',
  'Start a Good Girl Timer Challenge for the authenticated user. Requires patron (≥200¢) or creator role.',
  {
    session        : z.string().describe('Session token of the user requesting the challenge'),
    durationSeconds: z.number().int().optional().describe('Challenge duration in seconds: 3600 (1h), 21600 (6h), or 86400 (24h). Defaults to 86400')
  },
  async ({ session, durationSeconds }) => {
    try {
      const body = { session };
      if (durationSeconds !== undefined) body.durationSeconds = durationSeconds;
      const res = await apiRequest('POST', '/api/challenge/request', body);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'assign_task',
  'Assign a BambiCloud playlist as a challenge task to a user. Assigner must be a patron (≥200¢) or creator.',
  {
    username: z.string().describe('Username to assign the task to'),
    session : z.string().describe('Session token of the assigning user'),
    url     : z.string().url().describe('BambiCloud playlist URL to assign as a task')
  },
  async ({ username, session, url }) => {
    try {
      const res = await apiRequest(
        'POST',
        `/api/challenge/${encodeURIComponent(username)}/task`,
        { session, url }
      );
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'report_progress',
  'Report listening progress on an active challenge task. Includes anti-cheat validation server-side.',
  {
    session        : z.string().describe('Session token of the user reporting progress'),
    username       : z.string().describe('Username whose task is being updated'),
    taskId         : z.string().describe('Task UUID'),
    listenedSeconds: z.number().int().min(0).describe('Total seconds listened on this task so far')
  },
  async ({ session, username, taskId, listenedSeconds }) => {
    try {
      const res = await apiRequest('POST', '/api/challenge/progress', { session, username, taskId, listenedSeconds });
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'get_challenge',
  'Get a user\'s current challenge status. Requires caller to be a patron (≥200¢) or creator.',
  {
    username: z.string().describe('Username to check'),
    session : z.string().describe('Session token of the requesting user')
  },
  async ({ username, session }) => {
    try {
      const res = await apiRequest(
        'GET',
        `/api/challenge/${encodeURIComponent(username)}?session=${encodeURIComponent(session)}`
      );
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  PATREON
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'get_patreon_status',
  'Check Patreon link status for a user. Returns patron tier, amount, and active status.',
  {
    session: z.string().describe('Session token')
  },
  async ({ session }) => {
    try {
      const res = await apiRequest('GET', `/api/patreon/status?session=${encodeURIComponent(session)}`);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'unlink_patreon',
  'Unlink the Patreon account from a user session.',
  {
    session: z.string().describe('Session token')
  },
  async ({ session }) => {
    try {
      const res = await apiRequest('POST', `/api/patreon/unlink?session=${encodeURIComponent(session)}`);
      return ok(res.body);
    } catch (e) { return fail(e.message); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  BUTTPLUG
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'buttplug_vibrate',
  'Send a constant vibration command to a connected user\'s toy via the site\'s remote toy-control relay. The target user must be online and have a device connected to Intiface Central.',
  {
    senderToken    : z.string().describe('Session token of the user sending the command (identifies you to the server)'),
    targetUsername : z.string().describe('Username of the user whose toy to vibrate'),
    intensity      : z.number().min(0).max(1).describe('Vibration intensity from 0.0 (off) to 1.0 (maximum)')
  },
  async ({ senderToken, targetUsername, intensity }) => {
    try {
      const result = await sendBpControl(
        senderToken,
        targetUsername,
        'vibrate',
        { intensity: Math.max(0, Math.min(1, intensity)) }
      );
      return ok(result);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'buttplug_pattern',
  `Send a named haptic pattern to a connected user's toy. Available patterns: ${BP_PATTERNS.join(', ')}.` +
  ' pulse = short bursts; wave = rising wave; surge = slow build to peak; tease = stop-start; throb = deep rhythmic pulse.',
  {
    senderToken    : z.string().describe('Session token of the user sending the command'),
    targetUsername : z.string().describe('Username of the target user'),
    patternName    : z.enum(['pulse', 'wave', 'surge', 'tease', 'throb']).describe('Named haptic pattern to run'),
    intensity      : z.number().min(0).max(1).default(0.8).describe('Master intensity multiplier 0.0–1.0 (default 0.8)')
  },
  async ({ senderToken, targetUsername, patternName, intensity }) => {
    try {
      const result = await sendBpControl(
        senderToken,
        targetUsername,
        'pattern',
        { name: patternName, intensity: Math.max(0, Math.min(1, intensity)) }
      );
      return ok(result);
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'buttplug_stop',
  'Immediately stop all vibration on a connected user\'s toy.',
  {
    senderToken    : z.string().describe('Session token of the user sending the stop command'),
    targetUsername : z.string().describe('Username of the user whose toy to stop')
  },
  async ({ senderToken, targetUsername }) => {
    try {
      const result = await sendBpControl(senderToken, targetUsername, 'stop', {});
      return ok(result);
    } catch (e) { return fail(e.message); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN — direct SQLite access (read-only)
// ════════════════════════════════════════════════════════════════════════════

server.tool(
  'query_database',
  'Run a read-only SQL SELECT query directly against the SQLite database. Useful for custom lookups and analytics. Only SELECT and WITH queries are allowed.',
  {
    sql: z.string().describe('SQL query — must begin with SELECT or WITH; mutation statements are rejected')
  },
  async ({ sql }) => {
    const trimmed = sql.trim();
    const upper   = trimmed.toUpperCase();

    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
      return fail('Only SELECT and WITH queries are permitted');
    }
    // Guard against embedded mutations
    if (/\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|REPLACE)\b/i.test(sql)) {
      return fail('Query contains a forbidden mutation keyword');
    }
    // Guard against PRAGMA writes
    if (/PRAGMA\s+\w+\s*=/i.test(sql)) {
      return fail('PRAGMA write statements are not allowed');
    }

    try {
      const db   = getDb();
      const rows = db.prepare(trimmed).all();
      return ok({ row_count: rows.length, rows });
    } catch (e) { return fail(e.message); }
  }
);

server.tool(
  'get_site_overview',
  'Get a real-time aggregate overview of the site: user counts, online users, message totals, active challenges, prestige counts, top users by XP, and Patreon/contract stats.',
  {},
  async () => {
    try {
      const db = getDb();

      const totalUsers   = db.prepare('SELECT COUNT(*) AS count FROM users').get();
      const totalMsgs    = db.prepare('SELECT COUNT(*) AS count FROM messages').get();
      const recentCutoff = Date.now() - 5 * 60 * 1000; // 5 minutes
      const onlineNow    = db.prepare('SELECT COUNT(*) AS count FROM users WHERE last_seen > ?').get(recentCutoff);

      const byRole = db.prepare(
        'SELECT role, COUNT(*) AS count FROM users GROUP BY role'
      ).all();

      const activeChallenges = db.prepare(
        `SELECT COUNT(*) AS count FROM users WHERE json_extract(challenge, '$.status') = 'active'`
      ).get();

      const prestigeCount = db.prepare(
        `SELECT COUNT(*) AS count FROM users WHERE json_extract(progress, '$.prestige') > 0`
      ).get();

      const contractCount = db.prepare(
        `SELECT COUNT(*) AS count FROM users WHERE json_extract(contract, '$.acceptedAt') IS NOT NULL`
      ).get();

      const patronLinked = db.prepare(
        `SELECT COUNT(*) AS count FROM users WHERE json_extract(patreon, '$.userId') IS NOT NULL`
      ).get();

      const activePatrons = db.prepare(
        `SELECT COUNT(*) AS count FROM users WHERE json_extract(patreon, '$.patronStatus') = 'active_patron'`
      ).get();

      const topUsers = db.prepare(
        `SELECT
           username,
           json_extract(progress, '$.level')    AS level,
           json_extract(progress, '$.xp')       AS xp,
           json_extract(progress, '$.totalXp')  AS total_xp,
           json_extract(progress, '$.prestige') AS prestige
         FROM users
         ORDER BY json_extract(progress, '$.totalXp') DESC
         LIMIT 10`
      ).all();

      return ok({
        users: {
          total         : totalUsers.count,
          online_5min   : onlineNow.count,
          by_role       : Object.fromEntries(byRole.map((r) => [r.role, r.count])),
          patron_linked : patronLinked.count,
          active_patrons: activePatrons.count,
          contract_signed: contractCount.count,
          prestige      : prestigeCount.count
        },
        messages  : { total: totalMsgs.count },
        challenges: { active: activeChallenges.count },
        top_users_by_xp: topUsers
      });
    } catch (e) { return fail(e.message); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  RESOURCES  (passive context — no tool call needed)
// ════════════════════════════════════════════════════════════════════════════

// Recent messages ────────────────────────────────────────────────────────────
server.resource(
  'messages',
  'bambisleep://messages',
  { description: 'Last 50 chat messages ordered newest-first', mimeType: 'application/json' },
  async (uri) => {
    try {
      const db   = getDb();
      const rows = db.prepare(
        `SELECT id, sender, content, reactions, attachment, created_at
         FROM messages ORDER BY created_at DESC LIMIT 50`
      ).all();
      rows.forEach((r) => {
        try { r.reactions  = JSON.parse(r.reactions);  } catch {}
        try { r.attachment = JSON.parse(r.attachment); } catch {}
      });
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(rows, null, 2) }] };
    } catch (e) {
      return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: `Error: ${e.message}` }] };
    }
  }
);

// Online users ────────────────────────────────────────────────────────────────
server.resource(
  'online-users',
  'bambisleep://users/online',
  { description: 'Users active in the last 5 minutes with level and role', mimeType: 'application/json' },
  async (uri) => {
    try {
      const db     = getDb();
      const cutoff = Date.now() - 5 * 60 * 1000;
      const rows   = db.prepare(
        `SELECT username,
                json_extract(progress, '$.level')   AS level,
                json_extract(progress, '$.prestige') AS prestige,
                role, last_seen
         FROM users WHERE last_seen > ? ORDER BY last_seen DESC`
      ).all(cutoff);
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(rows, null, 2) }] };
    } catch (e) {
      return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: `Error: ${e.message}` }] };
    }
  }
);

// Dynamic user resource: bambisleep://users/{username} ────────────────────────
server.resource(
  'user',
  new ResourceTemplate('bambisleep://users/{username}', {
    list: async () => {
      try {
        const db    = getDb();
        const users = db.prepare(
          'SELECT username FROM users ORDER BY last_seen DESC LIMIT 200'
        ).all();
        return {
          resources: users.map((u) => ({
            uri : `bambisleep://users/${encodeURIComponent(u.username)}`,
            name: u.username,
          }))
        };
      } catch { return { resources: [] }; }
    }
  }),
  { description: 'Full user record (progress, stats, challenge, contract, Patreon) for any username', mimeType: 'application/json' },
  async (uri, { username }) => {
    try {
      const db   = getDb();
      const user = db.prepare(
        `SELECT username, role,
                json_extract(progress, '$')                              AS progress,
                json_extract(stats,    '$')                              AS stats,
                json_extract(challenge,'$')                              AS challenge,
                json_extract(contract, '$')                              AS contract,
                json_extract(patreon,  '$.patronStatus')                 AS patron_status,
                json_extract(patreon,  '$.tierName')                     AS tier_name,
                json_extract(patreon,  '$.currentlyEntitledAmountCents') AS patron_cents,
                last_seen, created_at
         FROM users WHERE username = ?`
      ).get(decodeURIComponent(username || ''));
      if (!user) {
        return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'User not found' }] };
      }
      ['progress', 'stats', 'challenge', 'contract'].forEach((k) => {
        try { user[k] = JSON.parse(user[k]); } catch {}
      });
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(user, null, 2) }] };
    } catch (e) {
      return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: `Error: ${e.message}` }] };
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  PROMPTS  (conversation starters with live data embedded)
// ════════════════════════════════════════════════════════════════════════════

server.prompt(
  'welcome_bambi',
  'Draft a warm, on-brand welcome message for a new or returning community member.',
  {
    username: z.string().describe('Username to welcome'),
    context : z.string().optional().describe('Extra context, e.g. "just signed covenant", "returning after 3 months"')
  },
  async ({ username, context }) => {
    let userInfo = '';
    try {
      const db = getDb();
      const u  = db.prepare(
        `SELECT json_extract(progress, '$.level') AS level, role,
                json_extract(patreon, '$.tierName') AS tier,
                json_extract(stats, '$.messagesCount') AS messages
         FROM users WHERE username = ?`
      ).get(username);
      if (u) {
        userInfo = `\nUser data: level ${u.level}, role: ${u.role}, tier: ${u.tier || 'none'}, messages sent: ${u.messages}.`;
      }
    } catch {}
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `You are a warm, playful host for BambiSleep Church — an adult, consent-focused hypnosis community built around the BambiSleep audio series. The tone is caring, slightly playful, and inclusive.\n\nWrite a friendly welcome message (2–4 sentences) for community member **${username}**.${userInfo}${context ? `\nContext: ${context}` : ''}\n\nReference their community progress if relevant. Keep it warm and personal.`
        }
      }]
    };
  }
);

server.prompt(
  'describe_user',
  "Generate a natural-language summary of a community member's profile, stats, and activity.",
  {
    username: z.string().describe('Username to summarise')
  },
  async ({ username }) => {
    let userJson = '(not found)';
    try {
      const db = getDb();
      const u  = db.prepare(
        `SELECT username, role,
                json_extract(progress, '$')          AS progress,
                json_extract(stats,    '$')          AS stats,
                json_extract(patreon,  '$.patronStatus') AS patron_status,
                json_extract(patreon,  '$.tierName') AS tier,
                json_extract(contract, '$.acceptedAt') AS contract_signed,
                json_extract(challenge,'$.status')   AS challenge_status,
                last_seen, created_at
         FROM users WHERE username = ?`
      ).get(username);
      if (u) {
        ['progress', 'stats'].forEach((k) => { try { u[k] = JSON.parse(u[k]); } catch {} });
        userJson = JSON.stringify(u, null, 2);
      }
    } catch {}
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `You are a community assistant summarising a member\'s profile for a moderator. Based on the data below, write a concise 3–5 sentence natural-language summary covering: level/prestige, activity stats, Patreon status, covenant/challenge status, and member age.\n\nUser data:\n\`\`\`json\n${userJson}\n\`\`\``
        }
      }]
    };
  }
);

server.prompt(
  'assign_challenge',
  'Guided step-by-step prompt to assign a Good Girl Timer Challenge to a community member.',
  {
    targetUsername: z.string().describe('Username to assign the challenge to'),
    senderSession : z.string().describe('Your session token (must be patron/creator)'),
    playlistUrl   : z.string().optional().describe('BambiCloud playlist URL — agent will prompt for one if omitted')
  },
  async ({ targetUsername, senderSession, playlistUrl }) => {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `You are an assistant helping assign a Good Girl Timer Challenge on BambiSleep Church.\n\nTarget: **${targetUsername}**\nYour session token: \`${senderSession}\`\n${playlistUrl ? `Playlist URL: ${playlistUrl}` : 'No playlist provided yet.'}\n\nFollow these steps using the available tools:\n1. Call \`get_challenge\` (username: "${targetUsername}", session: your token) — check for an existing active challenge.\n2. If no active challenge exists, optionally call \`request_challenge\` first to start the timer.\n3. ${playlistUrl ? `Call \`validate_playlist_url\` with "${playlistUrl}" to confirm it is a valid BambiCloud playlist.` : 'Ask for a BambiCloud playlist URL, or use \`fetch_playlist\` on a known URL.'}\n4. Call \`assign_task\` (username: "${targetUsername}", session: your token, url: the playlist URL).\n5. Report the assigned task details back.`
        }
      }]
    };
  }
);

server.prompt(
  'moderate_chat',
  'Load recent chat messages and identify any community guideline violations requiring moderation.',
  {
    limit: z.number().int().min(1).max(100).default(30).describe('Number of recent messages to review (default 30)')
  },
  async ({ limit }) => {
    let messagesText = '(could not load messages)';
    try {
      const db   = getDb();
      const rows = db.prepare(
        'SELECT sender, content, created_at FROM messages ORDER BY created_at DESC LIMIT ?'
      ).all(limit);
      messagesText = rows.reverse().map((r) =>
        `[${new Date(r.created_at).toISOString()}] ${r.sender}: ${r.content || '(attachment)'}`
      ).join('\n');
    } catch {}
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `You are a moderation assistant for BambiSleep Church — an adult, consent-focused community.\n\nCommunity guidelines:\n- No harassment, hate speech, or non-consensual content\n- No doxxing or sharing personal information without consent\n- No content involving minors\n- Respect everyone\'s stated boundaries and safe-words\n\nReview the ${limit} most recent messages below. For each message that may violate the guidelines, state: **sender**, **issue**, and **recommended action** (warn / remove / escalate).\n\nMessages:\n\`\`\`\n${messagesText}\n\`\`\``
        }
      }]
    };
  }
);

server.prompt(
  'session_report',
  "Generate a human-readable activity report for a specific community member.",
  {
    username: z.string().describe('Username to report on')
  },
  async ({ username }) => {
    let dataStr = '(user not found)';
    try {
      const db = getDb();
      const u  = db.prepare(
        `SELECT username, role,
                json_extract(progress,  '$') AS progress,
                json_extract(stats,     '$') AS stats,
                json_extract(challenge, '$') AS challenge,
                json_extract(patreon,   '$.tierName')     AS tier,
                json_extract(patreon,   '$.patronStatus') AS patron_status,
                last_seen, created_at
         FROM users WHERE username = ?`
      ).get(username);
      if (u) {
        ['progress', 'stats', 'challenge'].forEach((k) => { try { u[k] = JSON.parse(u[k]); } catch {} });
        const mc = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE sender = ?').get(username);
        u.messages_in_db = mc?.c ?? 0;
        dataStr = JSON.stringify(u, null, 2);
      }
    } catch {}
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Generate a concise activity report for BambiSleep Church member **${username}**, formatted for a community admin.\n\nCover:\n- Current level, XP, prestige\n- Total messages sent, words typed, days active\n- Total session time (convert totalSessionSeconds to h/m)\n- Reactions given and received\n- Active challenge status (if any)\n- Patreon tier (if linked)\n- Member since date\n\nUser data:\n\`\`\`json\n${dataStr}\n\`\`\``
        }
      }]
    };
  }
);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Write to stderr so it doesn't interfere with the MCP stdio protocol
  process.stderr.write('[bambisleep-church MCP] server ready\n');
}

main().catch((e) => {
  process.stderr.write(`[bambisleep-church MCP] fatal: ${e.message}\n`);
  process.exit(1);
});
