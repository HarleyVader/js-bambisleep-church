const path = require('path');
const express = require('express');
const chatRoutes    = require('./routes/chat');
const userRoutes    = require('./routes/user');
const reactionRoutes = require('./routes/reactions');
const audioRoutes   = require('./routes/audio');
const patreonRoutes = require('./routes/patreon');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/messages', reactionRoutes);
app.use('/api/audio', audioRoutes);
// Patreon OAuth + webhook — webhook endpoint uses express.raw() internally
app.use('/api/patreon', patreonRoutes);

module.exports = app;
