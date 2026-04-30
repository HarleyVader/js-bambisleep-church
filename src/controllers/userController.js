'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const { generateFromUsername, reroll, getSpriteForLevel } = require('../utils/avatarGenerator');
const { awardXp, xpFromSession } = require('../utils/xpService');
const { XP_RATES, LEVEL_UNLOCKS, SESSION_MAX_SECONDS } = require('../config/xpConfig');
const logger = require('../utils/logger');

const todayKey = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

// Shared helper used by both HTTP route and socket disconnect handler
const processSessionEnd = async (token, durationSeconds) => {
  const user = await User.findOne({ sessionToken: token });
  if (!user) return null;

  const secs = Math.min(Math.max(0, parseInt(durationSeconds, 10) || 0), SESSION_MAX_SECONDS);
  user.stats.totalSessionSeconds += secs;

  const xpAmount = xpFromSession(secs);
  let levelResult = {};
  if (xpAmount > 0) {
    levelResult = awardXp(user, xpAmount);
  }

  user.lastSeen = new Date();
  await user.save();
  return { user, xpGained: xpAmount, ...levelResult };
};

class UserController {
  async upsertUser(req, res) {
    try {
      const { username, token } = req.body;
      const name = (username || 'Anonymous').trim().substring(0, 32);

      let user = token ? await User.findOne({ sessionToken: token }) : null;
      let newToken = token;

      if (!user) {
        // New user — generate avatar deterministically from username
        newToken = crypto.randomUUID();
        const { seed, baseVariant, colorPaletteId } = generateFromUsername(name);
        const sprite = getSpriteForLevel(baseVariant, 1);
        user = new User({
          username: name,
          sessionToken: newToken,
          avatar: {
            seed,
            baseVariant,
            currentSprite: sprite,
            colorPaletteId,
            unlockedPalettes: [1],
            decorations: [],
            title: LEVEL_UNLOCKS[1].title,
            prestigeBadges: [],
          },
        });
      } else {
        user.username = name;
        user.lastSeen = new Date();
      }

      // Award unique-day XP on first activity of each calendar day
      const today = todayKey();
      let xpResult = {};
      if (!user.stats.uniqueDaysActive.includes(today)) {
        user.stats.uniqueDaysActive.push(today);
        xpResult = awardXp(user, XP_RATES.UNIQUE_DAY);
      }

      await user.save();
      res.status(200).json({ user, token: newToken, xpGained: xpResult.leveledUp ? XP_RATES.UNIQUE_DAY : 0, ...xpResult });
    } catch (error) {
      logger.error('upsertUser error', error);
      res.status(500).json({ error: 'Failed to authenticate user' });
    }
  }

  async getUser(req, res) {
    try {
      const user = await User.findOne({ sessionToken: req.params.token });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(user);
    } catch (error) {
      logger.error('getUser error', error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }

  async rerollAvatar(req, res) {
    try {
      const user = await User.findOne({ sessionToken: req.params.token });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { seed, baseVariant } = reroll();
      user.avatar.seed = seed;
      user.avatar.baseVariant = baseVariant;
      user.avatar.currentSprite = getSpriteForLevel(baseVariant, user.progress.level);

      await user.save();
      res.status(200).json({ avatar: user.avatar });
    } catch (error) {
      logger.error('rerollAvatar error', error);
      res.status(500).json({ error: 'Failed to reroll avatar' });
    }
  }

  async updatePalette(req, res) {
    try {
      const user = await User.findOne({ sessionToken: req.params.token });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const paletteId = parseInt(req.body.paletteId, 10);
      if (!user.avatar.unlockedPalettes.includes(paletteId)) {
        return res.status(403).json({ error: 'Palette not unlocked' });
      }

      user.avatar.colorPaletteId = paletteId;
      await user.save();
      res.status(200).json({ avatar: user.avatar });
    } catch (error) {
      logger.error('updatePalette error', error);
      res.status(500).json({ error: 'Failed to update palette' });
    }
  }

  async endSession(req, res) {
    try {
      const result = await processSessionEnd(req.params.token, req.body.durationSeconds);
      if (!result) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(result);
    } catch (error) {
      logger.error('endSession error', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  }
}

module.exports = UserController;
module.exports.processSessionEnd = processSessionEnd;
