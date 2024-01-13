const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require('./models/user');

// passport.use('signup', new LocalStrategy({
//     usernameField: 'username',
//     passwordField: 'password',
//     passReqToCallback: true,
//   },
//   async (req, username, password, done) => {
//     try {
//       const user = await User.create({ username, password });
//       return done(null, user);
//     } catch (error) {
//       return done(error);
//     }
// }));
/*
passport.use('login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
  },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const validate = await user.isValidPassword(password);
      if (!validate) {
        return done(null, false, { message: 'Wrong Password' });
      }

      return done(null, user, { message: 'Logged in successfully' });
    } catch (error) {
      return done(error);
    }
}));
*/