const express = require("express");
const router = express.Router();
const passport = require('passport');
const Auth = require('../controllers/Auth');


router.post('/login', Auth.login);
router.get('/validate', passport.authenticate('jwt', {session: false}), Auth.validate);
router.get('/logout', passport.authenticate('jwt', {session: false}), Auth.logout);

module.exports = router;
