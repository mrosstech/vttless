const express = require("express");
const router = express.Router();
const passport = require('passport');
const Campaigns = require('../controllers/Campaign');


router.get('/list', passport.authenticate('jwt', {session: false}), Campaigns.list);
router.post('/add', passport.authenticate('jwt', {session: false}), Campaigns.add );
router.post('/delete', passport.authenticate('jwt', {session: false}), Campaigns.delete);
router.post('/update', passport.authenticate('jwt', {session: false}), Campaigns.update);
router.post('/join', passport.authenticate('jwt', {session: false}), Campaigns.join);
router.get('/:id', passport.authenticate('jwt', {session: false}), Campaigns.get);

module.exports = router;
