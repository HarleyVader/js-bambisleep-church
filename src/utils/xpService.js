'use strict';

const {
  XP_RATES,
  SESSION_MAX_SECONDS,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  PRESTIGE_THRESHOLD,
  LEVEL_UNLOCKS,
  PRESTIGE_TITLES,
} = require('../config/xpConfig');
const { getSpriteForLevel } = require('./avatarGenerator');

/**
 * Apply rewards for reaching newLevel onto user document (mutates in-memory).
 * Returns array of unlock description strings for client notification.
 */
const applyLevelRewards = (user, newLevel) => {
  const unlock = LEVEL_UNLOCKS[newLevel];
  if (!unlock) return [];

  const notifications = [];
  user.progress.level = newLevel;
  user.avatar.title = unlock.title;
  notifications.push(`title:${unlock.title}`);

  if (unlock.palette != null && !user.avatar.unlockedPalettes.includes(unlock.palette)) {
    user.avatar.unlockedPalettes.push(unlock.palette);
    notifications.push(`palette:${unlock.palette}`);
  }

  for (const deco of unlock.decorations) {
    if (!user.avatar.decorations.includes(deco)) {
      user.avatar.decorations.push(deco);
      notifications.push(`decoration:${deco}`);
    }
  }

  if (unlock.spriteEvolution) {
    user.avatar.currentSprite = getSpriteForLevel(user.avatar.baseVariant, newLevel);
    notifications.push(`sprite:${user.avatar.currentSprite}`);
  }

  return notifications;
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
  if (!user.avatar.prestigeBadges.includes(badge)) {
    user.avatar.prestigeBadges.push(badge);
  }

  // Re-apply level 1 rewards and reset sprite to tier 1
  applyLevelRewards(user, 1);
  user.avatar.currentSprite = getSpriteForLevel(user.avatar.baseVariant, 1);

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
