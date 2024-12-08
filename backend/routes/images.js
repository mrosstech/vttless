const express = require("express");
const router = express.Router();
const passport = require('passport');
const imageController = require("../controllers/Images");
const Images = require("../controllers/Images");

router.get('/profile-photo-upload', passport.authenticate('jwt', {session: false}), Images.getProfilePhotoUploadUrl);
router.post('/update-profile-photo', passport.authenticate('jwt', {session: false}), Images.updateProfilePhoto);
router.get('/profile-photo-download-url', passport.authenticate('jwt', {session: false}), Images.getProfilePhotoDownloadUrl);


module.exports = router;