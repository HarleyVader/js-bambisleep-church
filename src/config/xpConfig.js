'use strict';

// XP awarded per action
const XP_RATES = {
  MESSAGE_SENT: 1,
  WORDS_PER_TEN: 1,        // +1 XP per 10 words typed
  SESSION_PER_FIVE_MIN: 1, // +1 XP per 5 minutes of session
  UNIQUE_DAY: 5,           // +5 XP first activity each calendar day
  REACTION_RECEIVED: 2,    // +2 XP per reaction received
};

// Maximum session seconds counted for XP (cap at 3 hours to prevent abuse)
const SESSION_MAX_SECONDS = 10800;

// XP required to BE at each level (1-indexed; index 0 unused)
// LEVEL_THRESHOLDS[n] = total XP needed to reach level n
const LEVEL_THRESHOLDS = [0, 0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250];

const MAX_LEVEL = 10;
const PRESTIGE_THRESHOLD = LEVEL_THRESHOLDS[MAX_LEVEL]; // 2250

// What unlocks at each level
const LEVEL_UNLOCKS = {
  1:  { palette: 1,    decorations: [],       title: 'Bambi Bud',    spriteEvolution: false },
  2:  { palette: null, decorations: [],       title: 'Bambi Babe',   spriteEvolution: false },
  3:  { palette: 2,    decorations: [],       title: 'Bambi Belle',  spriteEvolution: false },
  4:  { palette: null, decorations: [],       title: 'Bambi Bloom',  spriteEvolution: false },
  5:  { palette: 3,    decorations: ['glow'], title: 'Bambi Bliss',  spriteEvolution: false },
  6:  { palette: null, decorations: [],       title: 'Bambi Bright', spriteEvolution: false },
  7:  { palette: 4,    decorations: ['crown'],title: 'Bambi Star',   spriteEvolution: true  },
  8:  { palette: null, decorations: [],       title: 'Bambi Diva',   spriteEvolution: false },
  9:  { palette: null, decorations: ['halo'], title: 'Bambi Angel',  spriteEvolution: false },
  10: { palette: 5,    decorations: [],       title: 'Bambi Goddess',spriteEvolution: true  },
};

// Sprite tier derived from level
const getSpriteTier = (level) => {
  if (level >= 10) return 3;
  if (level >= 7) return 2;
  return 1;
};

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
  LEVEL_UNLOCKS,
  getSpriteTier,
  PRESTIGE_TITLES,
};
