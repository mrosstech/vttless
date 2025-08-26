require('dotenv').config();
//const express = require("express");
const passport = require("passport");
const LocalStrategy = require('passport-local');
const JWTStrategy = require("passport-jwt").Strategy;
//const router = express.Router();
const User = require('./models/user');
const bcrypt = require("bcryptjs");
const jwtOptions = {};

const cookieExtractor = function(req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["vttless-jwt"];
  }
  return token;
}

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const user = await User.findOne({ username }).populate('roles');
    if (!user) {
      return cb(null, false, {message: 'Incorrect username or password'});
    }
    bcrypt.compare(password, user.password, function(err, result) {
      if (!result) {
        return cb(null, false, {message: 'Incorrect username or password'});
      }
      
      if (err) {
        console.error('Error with password comparison');
        return cb(err);
      }

      return cb(null, {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        roles: user.roles
                      });
    })
  } catch (err) {
    console.error('Error with findone: ' + err);
    return cb(err);
  } 
}))

jwtOptions.jwtFromRequest = cookieExtractor;
jwtOptions.secretOrKey = process.env.JWT_SECRET_KEY;

passport.use(new JWTStrategy(jwtOptions, (jwtPayload, done) => {
    User.findOne({username: jwtPayload.username})
    .then(user => {
        if(user) {
            return done(null, user);
        }
        return done(null, false);
    }).catch(err => {
        console.error(err);
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