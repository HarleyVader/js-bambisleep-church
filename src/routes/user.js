'use strict';

const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();
const userController = new UserController();

router.post('/',                    userController.upsertUser.bind(userController));
router.get('/:token',               userController.getUser.bind(userController));
router.post('/:token/reroll',       userController.rerollAvatar.bind(userController));
router.patch('/:token/palette',     userController.updatePalette.bind(userController));
router.post('/:token/session-end',  userController.endSession.bind(userController));

module.exports = router;
