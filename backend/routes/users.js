const express = require("express");
const router = express.Router();
const userController = require("../controllers/User");
const validatePassword = require("../middleware/validatePassword");


router.post('/signup', validatePassword, userController.signup);



module.exports = router;
