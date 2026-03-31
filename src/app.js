const path = require('path');
const express = require('express');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/chat', chatRoutes);

module.exports = app;