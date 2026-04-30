'use strict';

const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  seed:             { type: Number, default: 0 },
  baseVariant:      { type: Number, default: 0 },
  currentSprite:    { type: String, default: 'b0-t1.svg' },
  colorPaletteId:   { type: Number, default: 1 },
  unlockedPalettes: { type: [Number], default: [1] },
  decorations:      { type: [String], default: [] },
  title:            { type: String, default: 'Bambi Bud' },
  prestigeBadges:   { type: [String], default: [] },
}, { _id: false });

const progressSchema = new mongoose.Schema({
  xp:       { type: Number, default: 0 },
  totalXp:  { type: Number, default: 0 },
  level:    { type: Number, default: 1 },
  prestige: { type: Number, default: 0 },
}, { _id: false });

const statsSchema = new mongoose.Schema({
  messagesCount:       { type: Number, default: 0 },
  wordsCount:          { type: Number, default: 0 },
  totalSessionSeconds: { type: Number, default: 0 },
  uniqueDaysActive:    { type: [String], default: [] }, // 'YYYY-MM-DD' strings
  reactionsReceived:   { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true },
  sessionToken: { type: String, required: true, unique: true, index: true },
  avatar:       { type: avatarSchema, default: () => ({}) },
  progress:     { type: progressSchema, default: () => ({}) },
  stats:        { type: statsSchema, default: () => ({}) },
  lastSeen:     { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
