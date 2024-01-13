require('dotenv').config();
const express = require("express");
const passport = require("passport");
var LocalStrategy = require('passport-local');
const jwt = require('jsonwebtoken');
//const { db } = require("../models/user");
const router = express.Router();
const User = require('../models/user');
const bcrypt = require("bcryptjs");

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  console.log('Attempting to authenticate user');
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Bad username or password.');
      return cb(null, false, {message: 'Incorrect username or password'});
    }
    bcrypt.compare(password, user.password, function(err, result) {
      if (!result) {
        console.log("Incorrect username or password for user: " + user.username);
        return cb(null, false, {message: 'Incorrect username or password'});
      }
      
      if (err) {
        console.log('Error with password comparison');
        return cb(err);
      }

      console.log("User: " + user.username + " successfully authenticated!");
      const token = jwt.sign({ username: user.username, userId: user._id}, process.env.JWT_SECRET_KEY );
      return cb(null, { token, user});
    })
  } catch (err) {
    console.log('Error with findone: ' + err);
    return cb(err);
  } 
}))

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: info.message });
    }
    
    // If auth is successful then send back the token
    res.json({ token: user.token, user: user.user })
}) (req, res, next);
});

module.exports = router;
