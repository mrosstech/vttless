const express = require("express");
const router = express.Router();
const passport = require('passport');
const friendController = require("../controllers/Friend");


router.post('/add', passport.authenticate('jwt', {session: false}), friendController.add);
router.post('/confirm', passport.authenticate('jwt', {session: false}), friendController.confirm);
router.post('/delete', passport.authenticate('jwt', {session: false}), friendController.delete);
router.get('/unconfirmed', passport.authenticate('jwt', {session: false}), friendController.unconfirmed);
router.get('/list', passport.authenticate('jwt', {session: false}), friendController.list);



module.exports = router;