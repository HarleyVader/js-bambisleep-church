'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const logger   = require('../utils/logger');

const DB_PATH = process.env.SQLITE_PATH
  || path.join(__dirname, '../../data/app.db');

/** Singleton DB handle — populated by initSqlite(). */
let _db = null;

/** Return the open DB handle; throws if initSqlite() has not been called. */
const getDb = () => {
  if (!_db) throw new Error('SQLite not initialized. Call initSqlite() first.');
  return _db;
};

/**
 * Open (or create) the SQLite database, enable WAL mode, and run schema
 * migrations idempotently.  Safe to call multiple times.
 */
const initSqlite = () => {
  if (_db) return _db;

  // Ensure the data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);

  // WAL for better concurrent read performance
  _db.pragma('journal_mode = WAL');
  // Enforce referential integrity
  _db.pragma('foreign_keys = ON');

  // ── Schema ──────────────────────────────────────────────────────────────────
  _db.exec(`
    -- Chat messages
    -- avatar_snapshot, reactions, and attachment are stored as JSON text columns
    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT    PRIMARY KEY,
      sender          TEXT    NOT NULL,
      content         TEXT    NOT NULL DEFAULT '',
      author_token    TEXT    NOT NULL DEFAULT '',
      avatar_snapshot TEXT    NOT NULL DEFAULT '{}',
      reactions       TEXT    NOT NULL DEFAULT '[]',
      attachment      TEXT             DEFAULT NULL,
      created_at      INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_created
      ON messages (created_at ASC);

    CREATE INDEX IF NOT EXISTS idx_messages_author
      ON messages (author_token)
      WHERE author_token != '';

    -- Users
    -- All nested objects (avatar, progress, stats, patreon) stored as JSON
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT    PRIMARY KEY,
      username        TEXT    NOT NULL,
      session_token   TEXT    NOT NULL UNIQUE,
      role            TEXT    NOT NULL DEFAULT 'user',
      avatar          TEXT    NOT NULL DEFAULT '{}',
      progress        TEXT    NOT NULL DEFAULT '{}',
      stats           TEXT    NOT NULL DEFAULT '{}',
      patreon         TEXT    NOT NULL DEFAULT '{}',
      last_seen       INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL DEFAULT 0,
      updated_at      INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_session
      ON users (session_token);

    CREATE INDEX IF NOT EXISTS idx_users_username
      ON users (username);
  `);

  // ── Idempotent column migrations (for existing DBs) ──────────────────────
  const cols = _db.pragma('table_info(messages)').map((c) => c.name);
  if (!cols.includes('attachment')) {
    _db.exec('ALTER TABLE messages ADD COLUMN attachment TEXT DEFAULT NULL');
    logger.info('SQLite migration: added attachment column');
  }

  const userCols = _db.pragma('table_info(users)').map((c) => c.name);
  if (!userCols.includes('role')) {
    _db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
    logger.info('SQLite migration: added role column to users');
  }

  logger.info(`SQLite ready: ${DB_PATH}`);
  return _db;
};

module.exports = { initSqlite, getDb };
