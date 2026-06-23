'use strict';

/**
 * UserSqlite — CRUD layer for the `users` table.
 *
 * All nested objects (avatar, progress, stats, patreon) are stored as JSON
 * text columns.  The public API mirrors the shape that controllers previously
 * used via Mongoose, so callers need minimal changes.
 */

const { randomUUID, scryptSync, randomBytes, timingSafeEqual } = require('crypto');
const { getDb }      = require('../config/sqlite');

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultProgress = () => ({
  xp:       0,
  totalXp:  0,
  level:    1,
  prestige: 0,
});

const defaultStats = () => ({
  messagesCount:       0,
  wordsCount:          0,
  totalSessionSeconds: 0,
  uniqueDaysActive:    [],
  reactionsReceived:   0,
  reactionsGiven:      0,
});

const defaultPatreon = () => ({
  userId:                       null,
  accessToken:                  null,
  refreshToken:                 null,
  tokenExpiry:                  null,
  patronStatus:                 null,
  currentlyEntitledAmountCents: 0,
  tierId:                       null,
  tierName:                     null,
  fullName:                     null,
  thumbUrl:                     null,
  linkedAt:                     null,
});

// Good Girl timer challenge.
// status: 'none' | 'active' | 'completed' | 'failed'
// tasks: [{ id, playlistId, playlistUrl, title, totalSeconds,
//           listenedSeconds, complete, assignedBy, assignedAt }]
const defaultChallenge = () => ({
  status:          'none',
  requestedAt:     null,
  deadlineAt:      null,
  durationSeconds: 0,
  completedAt:     null,
  tasks:           [],
});

// Bambi Covenant — signed contract record
const defaultContract = () => ({
  acceptedAt: null,
  version:    null,
  username:   null,
});

// ── Prepared statements (lazy) ────────────────────────────────────────────────

let _stmts = null;

function stmts() {
  if (_stmts) return _stmts;
  const db = getDb();
  _stmts = {
    insert: db.prepare(`
      INSERT INTO users
        (id, username, session_token, role, progress, stats, patreon, challenge, password_hash, contract, last_seen, created_at, updated_at)
      VALUES
        (@id, @username, @session_token, @role, @progress, @stats, @patreon, @challenge, @password_hash, @contract, @last_seen, @created_at, @updated_at)
    `),
    findByToken: db.prepare(`
      SELECT * FROM users WHERE session_token = ? LIMIT 1
    `),
    findByUsername: db.prepare(`
      SELECT * FROM users WHERE username = ? LIMIT 1
    `),
    findByPatreonUserId: db.prepare(`
      SELECT * FROM users WHERE json_extract(patreon, '$.userId') = ?
    `),
    findByTokens: db.prepare(`
      SELECT * FROM users WHERE session_token IN (SELECT value FROM json_each(?))
    `),
    updateAll: db.prepare(`
      UPDATE users
      SET username      = @username,
          role          = @role,
          progress      = @progress,
          stats         = @stats,
          patreon       = @patreon,
          challenge     = @challenge,
          password_hash = @password_hash,
          contract      = @contract,
          last_seen     = @last_seen,
          updated_at    = @updated_at
      WHERE session_token = @session_token
    `),
    setPasswordAndContract: db.prepare(`
      UPDATE users
      SET password_hash = @password_hash,
          contract      = @contract,
          updated_at    = @updated_at
      WHERE id = @id
    `),
    updatePatreonByUserId: db.prepare(`
      UPDATE users
      SET patreon    = json_patch(patreon, @patch),
          updated_at = @updated_at
      WHERE json_extract(patreon, '$.userId') = @patreon_user_id
    `),
    clearPatreonByToken: db.prepare(`
      UPDATE users
      SET patreon    = @patreon,
          updated_at = @updated_at
      WHERE session_token = @session_token
    `),
  };
  return _stmts;
}

// ── Row → plain object ────────────────────────────────────────────────────────

function rowToUser(row) {
  if (!row) return null;
  return {
    _id:          row.id,
    username:     row.username,
    sessionToken: row.session_token,
    role:         row.role || 'user',
    progress:     JSON.parse(row.progress || '{}'),
    stats:        JSON.parse(row.stats    || '{}'),
    patreon:      JSON.parse(row.patreon  || '{}'),
    challenge:    { ...defaultChallenge(), ...JSON.parse(row.challenge || '{}') },
    password_hash: row.password_hash || null,
    contract:      { ...defaultContract(), ...JSON.parse(row.contract || '{}') },
    lastSeen:     new Date(row.last_seen),
    createdAt:    new Date(row.created_at),
    updatedAt:    new Date(row.updated_at),
  };
}

// ── Saveable proxy ────────────────────────────────────────────────────────────
// Returns a plain object augmented with a save() method so controllers can
// do `user.field = x; await user.save()` just like Mongoose.

function makeUser(row) {
  const u = rowToUser(row);
  if (!u) return null;
  u.save = async function () {
    const now = Date.now();
    stmts().updateAll.run({
      username:      this.username,
      role:          this.role || 'user',

      progress:      JSON.stringify(this.progress),
      stats:         JSON.stringify(this.stats),
      patreon:       JSON.stringify(this.patreon),
      challenge:     JSON.stringify(this.challenge || defaultChallenge()),
      password_hash: this.password_hash || null,
      contract:      JSON.stringify(this.contract || defaultContract()),
      last_seen:     this.lastSeen instanceof Date ? this.lastSeen.getTime() : Date.now(),
      updated_at:    now,
      session_token: this.sessionToken,
    });
    this.updatedAt = new Date(now);
  };
  return u;
}

// ── Password helpers ─────────────────────────────────────────────────────────

/**
 * Hash a plain-text password using scrypt (Node.js built-in crypto).
 * Returns a 'salt:hash' string safe to persist in the database.
 */
function hashPassword(plain) {
  const salt   = randomBytes(16).toString('hex');
  const keyBuf = scryptSync(plain, salt, 64);
  return `${salt}:${keyBuf.toString('hex')}`;
}

/**
 * Verify a plain-text password against a stored 'salt:hash' string.
 * Uses timingSafeEqual to prevent timing-based side-channel attacks.
 */
function verifyPassword(plain, stored) {
  if (!stored) return false;
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  try {
    const hashBuf    = Buffer.from(hashHex, 'hex');
    const derivedBuf = scryptSync(plain, salt, 64);
    return timingSafeEqual(hashBuf, derivedBuf);
  } catch {
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const UserSqlite = {
  /**
   * Create a new user row and return a saveable user object.
   */
  create({ username, sessionToken, role, progress, stats, patreon } = {}) {
    const s   = stmts();
    const id  = randomUUID();
    const now = Date.now();
    s.insert.run({
      id,
      username,
      session_token: sessionToken,
      role: role || 'user',
      progress: JSON.stringify({ ...defaultProgress(), ...(progress || {}) }),
      stats:    JSON.stringify({ ...defaultStats(),    ...(stats    || {}) }),
      patreon:  JSON.stringify({ ...defaultPatreon(),  ...(patreon  || {}) }),
      challenge:     JSON.stringify(defaultChallenge()),
      password_hash: null,
      contract:      JSON.stringify(defaultContract()),
      last_seen:  now,
      created_at: now,
      updated_at: now,
    });
    return makeUser(getDb().prepare('SELECT * FROM users WHERE id = ?').get(id));
  },

  /** Find a user by session token.  Returns saveable user or null. */
  findOne({ sessionToken, username, patreonUserId } = {}) {
    const s = stmts();
    let row;
    if (sessionToken) row = s.findByToken.get(sessionToken);
    else if (username) row = s.findByUsername.get(username);
    else if (patreonUserId) row = s.findByPatreonUserId.get(patreonUserId);
    return makeUser(row || null);
  },

  /** Find a user by session token and return a plain lean object (no save()). */
  findOneLean({ sessionToken, username } = {}) {
    const s = stmts();
    let row;
    if (sessionToken) row = s.findByToken.get(sessionToken);
    else if (username) row = s.findByUsername.get(username);
    return rowToUser(row || null);
  },

  /**
   * Find multiple users by their session tokens.
   * Returns array of plain objects (no save()).
   */
  findByTokens(tokens = []) {
    if (!tokens.length) return [];
    return stmts().findByTokens.all(JSON.stringify(tokens)).map(rowToUser);
  },

  /**
   * findOneAndUpdate — update patreon sub-object fields by session token.
   * Mirrors the Mongoose findOneAndUpdate used in patreon route.
   * @param {{ sessionToken: string }} filter
   * @param {{ $set: object }} update  — only $set is supported
   */
  findOneAndUpdate({ sessionToken }, { $set }) {
    const db = getDb();
    return db.transaction(() => {
      const user = this.findOne({ sessionToken });
      if (!user) return null;
      // Apply $set — supports dot-notation keys like 'patreon.userId'
      for (const [dotKey, val] of Object.entries($set)) {
        const parts = dotKey.split('.');
        let obj = user;
        for (let i = 0; i < parts.length - 1; i++) {
          if (obj[parts[i]] == null) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = val;
      }
      user.save();
      return user;
    })();
  },

  /**
   * updateMany — update patreon sub-object for all users with a given patreonUserId.
   * Mirrors Mongoose updateMany used in patreon webhook handler.
   */
  updateManyByPatreonUserId(patreonUserId, { $set }) {
    const db = getDb();
    db.transaction(() => {
      const rows = stmts().findByPatreonUserId.all(patreonUserId);
      rows.forEach((row) => {
        const user = makeUser(row);
        for (const [dotKey, val] of Object.entries($set)) {
          const parts = dotKey.split('.');
          let obj = user;
          for (let i = 0; i < parts.length - 1; i++) {
            if (obj[parts[i]] == null) obj[parts[i]] = {};
            obj = obj[parts[i]];
          }
          obj[parts[parts.length - 1]] = val;
        }
        user.save();
      });
    })();
  },

  /**
   * Save a new password hash and contract record for a user by internal ID.
   * Faster than a full save() — only touches those two columns.
   */
  setPasswordAndContract(userId, passwordHash, contractObj) {
    stmts().setPasswordAndContract.run({
      id:            userId,
      password_hash: passwordHash,
      contract:      JSON.stringify(contractObj),
      updated_at:    Date.now(),
    });
  },

  /** Default progress/stats/patreon factories (for controllers). */
  defaultProgress,
  defaultStats,
  defaultPatreon,
  defaultChallenge,
  defaultContract,
  /** Hash a plain-text password (scrypt). */
  hashPassword,
  /** Verify a plain-text password against a stored hash. */
  verifyPassword,
};

module.exports = UserSqlite;
