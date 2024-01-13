const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.User = require("./user.js");
db.Role = require("./roles.js");

db.ROLES = ["user", "admin"];

module.exports = db;