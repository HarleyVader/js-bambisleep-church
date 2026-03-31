const express = require('express');
const ChatController = require('../controllers/chatController');
const Message = require('../models/Message');

const router = express.Router();
const chatController = new ChatController(Message);

// Route to send a message
router.post('/messages', chatController.sendMessage.bind(chatController));

// Route to retrieve messages
router.get('/messages', chatController.getMessages.bind(chatController));

module.exports = router;