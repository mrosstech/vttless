const express = require("express");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const router = express.Router();
//const User = require('../models/user');
const userController = require("../controllers/User");


router.post('/signup', userController.signup);



  module.exports = router;
