const express = require("express");
const router = express.Router();
const passport = require('passport');
const mapController = require("../controllers/Map");


// Map routes
router.post('/', passport.authenticate('jwt', {session: false}), mapController.createMap);
router.get('/:id', passport.authenticate('jwt', {session: false}), mapController.getMap);
router.put('/:id', passport.authenticate('jwt', {session: false}), mapController.updateMap);
router.delete('/:id', passport.authenticate('jwt', {session: false}), mapController.deleteMap);
router.get('/campaign/:campaignId', passport.authenticate('jwt', {session: false}), mapController.getCampaignMaps);

module.exports = router;