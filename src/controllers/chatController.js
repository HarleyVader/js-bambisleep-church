'use strict';

const User = require('../models/User');
const { awardXp, xpFromWords } = require('../utils/xpService');
const { XP_RATES } = require('../config/xpConfig');
const logger = require('../utils/logger');

class ChatController {
  constructor(messageModel, io) {
    this.messageModel = messageModel;
    this.io = io; // optional: used to emit XP events
  }

  async sendMessage(req, res) {
    try {
      const { sender, content, token } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
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
          }
        }
      }

      const message = new this.messageModel({
        sender:         resolvedSender,
        content:        content.trim(),
        timestamp:      new Date(),
        authorToken:    token || '',
        avatarSnapshot,
      });
      await message.save();

      const responseMessage = message.toObject();
      delete responseMessage.authorToken; // never expose token to client

      res.status(201).json({ message: responseMessage, xpResult });
    } catch (error) {
      logger.error('sendMessage error', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async getMessages(req, res) {
    try {
      const messages = await this.messageModel
        .find()
        .sort({ timestamp: 1 })
        .select('-authorToken');
      res.status(200).json(messages);
    } catch (error) {
      logger.error('getMessages error', error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }
}

module.exports = ChatController;
