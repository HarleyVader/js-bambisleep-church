'use strict';

const crypto = require('crypto');
const User = require('../models/UserSqlite');
const { generateFromUsername, reroll, getSpriteForLevel } = require('../utils/avatarGenerator');
const { awardXp, xpFromSession } = require('../utils/xpService');
const { XP_RATES, LEVEL_UNLOCKS, SESSION_MAX_SECONDS } = require('../config/xpConfig');
const logger = require('../utils/logger');

const todayKey = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

// Shared helper used by both HTTP route and socket disconnect handler
const processSessionEnd = async (token, durationSeconds) => {
  const user = User.findOne({ sessionToken: token });
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

      let user = token ? User.findOne({ sessionToken: token }) : null;
      let newToken = token;

      if (!user) {
        // New user — generate avatar deterministically from username
        newToken = crypto.randomUUID();
        const { seed, baseVariant, colorPaletteId } = generateFromUsername(name);
        const sprite = getSpriteForLevel(baseVariant, 1);
        user = User.create({
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

      // Auto-elevate creator role whenever they log in with a linked Patreon account
      const creatorPatreonId = (process.env.PATREON_CREATOR_USER_ID || '').trim();
      if (creatorPatreonId && user.patreon?.userId === creatorPatreonId && user.role !== 'creator') {
        user.role = 'creator';
        logger.info(`[upsertUser] creator role auto-assigned to: ${user.username}`);
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
      const user = User.findOne({ sessionToken: req.params.token });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(user);
    } catch (error) {
      logger.error('getUser error', error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }

  async rerollAvatar(req, res) {
    try {
      const user = User.findOne({ sessionToken: req.params.token });
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
      const user = User.findOne({ sessionToken: req.params.token });
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

  /**
   * GET /api/user/profile/:username?session=<viewerToken>
   * Returns a sanitised public profile for the given username.
   * Access requires an active Patreon patron (any tier) or creator role.
   */
  async getPublicProfile(req, res) {
    try {
      const viewerToken = (req.query.session || '').trim();
      if (!viewerToken) return res.status(401).json({ error: 'Session token required' });

      const viewer = User.findOneLean({ sessionToken: viewerToken });
      if (!viewer) return res.status(401).json({ error: 'Invalid session' });

      // Creator always has access; any active patron (any amount > 0) can also view
      const creatorPatreonId = (process.env.PATREON_CREATOR_USER_ID || '').trim();
      const isCreator = viewer.role === 'creator'
                        || (creatorPatreonId && viewer.patreon?.userId === creatorPatreonId);
      const isPatron  = viewer.patreon?.patronStatus === 'active_patron'
                        && (viewer.patreon?.currentlyEntitledAmountCents || 0) >= 200;

      if (!isCreator && !isPatron) {
        return res.status(403).json({ error: 'Good Girl Patreon tier required', gated: true });
      }

      const target = User.findOneLean({ username: req.params.username });
      if (!target) return res.status(404).json({ error: 'User not found' });

      // Return public-safe fields only — no tokens, no Patreon auth data
      return res.json({
        username:  target.username,
        role:      target.role || 'user',
        avatar:    target.avatar,
        progress:  target.progress,
        lastSeen:  target.lastSeen,
        stats: {
          messagesCount:     target.stats.messagesCount     || 0,
          wordsCount:        target.stats.wordsCount        || 0,
          uniqueDaysActive:  target.stats.uniqueDaysActive?.length || 0,
          reactionsReceived: target.stats.reactionsReceived || 0,
          reactionsGiven:    target.stats.reactionsGiven    || 0,
        },
        patreon: {
          patronStatus: target.patreon?.patronStatus || null,
          tierName:     target.patreon?.tierName     || null,
          thumbUrl:     target.patreon?.thumbUrl     || null,
        },
      });
    } catch (error) {
      logger.error('getPublicProfile error', error);
      res.status(500).json({ error: 'Failed to load profile' });
    }
  }
}

module.exports = UserController;
module.exports.processSessionEnd = processSessionEnd;
