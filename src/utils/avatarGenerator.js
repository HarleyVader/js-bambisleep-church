'use strict';

const { getSpriteTier } = require('../config/xpConfig');

const BASE_VARIANTS = 6; // b0 – b5

// djb2 hash — deterministic unsigned 32-bit integer from a string
const djb2 = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash;
};

/**
 * Deterministic avatar from username hash.
 * Same username always yields the same baseVariant.
 * Returns { seed, baseVariant, colorPaletteId }
 */
const generateFromUsername = (username) => {
  const normalised = (username || 'anonymous').toLowerCase().trim();
  const seed = djb2(normalised);
  const baseVariant = seed % BASE_VARIANTS;
  return { seed, baseVariant, colorPaletteId: 1 };
};

/**
 * Random avatar seed (re-roll).
 * Returns { seed, baseVariant, colorPaletteId }
 */
const reroll = () => {
  const seed = Math.floor(Math.random() * 0xffffffff);
  const baseVariant = seed % BASE_VARIANTS;
  return { seed, baseVariant, colorPaletteId: 1 };
};

/**
 * Sprite filename for a given base variant + level.
 * e.g. getSpriteForLevel(2, 7) → "b2-t2.svg"
 */
const getSpriteForLevel = (baseVariant, level) => {
  const tier = getSpriteTier(level);
  return `b${baseVariant}-t${tier}.svg`;
};

module.exports = { generateFromUsername, reroll, getSpriteForLevel, BASE_VARIANTS };
