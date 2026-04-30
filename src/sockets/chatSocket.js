'use strict';

const User = require('../models/User');
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
const buildOnlineUsers = async () => {
  const tokens = [...tokenToSocket.keys()];
  if (tokens.length === 0) return [];
  const users = await User.find({ sessionToken: { $in: tokens } })
    .select('username avatar.currentSprite avatar.colorPaletteId avatar.decorations avatar.title avatar.prestigeBadges progress.level progress.xp progress.prestige');
  return users.map((u) => ({
    username:     u.username,
    sprite:       u.avatar.currentSprite,
    paletteId:    u.avatar.colorPaletteId,
    decorations:  u.avatar.decorations,
    title:        u.avatar.title,
    prestigeBadges: u.avatar.prestigeBadges,
    level:        u.progress.level,
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
      const onlineUsers = await buildOnlineUsers();
      io.emit('onlineUsers', onlineUsers);
    } catch (err) {
      logger.error('onlineUsers build error', err);
    }

    socket.on('chatMessage', (msg) => {
      io.emit('chatMessage', msg);
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
          const onlineUsers = await buildOnlineUsers();
          io.emit('onlineUsers', onlineUsers);
        } catch (err) {
          logger.error('onlineUsers build error on disconnect', err);
        }
      }
    });
  });
};

module.exports = { setupSockets, emitToToken };
