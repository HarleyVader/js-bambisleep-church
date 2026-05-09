'use strict';

const express        = require('express');
const MessageSqlite  = require('../models/MessageSqlite');
const User           = require('../models/User');
const { awardXp }   = require('../utils/xpService');
const { XP_RATES }  = require('../config/xpConfig');
const logger        = require('../utils/logger');

const router = express.Router();

/** Award XP to author and emit socket events so their stats update live. */
const rewardAuthor = async (authorToken, xpAmount) => {
  const author = await User.findOne({ sessionToken: authorToken });
  if (!author) return;

  const xpResult = awardXp(author, xpAmount);
  author.stats.reactionsReceived += 1;
  await author.save();

  try {
    const { emitToToken } = require('../sockets/chatSocket');
    emitToToken(authorToken, 'xpGained', {
      amount:   xpAmount,
      reason:   'reaction',
      newTotal: author.progress.xp,
      level:    author.progress.level,
    });
    if (xpResult && xpResult.leveledUp) {
      emitToToken(authorToken, 'levelUp', {
        newLevel:      xpResult.newLevel,
        unlocks:       xpResult.unlocks,
        prestiged:     xpResult.prestiged,
        prestigeCount: xpResult.prestigeCount,
      });
    }
    // Push updated stats so author's sidebar counter refreshes immediately
    emitToToken(authorToken, 'profile:update', {
      stats: {
        messagesCount:     author.stats.messagesCount,
        wordsCount:        author.stats.wordsCount,
        daysActive:        (author.stats.uniqueDaysActive || []).length,
        reactionsGiven:    author.stats.reactionsGiven || 0,
        reactionsReceived: author.stats.reactionsReceived,
      },
      progress: {
        xp:       author.progress.xp,
        level:    author.progress.level,
        prestige: author.progress.prestige,
      },
    });
  } catch (e) {
    logger.error('reaction socket emit error', e);
  }
};

/** Increment reactor's reactionsGiven, award XP, and push their updated stats to their socket. */
const trackReactorGiven = async (reactorToken) => {
  const reactor = await User.findOne({ sessionToken: reactorToken });
  if (!reactor) return;
  reactor.stats.reactionsGiven = (reactor.stats.reactionsGiven || 0) + 1;
  const xpResult = awardXp(reactor, XP_RATES.REACTION_GIVEN);
  await reactor.save();
  try {
    const { emitToToken } = require('../sockets/chatSocket');
    emitToToken(reactorToken, 'xpGained', {
      amount:   XP_RATES.REACTION_GIVEN,
      reason:   'reaction_given',
      newTotal: reactor.progress.xp,
      level:    reactor.progress.level,
    });
    if (xpResult && xpResult.leveledUp) {
      emitToToken(reactorToken, 'levelUp', {
        newLevel:      xpResult.newLevel,
        unlocks:       xpResult.unlocks,
        prestiged:     xpResult.prestiged,
        prestigeCount: xpResult.prestigeCount,
      });
    }
    emitToToken(reactorToken, 'profile:update', {
      stats: {
        messagesCount:     reactor.stats.messagesCount,
        wordsCount:        reactor.stats.wordsCount,
        daysActive:        (reactor.stats.uniqueDaysActive || []).length,
        reactionsGiven:    reactor.stats.reactionsGiven,
        reactionsReceived: reactor.stats.reactionsReceived,
      },
      progress: {
        xp:       reactor.progress.xp,
        level:    reactor.progress.level,
        prestige: reactor.progress.prestige,
      },
    });
  } catch (e) {
    logger.error('reactor socket emit error', e);
  }
};

// POST /api/messages/:id/react  — toggle a reaction; awards XP to the message author
router.post('/:id/react', async (req, res) => {
  try {
    const { emoji, token } = req.body;
    if (!emoji || !token) {
      return res.status(400).json({ error: 'emoji and token are required' });
    }

    const message = MessageSqlite.findById(req.params.id, { includeToken: true });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Prevent reacting to your own message
    if (message.authorToken === token) {
      return res.status(400).json({ error: 'Cannot react to your own message' });
    }

    let reaction = message.reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      message.reactions.push({ emoji, userTokens: [token] });
      if (message.authorToken) await rewardAuthor(message.authorToken, XP_RATES.REACTION_RECEIVED);
      await trackReactorGiven(token);
    } else {
      const idx = reaction.userTokens.indexOf(token);
      if (idx === -1) {
        reaction.userTokens.push(token);
        if (message.authorToken) await rewardAuthor(message.authorToken, XP_RATES.REACTION_RECEIVED);
        await trackReactorGiven(token);
      } else {
        // Remove reaction (toggle off) — no XP deducted
        reaction.userTokens.splice(idx, 1);
        if (reaction.userTokens.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      }
    }

    MessageSqlite.updateReactions(req.params.id, message.reactions);
    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    logger.error('react error', error);
    res.status(500).json({ error: 'Failed to process reaction' });
  }
});

module.exports = router;
