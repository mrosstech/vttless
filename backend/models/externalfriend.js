const mongoose = require("mongoose");

const ExternalFriend = mongoose.model(
  "ExternalFriend",
  new mongoose.Schema({
    requestor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    email: {
        type: String,
        required: true
    }
  })
);

module.exports = ExternalFriend;