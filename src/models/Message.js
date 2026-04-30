const mongoose = require('mongoose');

const avatarSnapshotSchema = new mongoose.Schema({
  sprite:      { type: String, default: '' },
  paletteId:   { type: Number, default: 1 },
  decorations: { type: [String], default: [] },
  title:       { type: String, default: '' },
  prestige:    { type: Number, default: 0 },
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  emoji:      { type: String, required: true },
  userTokens: { type: [String], default: [] },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender:         { type: String, required: true },
  content:        { type: String, required: true },
  timestamp:      { type: Date, default: Date.now },
  authorToken:    { type: String, default: '', select: false }, // server-side only
  avatarSnapshot: { type: avatarSnapshotSchema, default: () => ({}) },
  reactions:      { type: [reactionSchema], default: [] },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
