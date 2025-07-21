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
router.patch('/:id', passport.authenticate('jwt', {session: false}), mapController.updateMap);

// Token management routes
router.patch('/:id/tokens', passport.authenticate('jwt', {session: false}), mapController.addToken);
router.patch('/:id/tokens/:tokenId', passport.authenticate('jwt', {session: false}), mapController.updateToken);
router.delete('/:id/tokens/:tokenId', passport.authenticate('jwt', {session: false}), mapController.deleteToken);

module.exports = router;