const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CampaignSchema = new mongoose.Schema({
    name: { type: String, required: true},
    description: { type: String},
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    gm: { type: mongoose.Schema.Types.ObjectId, ref: "User"}
});


const Campaign = mongoose.model('Campaign', CampaignSchema);

module.exports = Campaign;