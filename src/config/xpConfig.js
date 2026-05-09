'use strict';

// XP awarded per action
const XP_RATES = {
  MESSAGE_SENT: 1,
  WORDS_PER_TEN: 1,        // +1 XP per 10 words typed
  SESSION_PER_FIVE_MIN: 1, // +1 XP per 5 minutes of session
  UNIQUE_DAY: 5,           // +5 XP first activity each calendar day
  REACTION_RECEIVED: 2,    // +2 XP per reaction received
  REACTION_GIVEN: 1,       // +1 XP per reaction given
};

// Maximum session seconds counted for XP (cap at 3 hours to prevent abuse)
const SESSION_MAX_SECONDS = 10800;

// XP required to BE at each level (1-indexed; index 0 unused)
// LEVEL_THRESHOLDS[n] = total XP needed to reach level n
const LEVEL_THRESHOLDS = [0, 0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250];

const MAX_LEVEL = 10;
const PRESTIGE_THRESHOLD = LEVEL_THRESHOLDS[MAX_LEVEL]; // 2250

// Prestige badge labels (stacked; beyond index 2 reuses last)
const PRESTIGE_TITLES = [
  '✦ Prestige I',
  '✦✦ Prestige II',
  '✦✦✦ Prestige III',
];

module.exports = {
  XP_RATES,
  SESSION_MAX_SECONDS,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  PRESTIGE_THRESHOLD,
  PRESTIGE_TITLES,
};
