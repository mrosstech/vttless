const mongoose = require("mongoose");


const friendSchema = new mongoose.Schema({
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
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    }

})

// Ensure unique friendship pairs
friendSchema.index({ requestor: 1, requestee: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);