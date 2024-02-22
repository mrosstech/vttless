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
        required: false
    },
    confirmed: {
        type: Boolean,
        required: true
    },
    external: {
        type: Boolean,
        required: true
    },
    email: {
        type: String,
        required: false
    }

  })
);

module.exports = Friend;