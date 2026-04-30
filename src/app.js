const path = require('path');
const express = require('express');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const reactionRoutes = require('./routes/reactions');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/messages', reactionRoutes);

module.exports = app;
