const express = require('express');
const ChatController = require('../controllers/chatController');
const Message = require('../models/Message');

const router = express.Router();

// io is injected at startup; falls back to undefined (XP socket events simply skipped)
let _io = null;
const setIo = (io) => { _io = io; };

const getController = () => new ChatController(Message, _io);

// Route to send a message
router.post('/messages', (req, res) => getController().sendMessage(req, res));

// Route to retrieve messages
router.get('/messages', (req, res) => getController().getMessages(req, res));

module.exports = router;
module.exports.setIo = setIo;
