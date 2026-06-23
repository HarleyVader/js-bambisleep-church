'use strict';

const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();
const userController = new UserController();

router.post('/',                         userController.upsertUser.bind(userController));
// /profile/:username must come before /:token to avoid Express matching "profile" as a token
router.get('/profile/:username',         userController.getPublicProfile.bind(userController));
// /contract and /login must also come before /:token
router.post('/contract',                 userController.signContract.bind(userController));
router.post('/login',                    userController.loginWithPassword.bind(userController));
router.get('/:token',                    userController.getUser.bind(userController));
router.post('/:token/session-end',  userController.endSession.bind(userController));

module.exports = router;
