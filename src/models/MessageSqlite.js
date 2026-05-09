'use strict';

/**
 * MessageSqlite — CRUD layer for the `messages` table.
 *
 * Every message document is stored as a row with key scalar columns
 * (id, sender, content, author_token, created_at) plus two JSON text
 * columns (avatar_snapshot, reactions) that hold the richer nested data.
 *
 * The public API intentionally mirrors the shape that chatController and
 * reactions.js previously used via Mongoose, so that callers need only
 * minimal changes.
 */

const { randomUUID } = require('crypto');
const { getDb }      = require('../config/sqlite');

// ── Prepared statements (lazy — created on first getDb() call) ───────────────

let _stmts = null;

function stmts() {
  if (_stmts) return _stmts;
  const db = getDb();
  _stmts = {
    insert: db.prepare(`
      INSERT INTO messages
        (id, sender, content, author_token, avatar_snapshot, reactions, attachment, created_at)
      VALUES
        (@id, @sender, @content, @author_token, @avatar_snapshot, '[]', @attachment, @created_at)
    `),
    findAll: db.prepare(`
      SELECT id, sender, content, avatar_snapshot, reactions, attachment, created_at
      FROM   messages
      ORDER  BY created_at ASC
    `),
    findById: db.prepare(`
      SELECT id, sender, content, author_token, avatar_snapshot, reactions, attachment, created_at
      FROM   messages
      WHERE  id = ?
    `),
    updateReactions: db.prepare(`
      UPDATE messages SET reactions = ? WHERE id = ?
    `),
  };
  return _stmts;
}

// ── Row → plain object ────────────────────────────────────────────────────────

/**
 * Convert a raw SQLite row to the plain object shape expected by routes and
 * the socket layer.  author_token is excluded by default (never sent to clients).
 *
 * @param {object} row
 * @param {{ includeToken?: boolean }} opts
 */
function rowToMessage(row, { includeToken = false } = {}) {
  const msg = {
    _id:            row.id,
    sender:         row.sender,
    content:        row.content,
    timestamp:      new Date(row.created_at),
    avatarSnapshot: JSON.parse(row.avatar_snapshot || '{}'),
    reactions:      JSON.parse(row.reactions       || '[]'),
    attachment:     row.attachment ? JSON.parse(row.attachment) : null,
  };
  if (includeToken) msg.authorToken = row.author_token;
  return msg;
}

// ── Public API ────────────────────────────────────────────────────────────────

const MessageSqlite = {
  /**
   * Insert a new message and return the saved document object.
   *
   * @param {{ sender: string, content: string, authorToken?: string, avatarSnapshot?: object, attachment?: object|null }} params
   * @returns {object} Saved message (without authorToken)
   */
  create({ sender, content, authorToken = '', avatarSnapshot = {}, attachment = null }) {
    const s   = stmts();
    const id  = randomUUID();
    const now = Date.now();
    s.insert.run({
      id,
      sender,
      content,
      author_token:     authorToken,
      avatar_snapshot:  JSON.stringify(avatarSnapshot),
      attachment:       attachment ? JSON.stringify(attachment) : null,
      created_at:       now,
    });
    return rowToMessage(
      getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id),
      { includeToken: false },
    );
  },

  /**
   * Return all messages ordered by creation time (ascending).
   * author_token is never included.
   *
   * @returns {object[]}
   */
  findAll() {
    return stmts().findAll.all().map((row) => rowToMessage(row));
  },

  /**
   * Find a single message by its UUID.
   *
   * @param {string} id
   * @param {{ includeToken?: boolean }} opts
   * @returns {object|null}
   */
  findById(id, { includeToken = false } = {}) {
    const row = stmts().findById.get(id);
    return row ? rowToMessage(row, { includeToken }) : null;
  },

  /**
   * Persist an updated reactions array for a message.
   *
   * @param {string} id
   * @param {Array}  reactions
   */
  updateReactions(id, reactions) {
    stmts().updateReactions.run(JSON.stringify(reactions), id);
  },
};

module.exports = MessageSqlite;
