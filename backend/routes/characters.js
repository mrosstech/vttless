const express = require("express");
const router = express.Router();
const passport = require('passport');
const CharacterController = require("../controllers/Character");

// Campaign character routes
router.get("/campaigns/:campaignId/characters", passport.authenticate('jwt', {session: false}), CharacterController.getCampaignCharacters);
router.get("/campaigns/:campaignId/characters/user", passport.authenticate('jwt', {session: false}), CharacterController.getUserCampaignCharacters);
router.post("/campaigns/:campaignId/characters", passport.authenticate('jwt', {session: false}), CharacterController.createCharacter);

// Individual character routes
router.patch("/characters/:characterId", passport.authenticate('jwt', {session: false}), CharacterController.updateCharacter);
router.delete("/characters/:characterId", passport.authenticate('jwt', {session: false}), CharacterController.deleteCharacter);

// Character-map interaction routes
router.post("/characters/:characterId/place/:mapId", passport.authenticate('jwt', {session: false}), CharacterController.placeCharacterOnMap);
router.delete("/characters/:characterId/remove/:mapId", passport.authenticate('jwt', {session: false}), CharacterController.removeCharacterFromMap);
router.patch("/characters/:characterId/position/:mapId", passport.authenticate('jwt', {session: false}), CharacterController.updateCharacterPosition);

module.exports = router;