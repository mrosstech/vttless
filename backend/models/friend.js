const mongoose = require("mongoose");

const Friend = mongoose.model(
  "Friend",
  new mongoose.Schema({
    requestor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    requestee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    confirmed: {
        type: Boolean,
        required: true
    }

  })
);

module.exports = Friend;