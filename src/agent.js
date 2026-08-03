'use strict';

/**
 * BambiSleep Church — Autonomous Ollama Agent
 *
 * Reads the persona + community guidelines from .github/bambi-church.agent.md,
 * connects to Ollama's OpenAI-compatible API, and runs an autonomous agent
 * loop: observe site state → decide → call tools → repeat.
 *
 * Env vars:
 *   OLLAMA_URL         Base URL of Ollama server       (default: http://localhost:11434)
 *   OLLAMA_MODEL       Model name loaded in Ollama     (default: llama3)
 *   AGENT_INTERVAL_MS  Tick interval in ms             (default: 300000 = 5 min)
 *   AGENT_ENABLED      Set to 'false' to disable       (default: true)
 *   AGENT_NAME         Display name in chat            (default: BambiBot)
 *   AGENT_TOKEN        Session token for chat actions  (required for send_message / react)
 *   BASE_URL           Running Express app URL         (default: http://localhost:3000)
 *   SQLITE_PATH        SQLite DB path                  (default: ./data/app.db)
 */

const http     = require('http');
const https    = require('https');
const path     = require('path');
const fs       = require('fs');
const Database = require('better-sqlite3');
const logger   = require('./utils/logger');

// ─── Config ───────────────────────────────────────────────────────────────────

const OLLAMA_URL        = process.env.OLLAMA_URL         || 'http://localhost:11434';
const OLLAMA_MODEL      = process.env.OLLAMA_MODEL        || 'llama3';
const AGENT_INTERVAL_MS = Number(process.env.AGENT_INTERVAL_MS) || 5 * 60 * 1000;
const AGENT_ENABLED     = process.env.AGENT_ENABLED !== 'false';
const AGENT_NAME        = process.env.AGENT_NAME          || 'BambiBot';
let   AGENT_TOKEN       = process.env.AGENT_TOKEN         || null;
// Fall back to PORT so the agent always calls the correct local server
const BASE_URL          = process.env.BASE_URL            || `http://localhost:${process.env.PORT || 3000}`;
const DB_PATH           = process.env.SQLITE_PATH
  || path.join(__dirname, '../data/app.db');

// Maximum tool-call iterations per tick (safety cap)
const MAX_ITERATIONS = 10;
// Maximum chat messages the agent may send per tick
const MAX_SENDS_PER_TICK = 2;

// ─── DB helper (read-only) ────────────────────────────────────────────────────

let _db = null;
function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return _db;
}

// ─── System prompt loader ─────────────────────────────────────────────────────

let _systemPrompt = null;
function loadSystemPrompt() {
  if (_systemPrompt) return _systemPrompt;
  const file = path.join(__dirname, '../.github/bambi-church.agent.md');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    // Strip YAML frontmatter block (--- ... ---)
    const m = raw.match(/^---[\s\S]*?---\n([\s\S]*)$/);
    _systemPrompt = (m ? m[1] : raw).trim();
  } catch {
    _systemPrompt = 'You are a caring community steward for BambiSleep Church — a warm, consent-focused erotic hypnosis community. Be helpful, warm, and enforce safety guidelines.';
  }
  return _systemPrompt;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function httpJson(rawUrl, method, body) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(rawUrl);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;

    const req = lib.request({
      hostname: parsed.hostname,
      port    : Number(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
      path    : parsed.pathname + parsed.search,
      method,
      headers : {
        'Content-Type' : 'application/json',
        'Accept'       : 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const api = (method, p, body) =>
  httpJson(`${BASE_URL}${p}`, method, body).then((r) => r.body);

// ─── Tool implementations ─────────────────────────────────────────────────────

// Tracks chat sends in the current tick to enforce MAX_SENDS_PER_TICK
let _sendsThisTick = 0;

const TOOLS = {

  // ── Read-only / safe ──

  async get_messages() {
    return api('GET', '/api/chat/messages');
  },

  async get_recent_messages({ limit = 20 } = {}) {
    try {
      const db   = getDb();
      const rows = db.prepare(
        'SELECT sender, content, created_at FROM messages ORDER BY created_at DESC LIMIT ?'
      ).all(Math.min(limit, 100));
      return rows.reverse();
    } catch (e) { return { error: e.message }; }
  },

  async get_site_overview() {
    try {
      const db       = getDb();
      const total    = db.prepare('SELECT COUNT(*) AS c FROM users').get();
      const online   = db.prepare('SELECT COUNT(*) AS c FROM users WHERE last_seen > ?').get(Date.now() - 5 * 60 * 1000);
      const msgs     = db.prepare('SELECT COUNT(*) AS c FROM messages').get();
      const active   = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE json_extract(challenge,'$.status')='active'`).get();
      const topUsers = db.prepare(
        `SELECT username,
                json_extract(progress,'$.level')   AS level,
                json_extract(progress,'$.prestige') AS prestige
         FROM users ORDER BY json_extract(progress,'$.totalXp') DESC LIMIT 5`
      ).all();
      const recent = db.prepare(
        `SELECT sender, content, created_at FROM messages ORDER BY created_at DESC LIMIT 10`
      ).all();
      return {
        users     : { total: total.c, online: online.c },
        messages  : { total: msgs.c, recent },
        challenges: { active: active.c },
        top_users : topUsers,
      };
    } catch (e) { return { error: e.message }; }
  },

  async get_profile({ username }) {
    const tok = AGENT_TOKEN || '';
    return api('GET', `/api/user/profile/${encodeURIComponent(username)}?session=${encodeURIComponent(tok)}`);
  },

  async get_challenge({ username }) {
    const tok = AGENT_TOKEN || '';
    return api('GET', `/api/challenge/${encodeURIComponent(username)}?session=${encodeURIComponent(tok)}`);
  },

  async get_patreon_status({ session } = {}) {
    const tok = session || AGENT_TOKEN || '';
    return api('GET', `/api/patreon/status?session=${encodeURIComponent(tok)}`);
  },

  async fetch_playlist({ url }) {
    return api('GET', `/api/audio/fetch-playlist?url=${encodeURIComponent(url)}`);
  },

  async list_playlist_tracks({ url }) {
    const res     = await api('GET', `/api/audio/fetch-playlist?url=${encodeURIComponent(url)}`);
    const tracks  = (res.tracks || []).filter((t) => !t.locked && t.url);
    return { title: res.title, author: res.author, playable_count: tracks.length, tracks };
  },

  async query_database({ sql }) {
    const upper = sql.trim().toUpperCase();
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
      return { error: 'Only SELECT / WITH queries are allowed' };
    }
    if (/\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|REPLACE)\b/i.test(sql)) {
      return { error: 'Mutation statements are not allowed' };
    }
    try {
      const db = getDb();
      return { rows: db.prepare(sql.trim()).all() };
    } catch (e) { return { error: e.message }; }
  },

  // ── Write / action tools (guarded) ──

  async send_message({ content }) {
    if (_sendsThisTick >= MAX_SENDS_PER_TICK) {
      return { error: `Send limit (${MAX_SENDS_PER_TICK}) reached for this tick` };
    }
    if (!AGENT_TOKEN) {
      return { error: 'AGENT_TOKEN is not configured — cannot send messages' };
    }
    _sendsThisTick++;
    return api('POST', '/api/chat/messages', {
      sender : AGENT_NAME,
      content,
      token  : AGENT_TOKEN,
    });
  },

  async react_to_message({ id, emoji }) {
    if (!AGENT_TOKEN) {
      return { error: 'AGENT_TOKEN is not configured — cannot react to messages' };
    }
    return api('POST', `/api/messages/${encodeURIComponent(id)}/react`, {
      emoji,
      token: AGENT_TOKEN,
    });
  },
};

// ─── OpenAI-compatible tools schema ──────────────────────────────────────────

const TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name       : 'get_site_overview',
      description: 'Get a real-time snapshot: online users, message count, active challenges, top users by XP, and the 10 most recent messages.',
      parameters : { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'get_recent_messages',
      description: 'Fetch the N most recent chat messages (oldest-first).',
      parameters : {
        type      : 'object',
        properties: { limit: { type: 'integer', description: 'Number of messages to return (max 100, default 20)' } },
        required  : [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'get_profile',
      description: 'Fetch a community member\'s public profile — level, stats, Patreon tier, contract, and challenge status.',
      parameters : {
        type      : 'object',
        properties: { username: { type: 'string', description: 'Username to fetch' } },
        required  : ['username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'get_challenge',
      description: 'Get the current Good Girl Timer Challenge status for a community member.',
      parameters : {
        type      : 'object',
        properties: { username: { type: 'string' } },
        required  : ['username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'fetch_playlist',
      description: 'Fetch a BambiCloud playlist by URL — returns metadata and all tracks.',
      parameters : {
        type      : 'object',
        properties: { url: { type: 'string', description: 'BambiCloud playlist URL' } },
        required  : ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'get_patreon_status',
      description: 'Check Patreon patron status for a member.',
      parameters : {
        type      : 'object',
        properties: { session: { type: 'string', description: 'Session token (optional — defaults to agent token)' } },
        required  : [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'query_database',
      description: 'Run a read-only SQL SELECT query against the SQLite database for custom analytics.',
      parameters : {
        type      : 'object',
        properties: { sql: { type: 'string', description: 'SELECT / WITH query only — no mutations' } },
        required  : ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'send_message',
      description: `Post a message to the community chat as ${AGENT_NAME}. Limit: ${MAX_SENDS_PER_TICK} sends per tick.`,
      parameters : {
        type      : 'object',
        properties: { content: { type: 'string', description: 'Message text to post' } },
        required  : ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name       : 'react_to_message',
      description: 'Add an emoji reaction to a chat message.',
      parameters : {
        type      : 'object',
        properties: {
          id   : { type: 'string', description: 'Message ID' },
          emoji: { type: 'string', description: 'Emoji character to react with' },
        },
        required: ['id', 'emoji'],
      },
    },
  },
];

// ─── Ollama API call ────────────────────────────────────────────────────────

async function callLLM(messages) {
  const res = await httpJson(`${OLLAMA_URL}/v1/chat/completions`, 'POST', {
    model      : OLLAMA_MODEL,
    messages,
    tools      : TOOLS_SCHEMA,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens : 1024,
  });
  if (res.status !== 200) {
    throw new Error(`Ollama returned HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
  }
  return res.body;
}

// ─── Execute a tool call ──────────────────────────────────────────────────────

async function executeTool(name, args) {
  const fn = TOOLS[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  try {
    return await fn(args || {});
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Build context snapshot for the agent's user message ─────────────────────

async function buildContext() {
  const overview = await TOOLS.get_site_overview();
  const lines    = [
    `Time: ${new Date().toISOString()}`,
    `Online now: ${overview.users?.online ?? '?'} / Total users: ${overview.users?.total ?? '?'}`,
    `Total messages: ${overview.messages?.total ?? '?'}`,
    `Active challenges: ${overview.challenges?.active ?? '?'}`,
  ];
  if (overview.top_users?.length) {
    lines.push('Top 5 by XP: ' + overview.top_users.map((u) => `${u.username}(Lv${u.level})`).join(', '));
  }
  if (overview.messages?.recent?.length) {
    lines.push('\nLast 5 chat messages:');
    overview.messages.recent.slice(0, 5).forEach((m) => {
      const ts   = new Date(m.created_at).toLocaleTimeString();
      const body = (m.content || '(attachment)').slice(0, 100);
      lines.push(`  [${ts}] ${m.sender}: ${body}`);
    });
  }
  return lines.join('\n');
}

// ─── Agent tick ───────────────────────────────────────────────────────────────

async function agentTick(triggeredByMessage = false) {
  _sendsThisTick = 0; // reset per-tick send counter

  try {
    logger.info(`[BambiAgent] tick starting (trigger: ${triggeredByMessage ? 'message' : 'interval'})`);
    logger.info(`[BambiAgent] token: ${AGENT_TOKEN ? AGENT_TOKEN.slice(0, 8) + '…' : 'NOT SET'}`);

    const context  = await buildContext();
    logger.info(`[BambiAgent] context built:\n${context}`);

    const userPrompt = triggeredByMessage
      ? [
          'A community member just sent a message. Read the recent messages below and reply as BambiBot.',
          'You MUST call send_message to post a reply — do not stay silent.',
          '',
          '**Current state:**',
          '```',
          context,
          '```',
          '',
          `- Keep your reply concise, warm, and on-theme`,
          `- You may send at most ${MAX_SENDS_PER_TICK} messages`,
          '- Do NOT send buttplug commands, assign challenges, or sign contracts',
        ].join('\n')
      : [
          'You are running autonomously. Review the current site state below and decide what — if anything — to do.',
          '',
          '**Current state:**',
          '```',
          context,
          '```',
          '',
          'Guidelines for autonomous operation:',
          `- You may send at most ${MAX_SENDS_PER_TICK} chat messages per tick`,
          '- Prioritise: welcoming new/recently-active members, reacting to messages warmly, checking on members with active challenges',
          '- Do NOT send buttplug commands autonomously — those require explicit real-time consent',
          '- Do NOT assign challenges or sign contracts autonomously',
          '- It is perfectly fine to observe and take no action if nothing requires attention',
          '- Be concise and warm in any messages you post',
        ].join('\n');

    const messages = [
      { role: 'system', content: loadSystemPrompt() },
      { role: 'user',   content: userPrompt },
    ];

    let response = await callLLM(messages);
    if (!response?.choices?.[0]) {
      logger.warn('[BambiAgent] no response from Ollama');
      return;
    }
    const firstChoice = response.choices[0];
    logger.info(`[BambiAgent] LLM finish_reason: ${firstChoice.finish_reason}`);
    if (firstChoice.message?.content) {
      logger.info(`[BambiAgent] LLM content: ${firstChoice.message.content.slice(0, 200)}`);
    }
    if (firstChoice.message?.tool_calls?.length) {
      logger.info(`[BambiAgent] LLM tool_calls: ${firstChoice.message.tool_calls.map((t) => t.function?.name).join(', ')}`);
    }
    messages.push(firstChoice.message);

    // Tool-call loop
    let iterations = 0;
    while (
      response.choices?.[0]?.finish_reason === 'tool_calls' &&
      iterations++ < MAX_ITERATIONS
    ) {
      const toolCalls = response.choices[0].message.tool_calls || [];
      for (const call of toolCalls) {
        let args = {};
        try { args = JSON.parse(call.function?.arguments || '{}'); } catch {}
        const result = await executeTool(call.function.name, args);
        logger.info(`[BambiAgent] tool ${call.function.name} → ${JSON.stringify(result).slice(0, 120)}`);
        messages.push({
          role        : 'tool',
          tool_call_id: call.id,
          content     : JSON.stringify(result),
        });
      }
      response = await callLLM(messages);
      if (!response?.choices?.[0]) break;
      messages.push(response.choices[0].message);
    }

    const sentViaTools = _sendsThisTick > 0;
    const final = response.choices?.[0]?.message?.content;
    if (final) {
      logger.info(`[BambiAgent] concluded: ${final.slice(0, 200)}`);
      // LLM replied with prose instead of calling send_message — post it directly
      if (triggeredByMessage && !sentViaTools && AGENT_TOKEN) {
        await TOOLS.send_message({ content: final });
      }
    }
    logger.info('[BambiAgent] tick complete');

  } catch (err) {
    // Non-fatal: log and wait for next tick
    // AggregateError wraps dual-stack (IPv4+IPv6) ECONNREFUSED when Ollama is down
    const isConnRefused = (e) => e.code === 'ECONNREFUSED' || (e.message || '').includes('ECONNREFUSED');
    const unreachable   = isConnRefused(err) || (Array.isArray(err.errors) && err.errors.some(isConnRefused));
    if (unreachable) {
      logger.warn('[BambiAgent] Ollama not reachable — skipping tick');
    } else {
      logger.error('[BambiAgent] tick error:', err.message || String(err));
    }
  }
}

// ─── Bot user auto-registration ─────────────────────────────────────────────

async function ensureAgentToken() {
  if (AGENT_TOKEN) return;
  try {
    const db  = getDb();
    const row = db.prepare('SELECT sessionToken FROM users WHERE username = ? LIMIT 1').get(AGENT_NAME);
    if (row?.sessionToken) {
      AGENT_TOKEN = row.sessionToken;
      logger.info(`[BambiAgent] reused existing bot account for "${AGENT_NAME}"`);
      return;
    }
    // Register a new bot user via the local API
    const res = await api('POST', '/api/user', { username: AGENT_NAME });
    if (res?.token) {
      AGENT_TOKEN = res.token;
      logger.info(`[BambiAgent] registered new bot account for "${AGENT_NAME}"`);
    } else {
      logger.warn('[BambiAgent] bot registration returned no token — will stay read-only');
    }
  } catch (e) {
    logger.warn('[BambiAgent] bot registration failed:', e.message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _timer = null;

async function startAgent() {
  if (!AGENT_ENABLED) {
    logger.info('[BambiAgent] disabled (set AGENT_ENABLED=true to enable)');
    return;
  }
  await ensureAgentToken();
  logger.info(
    `[BambiAgent] starting — model: ${OLLAMA_MODEL}, interval: ${AGENT_INTERVAL_MS}ms, ` +
    `token: ${AGENT_TOKEN ? 'set' : 'NOT SET (read-only mode)'}`
  );
  // First tick 10 s after server boot (give the DB and routes time to initialise)
  setTimeout(agentTick, 10_000);
  _timer = setInterval(agentTick, AGENT_INTERVAL_MS);
}

function stopAgent() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    logger.info('[BambiAgent] stopped');
  }
}

// Debounced trigger — coalesces rapid messages into one tick
let _messageDebounce = null;
function onMessage() {
  if (!AGENT_ENABLED) return;
  clearTimeout(_messageDebounce);
  _messageDebounce = setTimeout(() => agentTick(true), 2_000);
}

module.exports = { startAgent, stopAgent, onMessage };

