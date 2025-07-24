const express = require("express");
const router = express.Router();
const passport = require('passport');
const Assets = require('../controllers/Asset');



router.post('/upload-url', passport.authenticate('jwt', {session: false}), Assets.getUploadUrl );
router.post('/confirm-upload', passport.authenticate('jwt', {session: false}), Assets.confirmUpload );
router.get('/campaign/:campaignId', passport.authenticate('jwt', {session: false}), Assets.getCampaignAssets);
router.get('/download/:id', passport.authenticate('jwt', {session: false}), Assets.getDownloadUrl);



module.exports = router;
