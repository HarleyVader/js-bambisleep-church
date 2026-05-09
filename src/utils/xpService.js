'use strict';

const {
  XP_RATES,
  SESSION_MAX_SECONDS,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  PRESTIGE_THRESHOLD,
  PRESTIGE_TITLES,
} = require('../config/xpConfig');

/**
 * Apply rewards for reaching newLevel onto user document (mutates in-memory).
 * Returns array of unlock description strings for client notification.
 */
const applyLevelRewards = (user, newLevel) => {
  user.progress.level = newLevel;
  return [];
};

/**
 * Prestige the user: reset XP/level, award prestige badge (mutates in-memory).
 * Returns new prestige count.
 */
const prestigeUser = (user) => {
  user.progress.xp = 0;
  user.progress.level = 1;
  user.progress.prestige += 1;

  const badgeIdx = Math.min(user.progress.prestige - 1, PRESTIGE_TITLES.length - 1);
  const badge = PRESTIGE_TITLES[badgeIdx];

  // Re-apply level 1 rewards
  applyLevelRewards(user, 1);

  return user.progress.prestige;
};

/**
 * Award XP to user (mutates in-memory). Handles level-ups and prestige.
 * Returns { leveledUp, newLevel, unlocks, prestiged, prestigeCount }
 */
const awardXp = (user, amount) => {
  user.progress.xp += amount;
  user.progress.totalXp += amount;

  let leveledUp = false;
  let unlocks = [];
  let prestiged = false;

  // Prestige: at max level with enough XP
  if (user.progress.level >= MAX_LEVEL && user.progress.xp >= PRESTIGE_THRESHOLD) {
    const count = prestigeUser(user);
    return { leveledUp: true, newLevel: 1, unlocks: ['Prestige!'], prestiged: true, prestigeCount: count };
  }

  // Level-up loop (handles multi-level jumps from large XP awards)
  while (
    user.progress.level < MAX_LEVEL &&
    user.progress.xp >= LEVEL_THRESHOLDS[user.progress.level + 1]
  ) {
    const newLevel = user.progress.level + 1;
    const levelUnlocks = applyLevelRewards(user, newLevel);
    unlocks = unlocks.concat(levelUnlocks);
    leveledUp = true;
  }

  return { leveledUp, newLevel: user.progress.level, unlocks, prestiged, prestigeCount: user.progress.prestige };
};

/** XP value for a word count (1 per 10 words). */
const xpFromWords = (wordCount) =>
  Math.floor(wordCount / 10) * XP_RATES.WORDS_PER_TEN;

/** XP value for session duration in seconds (1 per 5 min, capped). */
const xpFromSession = (seconds) => {
  const capped = Math.min(Math.max(0, seconds), SESSION_MAX_SECONDS);
  return Math.floor(capped / 300) * XP_RATES.SESSION_PER_FIVE_MIN;
};

module.exports = { awardXp, applyLevelRewards, prestigeUser, xpFromWords, xpFromSession };
