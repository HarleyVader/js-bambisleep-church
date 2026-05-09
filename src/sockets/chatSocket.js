'use strict';

const User = require('../models/UserSqlite');
const MessageSqlite = require('../models/MessageSqlite');
const { processSessionEnd } = require('../controllers/userController');
const logger = require('../utils/logger');

// token → socket map (module-level, shared with controllers)
const tokenToSocket = new Map();

/** Emit an event to a specific user's socket (if connected). */
const emitToToken = (token, event, data) => {
  const socket = tokenToSocket.get(token);
  if (socket) socket.emit(event, data);
};

/** Build the online-users list for broadcast. */
const buildOnlineUsers = () => {
  const tokens = [...tokenToSocket.keys()];
  if (tokens.length === 0) return [];
  const users = User.findByTokens(tokens);
  return users.map((u) => ({
    username:       u.username,
    level:          u.progress.level,
  }));
};

const setupSockets = (io) => {
  io.on('connection', async (socket) => {
    const token = socket.handshake.query.token;

    if (token) {
      tokenToSocket.set(token, socket);
      socket.data.token = token;
      socket.data.sessionStart = Date.now();
    }

    logger.info(`Socket connected: ${socket.id}`);

    // Broadcast updated online users to everyone
    try {
      const onlineUsers = buildOnlineUsers();
      io.emit('onlineUsers', onlineUsers);
    } catch (err) {
      logger.error('onlineUsers build error', err);
    }

    // Re-lookup the message from the DB before broadcasting so clients can't
    // spoof sender/content/_id. Only the trusted persisted row is rebroadcast.
    socket.on('chatMessage', (msg) => {
      try {
        const id = msg && msg._id;
        if (!id || typeof id !== 'string') return;
        const trusted = MessageSqlite.findById(id);
        if (trusted) io.emit('chatMessage', trusted);
      } catch (err) {
        logger.error('chatMessage rebroadcast error', err);
      }
    });

    // Remote toy control: forward a buttplug action to a target user's socket
    socket.on('bp:control', ({ targetUsername, action, payload }) => {
      const ALLOWED = new Set(['pattern', 'vibrate', 'stop']);
      if (!targetUsername || typeof targetUsername !== 'string') return;
      if (!ALLOWED.has(action)) return;
      try {
        const target = User.findOneLean({ username: targetUsername.slice(0, 64) });
        if (!target) return;
        const targetSocket = tokenToSocket.get(target.sessionToken);
        if (!targetSocket) return;
        let senderName = 'Anonymous';
        try {
          if (socket.data.token) {
            const me = User.findOneLean({ sessionToken: socket.data.token });
            if (me) senderName = me.username;
          }
        } catch (_) { /* ignore */ }
        // Sanitize payload: only forward known primitive fields
        const safePayload = {};
        if (payload && typeof payload === 'object') {
          if (typeof payload.name === 'string') safePayload.name = payload.name.slice(0, 32);
          if (typeof payload.intensity === 'number') {
            safePayload.intensity = Math.max(0, Math.min(1, payload.intensity));
          }
        }
        targetSocket.emit('bp:remote', { from: senderName, action, payload: safePayload });
      } catch (err) {
        logger.error('bp:control dispatch error', err);
      }
    });

    // @mention: notify each tagged user via their own socket
    socket.on('mention', ({ sender, mentionedNames }) => {
      if (!Array.isArray(mentionedNames) || !mentionedNames.length) return;
      const safeSender = String(sender || '').slice(0, 64);
      const uniqueNames = [...new Set(mentionedNames.slice(0, 10))]; // cap at 10
      uniqueNames.forEach((username) => {
        try {
          const user = User.findOneLean({ username });
          if (!user) return;
          const targetSocket = tokenToSocket.get(user.sessionToken);
          if (targetSocket && targetSocket.id !== socket.id) {
            targetSocket.emit('mention', { sender: safeSender });
          }
        } catch (err) {
          logger.error('mention dispatch error', err);
        }
      });
    });

    socket.on('disconnect', async () => {
      const disconnectToken = socket.data.token;
      logger.info(`Socket disconnected: ${socket.id}`);

      if (disconnectToken) {
        tokenToSocket.delete(disconnectToken);

        // Award session-time XP
        const sessionStart = socket.data.sessionStart || Date.now();
        const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000);

        try {
          await processSessionEnd(disconnectToken, durationSeconds);
        } catch (err) {
          logger.error('session-end XP error', err);
        }

        // Broadcast updated online users
        try {
          const onlineUsers = buildOnlineUsers();
          io.emit('onlineUsers', onlineUsers);
        } catch (err) {
          logger.error('onlineUsers build error on disconnect', err);
        }
      }
    });
  });
};

module.exports = { setupSockets, emitToToken };
