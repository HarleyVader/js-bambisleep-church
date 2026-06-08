'use strict';

/**
 * Good Girl Timer Challenge routes.
 *
 *   POST /api/challenge/request           — start a challenge for yourself (patron-gated)
 *   POST /api/challenge/:username/task    — assign a BambiCloud playlist task to a bambi
 *   POST /api/challenge/progress          — report real playback progress on a task
 *   GET  /api/challenge/:username          — read a bambi's challenge state (patron-gated)
 *
 * A challenge counts down toward a fixed deadline. It stays "locked" (active)
 * until every assigned playlist task has been fully listened (cumulative real
 * playback). Finishing all tasks before the deadline = completed; the deadline
 * passing first = failed.
 */

const express  = require('express');
const { randomUUID } = require('crypto');

const User      = require('../models/UserSqlite');
const { extractPlaylistUuid, fetchPlaylist } = require('../utils/bambicloud');
const { awardXp } = require('../utils/xpService');
const { XP_RATES } = require('../config/xpConfig');
const logger    = require('../utils/logger');

const router = express.Router();

// Allowed challenge durations (seconds): 1h, 6h, 24h.
const DURATION_PRESETS = new Set([3600, 21600, 86400]);
const DEFAULT_DURATION = 86400;

// Per-progress-report anti-cheat caps (seconds).
const FIRST_REPORT_CAP = 15; // first report on a task can credit at most this
const REPORT_GRACE     = 2;  // allowance over wall-clock between reports

/** Patron/creator access check (mirrors userController.getPublicProfile). */
function accessCheck(viewer) {
  const creatorPatreonId = (process.env.PATREON_CREATOR_USER_ID || '').trim();
  const isCreator = viewer.role === 'creator'
                    || (creatorPatreonId && viewer.patreon?.userId === creatorPatreonId);
  const isPatron  = viewer.patreon?.patronStatus === 'active_patron'
                    && (viewer.patreon?.currentlyEntitledAmountCents || 0) >= 200;
  return { isCreator, isPatron, allowed: !!(isCreator || isPatron) };
}

/**
 * Lazily expire an active challenge whose deadline has passed.
 * Mutates the challenge object; returns true if the status changed.
 */
function expireIfNeeded(ch) {
  if (ch.status === 'active' && ch.deadlineAt && Date.now() > ch.deadlineAt) {
    const allComplete = ch.tasks.length > 0 && ch.tasks.every((t) => t.complete);
    ch.status = allComplete ? 'completed' : 'failed';
    if (allComplete && !ch.completedAt) ch.completedAt = Date.now();
    return true;
  }
  return false;
}

/** Strip server-only bookkeeping before sending a challenge to clients. */
function publicChallenge(ch) {
  return {
    status:          ch.status,
    requestedAt:     ch.requestedAt,
    deadlineAt:      ch.deadlineAt,
    durationSeconds: ch.durationSeconds,
    completedAt:     ch.completedAt,
    tasks: (ch.tasks || []).map((t) => ({
      id:              t.id,
      playlistId:      t.playlistId,
      playlistUrl:     t.playlistUrl,
      title:           t.title,
      totalSeconds:    t.totalSeconds,
      listenedSeconds: t.listenedSeconds,
      complete:        t.complete,
      assignedBy:      t.assignedBy,
      assignedAt:      t.assignedAt,
    })),
  };
}

/** Lazily require socket emitters to avoid an init-time circular dependency. */
function emitChallengeUpdate(username, challenge) {
  try {
    const { emitToUsername } = require('../sockets/chatSocket');
    emitToUsername(username, 'challenge:update', publicChallenge(challenge));
  } catch (err) {
    logger.error('challenge emit error', err);
  }
}

// ── POST /api/challenge/request ───────────────────────────────────────────────
// Body: { session, durationSeconds }
router.post('/request', async (req, res) => {
  try {
    const token = (req.body.session || '').trim();
    if (!token) return res.status(401).json({ error: 'Session token required' });

    const user = User.findOne({ sessionToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    if (!accessCheck(user).allowed) {
      return res.status(403).json({ error: 'Good Girl Patreon tier required', gated: true });
    }

    let duration = parseInt(req.body.durationSeconds, 10);
    if (!DURATION_PRESETS.has(duration)) duration = DEFAULT_DURATION;

    const now = Date.now();
    user.challenge = {
      ...User.defaultChallenge(),
      status:          'active',
      requestedAt:     now,
      deadlineAt:      now + duration * 1000,
      durationSeconds: duration,
      tasks:           [],
    };
    await user.save();

    emitChallengeUpdate(user.username, user.challenge);
    return res.json(publicChallenge(user.challenge));
  } catch (err) {
    logger.error('challenge request error', err);
    return res.status(500).json({ error: 'Failed to start challenge' });
  }
});

// ── POST /api/challenge/:username/task ────────────────────────────────────────
// Body: { session, url }
router.post('/:username/task', async (req, res) => {
  try {
    const token = (req.body.session || '').trim();
    if (!token) return res.status(401).json({ error: 'Session token required' });

    const assigner = User.findOneLean({ sessionToken: token });
    if (!assigner) return res.status(401).json({ error: 'Invalid session' });
    if (!accessCheck(assigner).allowed) {
      return res.status(403).json({ error: 'Good Girl Patreon tier required', gated: true });
    }

    const targetName = (req.params.username || '').slice(0, 64);
    const target = User.findOne({ username: targetName });
    if (!target) return res.status(404).json({ error: 'Bambi not found' });

    if (!target.challenge) target.challenge = User.defaultChallenge();
    if (expireIfNeeded(target.challenge)) await target.save();
    if (target.challenge.status !== 'active') {
      return res.status(409).json({ error: 'This bambi has no active challenge.' });
    }

    const url  = (req.body.url || '').trim();
    const uuid = extractPlaylistUuid(url);
    if (!uuid) {
      return res.status(400).json({ error: 'Provide a valid bambicloud.com/playlist/<uuid> URL.' });
    }

    if (target.challenge.tasks.some((t) => t.playlistId === uuid)) {
      return res.status(409).json({ error: 'That playlist is already on her contract.' });
    }

    let playlist;
    try {
      playlist = await fetchPlaylist(uuid);
    } catch (err) {
      return res.status(502).json({ error: 'Failed to fetch playlist', detail: err.message });
    }
    if (!playlist) return res.status(404).json({ error: 'Playlist not found or not public.' });
    if (!playlist.playableSeconds) {
      return res.status(400).json({ error: 'That playlist has no playable (unlocked) tracks.' });
    }

    const now  = Date.now();
    const task = {
      id:              randomUUID(),
      playlistId:      playlist.id,
      playlistUrl:     url,
      title:           playlist.title,
      totalSeconds:    playlist.playableSeconds,
      listenedSeconds: 0,
      complete:        false,
      assignedBy:      assigner.username,
      assignedAt:      now,
      lastProgressAt:  null,
    };
    target.challenge.tasks.push(task);
    await target.save();

    emitChallengeUpdate(target.username, target.challenge);
    return res.json({ ok: true, challenge: publicChallenge(target.challenge) });
  } catch (err) {
    logger.error('challenge task error', err);
    return res.status(500).json({ error: 'Failed to assign task' });
  }
});

// ── POST /api/challenge/progress ──────────────────────────────────────────────
// Body: { session, playlistId, deltaSeconds }
router.post('/progress', async (req, res) => {
  try {
    const token = (req.body.session || '').trim();
    if (!token) return res.status(401).json({ error: 'Session token required' });

    const user = User.findOne({ sessionToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    if (!user.challenge) user.challenge = User.defaultChallenge();
    const ch = user.challenge;

    if (expireIfNeeded(ch)) {
      await user.save();
      return res.json(publicChallenge(ch));
    }
    if (ch.status !== 'active') {
      return res.json(publicChallenge(ch));
    }

    const task = ch.tasks.find((t) => t.playlistId === req.body.playlistId);
    if (!task) return res.status(404).json({ error: 'No such task on your contract.' });

    const now   = Date.now();
    const since = task.lastProgressAt ? (now - task.lastProgressAt) / 1000 : null;
    let delta   = Math.max(0, Number(req.body.deltaSeconds) || 0);
    // Anti-cheat: never credit more than real wall-clock time elapsed.
    const cap   = since == null ? FIRST_REPORT_CAP : since + REPORT_GRACE;
    delta = Math.min(delta, cap);

    if (!task.complete) {
      task.listenedSeconds = Math.min(task.totalSeconds, (task.listenedSeconds || 0) + delta);
      if (task.listenedSeconds >= task.totalSeconds) task.complete = true;
    }
    task.lastProgressAt = now;

    let xpResult = {};
    const allComplete = ch.tasks.length > 0 && ch.tasks.every((t) => t.complete);
    if (allComplete && ch.status === 'active') {
      ch.status      = 'completed';
      ch.completedAt = now;
      xpResult = awardXp(user, XP_RATES.CHALLENGE_COMPLETED);
    }

    await user.save();

    emitChallengeUpdate(user.username, ch);
    if (xpResult.leveledUp || ch.status === 'completed') {
      try {
        const { emitToToken } = require('../sockets/chatSocket');
        emitToToken(token, 'profile:update', { progress: user.progress });
      } catch (_) { /* ignore */ }
    }

    return res.json({
      challenge: publicChallenge(ch),
      xpGained:  ch.completedAt === now ? XP_RATES.CHALLENGE_COMPLETED : 0,
      ...xpResult,
    });
  } catch (err) {
    logger.error('challenge progress error', err);
    return res.status(500).json({ error: 'Failed to record progress' });
  }
});

// ── GET /api/challenge/:username?session=<viewerToken> ────────────────────────
router.get('/:username', async (req, res) => {
  try {
    const viewerToken = (req.query.session || '').trim();
    if (!viewerToken) return res.status(401).json({ error: 'Session token required' });

    const viewer = User.findOneLean({ sessionToken: viewerToken });
    if (!viewer) return res.status(401).json({ error: 'Invalid session' });
    if (!accessCheck(viewer).allowed) {
      return res.status(403).json({ error: 'Good Girl Patreon tier required', gated: true });
    }

    const target = User.findOne({ username: (req.params.username || '').slice(0, 64) });
    if (!target) return res.status(404).json({ error: 'Bambi not found' });

    if (!target.challenge) target.challenge = User.defaultChallenge();
    if (expireIfNeeded(target.challenge)) await target.save();

    return res.json(publicChallenge(target.challenge));
  } catch (err) {
    logger.error('challenge read error', err);
    return res.status(500).json({ error: 'Failed to read challenge' });
  }
});

module.exports = router;
