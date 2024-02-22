const express = require("express");
const router = express.Router();
const passport = require('passport');
const imageController = require("../controllers/Images");


router.get('/profile', passport.authenticate('jwt', {session: false}), imageController.getProfile);
router.post('/profile', passport.authenticate('jwt', {session: false}), imageController.addProfile);



module.exports = router;