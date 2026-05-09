const path = require('path');
const express = require('express');
const { initSqlite }  = require('./config/sqlite');
const chatRoutes    = require('./routes/chat');
const userRoutes    = require('./routes/user');
const reactionRoutes = require('./routes/reactions');
const audioRoutes   = require('./routes/audio');
const patreonRoutes = require('./routes/patreon');
const uploadRoutes  = require('./routes/upload');

// Initialise SQLite (creates data/app.db and runs schema migrations)
initSqlite();

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
app.use('/api/upload', uploadRoutes);
// Patreon OAuth + webhook — webhook endpoint uses express.raw() internally
app.use('/api/patreon', patreonRoutes);
// Legacy / portal-registered callback path
app.use('/auth/patreon', patreonRoutes);

module.exports = app;
