'use strict';

const crypto = require('crypto');
const User = require('../models/UserSqlite');
const { awardXp, xpFromSession } = require('../utils/xpService');
const { XP_RATES, SESSION_MAX_SECONDS } = require('../config/xpConfig');
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
        // New user
        newToken = crypto.randomUUID();
        user = User.create({
          username: name,
          sessionToken: newToken,
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
      let xpAwarded = 0;
      if (!user.stats.uniqueDaysActive.includes(today)) {
        user.stats.uniqueDaysActive.push(today);
        xpResult = awardXp(user, XP_RATES.UNIQUE_DAY);
        xpAwarded = XP_RATES.UNIQUE_DAY;
      }

      await user.save();
      res.status(200).json({ user, token: newToken, xpGained: xpAwarded, ...xpResult });
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
      const isCreator         = viewer.role === 'creator'
                                || (creatorPatreonId && viewer.patreon?.userId === creatorPatreonId);
      const isPatron          = viewer.patreon?.patronStatus === 'active_patron'
                                && (viewer.patreon?.currentlyEntitledAmountCents || 0) >= 200;
      const hasSignedContract = !!(viewer.contract?.acceptedAt);

      if (!isCreator && !isPatron && !hasSignedContract) {
        return res.status(403).json({ error: 'Good Girl Patreon tier required', gated: true });
      }

      const target = User.findOneLean({ username: req.params.username });
      if (!target) return res.status(404).json({ error: 'User not found' });

      // Return public-safe fields only — no tokens, no Patreon auth data
      return res.json({
        username:     target.username,
        role:         target.role || 'user',
        progress:     target.progress,
        lastSeen:     target.lastSeen,
        isOwnProfile: target.username === viewer.username,
        contract: {
          acceptedAt: target.contract?.acceptedAt || null,
          version:    target.contract?.version    || null,
        },
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

  /**
   * POST /api/user/contract
   * Sign the Bambi Covenant — saves a hashed password and a contract record.
   * Requires active Patreon status OR an already-signed contract (re-sign to update password).
   */
  async signContract(req, res) {
    try {
      const {
        session, username, password, confirmPassword, contractVersion = '1.0',
      } = req.body;

      if (!session || !username || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = User.findOne({ sessionToken: session.trim() });
      if (!user) return res.status(401).json({ error: 'Invalid session' });

      // Username must match exactly (confirmation step)
      if (user.username !== username.trim()) {
        return res.status(400).json({ error: 'Username does not match your account' });
      }

      const creatorPatreonId = (process.env.PATREON_CREATOR_USER_ID || '').trim();
      const isCreator        = user.role === 'creator'
                               || (creatorPatreonId && user.patreon?.userId === creatorPatreonId);
      const isPatron         = user.patreon?.patronStatus === 'active_patron'
                               && (user.patreon?.currentlyEntitledAmountCents || 0) >= 200;
      const alreadySigned    = !!(user.contract?.acceptedAt);

      if (!isCreator && !isPatron && !alreadySigned) {
        return res.status(403).json({
          error: 'Active Patreon patron status required to sign the covenant',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      const passwordHash = User.hashPassword(password);
      const contractObj  = {
        acceptedAt: alreadySigned ? user.contract.acceptedAt : new Date().toISOString(),
        version:    contractVersion,
        username:   user.username,
      };

      User.setPasswordAndContract(user._id, passwordHash, contractObj);

      logger.info(`[signContract] ${user.username} signed covenant v${contractVersion}`);
      return res.status(200).json({
        success:  true,
        contract: contractObj,
        message:  alreadySigned
          ? 'Password updated successfully.'
          : 'Covenant signed. Welcome to the sisterhood.',
      });
    } catch (error) {
      logger.error('signContract error', error);
      return res.status(500).json({ error: 'Failed to process covenant' });
    }
  }

  /**
   * POST /api/user/login
   * Authenticate with username + password and return the existing session token.
   * Supplements the token-based auth — does not replace it.
   */
  async loginWithPassword(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = User.findOne({ username: username.trim() });
      // Always run the verify step to avoid timing-based user enumeration
      const valid = user && User.verifyPassword(password, user.password_hash);

      if (!user || !user.password_hash || !valid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      logger.info(`[loginWithPassword] ${user.username} authenticated`);
      return res.status(200).json({
        token:    user.sessionToken,
        username: user.username,
      });
    } catch (error) {
      logger.error('loginWithPassword error', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = UserController;
module.exports.processSessionEnd = processSessionEnd;
