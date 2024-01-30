require('dotenv').config();
//const express = require("express");
const passport = require("passport");
const LocalStrategy = require('passport-local');
const JWTStrategy = require("passport-jwt").Strategy;
//const router = express.Router();
const User = require('./models/user');
const bcrypt = require("bcryptjs");

const cookieExtractor = function(req) {
  let token = null;
  if (req && req.cookies) {
    //console.log('request object and cookies present');
    token = req.cookies["vttless-jwt"];
  }
  //console.log('Token found: ' + token);
  return token;
}

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  console.log('Attempting to authenticate user');
  try {
    const user = await User.findOne({ username }).populate('roles');
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
      return cb(null, {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        roles: user.roles
                      });
    })
  } catch (err) {
    console.log('Error with findone: ' + err);
    return cb(err);
  } 
}))

passport.use(new JWTStrategy({
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET_KEY,
  }, (jwtPayload, done) => {
    console.log("Payload Username: " + jwtPayload.username);
    User.findOne({username: jwtPayload.username})
    .then(user => {
        console.log(user);
        console.log(jwtPayload);
        if(user) {
            return done(null, user);
        }
        return done(null, false);
    }).catch(err => {
        console.log(err);
    });
    // if (Date.now() > jwtPayload.expires) {
    //   return done('jwt expired');
    // }
    // return done(null, jwtPayload);
  }
));

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