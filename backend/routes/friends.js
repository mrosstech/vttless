// routes/friends.js
const express = require('express');
const router = express.Router();
const friendController = require('../controllers/Friend');
const passport = require('passport');

router.post('/add', passport.authenticate('jwt', {session: false}), friendController.add);
router.get('/list', passport.authenticate('jwt', {session: false}), friendController.list);
router.get('/pending', passport.authenticate('jwt', {session: false}), friendController.pending);
router.post('/confirm', passport.authenticate('jwt', {session: false}), friendController.confirm);
router.post('/reject', passport.authenticate('jwt', {session: false}), friendController.reject);
router.post('/remove', passport.authenticate('jwt', {session: false}), friendController.remove);

module.exports = router;