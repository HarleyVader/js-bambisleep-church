'use strict';

const User           = require('../models/User');
const MessageSqlite  = require('../models/MessageSqlite');
const { awardXp, xpFromWords } = require('../utils/xpService');
const { XP_RATES }   = require('../config/xpConfig');
const logger         = require('../utils/logger');

class ChatController {
  constructor(io) {
    this.io = io; // optional: used to emit XP events
  }

  async sendMessage(req, res) {
    try {
      const { sender, content, token, attachment } = req.body;
      if (!content && !attachment) {
        return res.status(400).json({ error: 'Content or attachment is required' });
      }

      let resolvedSender = (sender || 'Anonymous').trim().substring(0, 32);
      let avatarSnapshot = {};
      let xpResult = null;

      if (token) {
        const user = await User.findOne({ sessionToken: token });
        if (user) {
          resolvedSender = user.username;

          const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
          const xpAmount = XP_RATES.MESSAGE_SENT + xpFromWords(wordCount);
          xpResult = awardXp(user, xpAmount);

          user.stats.messagesCount += 1;
          user.stats.wordsCount += wordCount;
          await user.save();

          avatarSnapshot = {
            sprite:      user.avatar.currentSprite,
            paletteId:   user.avatar.colorPaletteId,
            decorations: [...user.avatar.decorations],
            title:       user.avatar.title,
            prestige:    user.progress.prestige,
          };

          // Emit XP events to that user's socket (if socket layer is wired)
          if (this.io && xpResult) {
            const { emitToToken } = require('../sockets/chatSocket');
            emitToToken(token, 'xpGained', {
              amount: xpAmount,
              reason: 'message',
              newTotal: user.progress.xp,
              level: user.progress.level,
            });
            if (xpResult.leveledUp) {
              emitToToken(token, 'levelUp', {
                newLevel: xpResult.newLevel,
                unlocks: xpResult.unlocks,
                prestiged: xpResult.prestiged,
                prestigeCount: xpResult.prestigeCount,
              });
            }
            // Push updated stats so sidebar counters refresh immediately
            emitToToken(token, 'profile:update', {
              stats: {
                messagesCount:     user.stats.messagesCount,
                wordsCount:        user.stats.wordsCount,
                daysActive:        (user.stats.uniqueDaysActive || []).length,
                reactionsGiven:    user.stats.reactionsGiven || 0,
                reactionsReceived: user.stats.reactionsReceived,
              },
              progress: {
                xp:       user.progress.xp,
                level:    user.progress.level,
                prestige: user.progress.prestige,
              },
            });
          }
        }
      }

      // Validate attachment shape if present
      let safeAttachment = null;
      if (attachment && typeof attachment === 'object' && attachment.url) {
        const allowedKinds = new Set(['image', 'video']);
        safeAttachment = {
          url:  String(attachment.url).slice(0, 300),
          type: String(attachment.type || '').slice(0, 50),
          kind: allowedKinds.has(attachment.kind) ? attachment.kind : 'image',
          name: String(attachment.name || '').slice(0, 200),
          size: Number(attachment.size) || 0,
        };
      }

      const message = MessageSqlite.create({
        sender:         resolvedSender,
        content:        (content || '').trim(),
        authorToken:    token || '',
        avatarSnapshot,
        attachment:     safeAttachment,
      });

      // authorToken is never in the returned object — no need to delete it
      res.status(201).json({ message, xpResult });
    } catch (error) {
      logger.error('sendMessage error', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async getMessages(req, res) {
    try {
      const messages = MessageSqlite.findAll();
      res.status(200).json(messages);
    } catch (error) {
      logger.error('getMessages error', error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }
}

module.exports = ChatController;
