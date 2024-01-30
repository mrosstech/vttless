const passport = require('passport');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
    passport.authenticate('local', {session: false}, (err, user, info) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: info.message });
      }
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        expires: Date.now() + parseInt(process.env.JWT_EXPIRATION_MS),
      };
  
      req.login(payload, {session: false}, (error) => {
        if (error) {
          res.status(400).send({ error });
        }
  
        const token = jwt.sign(JSON.stringify(payload), process.env.JWT_SECRET_KEY);
        res.cookie('vttless-jwt', token, {httpOnly: true, secure: false });
        res.status(200).send({ user });
      });
    }) (req, res, next);
  };

exports.validate = async (req, res, next) => {
    try {  
      console.log("Validated!");
      const { cookies } = req;
      
      console.log(req.user);
      res.status(200).send({ username: user.username,
                              email: user.email,
                              roles: user.roles
                          });
    
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.logout = async (req, res, next) => {
    res.status(202).clearCookie('vttless-jwt').send({message: "Cookie cleared"});
}
  