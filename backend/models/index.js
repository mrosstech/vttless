const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.User = require("./user.js");
db.Role = require("./roles.js");
db.Campaign = require("./campaign.js");
db.Friend = require("./friend.js");
db.ExternalFriend = require("./externalfriend.js");
db.Map = require("./map.js");
db.Asset = require("./asset.js");

db.ROLES = ["user", "admin"];

module.exports = db;