const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji:      { type: String, required: true },
  userTokens: { type: [String], default: [] },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender:         { type: String, required: true },
  content:        { type: String, required: true },
  timestamp:      { type: Date, default: Date.now },
  authorToken:    { type: String, default: '', select: false }, // server-side only
  reactions:      { type: [reactionSchema], default: [] },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
