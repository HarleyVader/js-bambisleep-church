'use strict';

const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { awardXp } = require('../utils/xpService');
const { XP_RATES } = require('../config/xpConfig');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/messages/:id/react  — toggle a reaction; awards XP to the message author
router.post('/:id/react', async (req, res) => {
  try {
    const { emoji, token } = req.body;
    if (!emoji || !token) {
      return res.status(400).json({ error: 'emoji and token are required' });
    }

    const message = await Message.findById(req.params.id).select('+authorToken');
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Prevent reacting to your own message
    if (message.authorToken === token) {
      return res.status(400).json({ error: 'Cannot react to your own message' });
    }

    let reaction = message.reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      message.reactions.push({ emoji, userTokens: [token] });

      // Award XP to message author
      if (message.authorToken) {
        const author = await User.findOne({ sessionToken: message.authorToken });
        if (author) {
          awardXp(author, XP_RATES.REACTION_RECEIVED);
          author.stats.reactionsReceived += 1;
          await author.save();
        }
      }
    } else {
      const idx = reaction.userTokens.indexOf(token);
      if (idx === -1) {
        // Add reaction
        reaction.userTokens.push(token);

        // Award XP to message author
        if (message.authorToken) {
          const author = await User.findOne({ sessionToken: message.authorToken });
          if (author) {
            awardXp(author, XP_RATES.REACTION_RECEIVED);
            author.stats.reactionsReceived += 1;
            await author.save();
          }
        }
      } else {
        // Remove reaction (toggle off)
        reaction.userTokens.splice(idx, 1);
        if (reaction.userTokens.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      }
    }

    await message.save();
    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    logger.error('react error', error);
    res.status(500).json({ error: 'Failed to process reaction' });
  }
});

module.exports = router;
