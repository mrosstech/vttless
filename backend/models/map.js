const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
    name: { type: String, required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    backgroundImage: {
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
        position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 }
        },
        scale: { type: Number, default: 1 }
    },
    tokens: [{
        id: String,
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        properties: mongoose.Schema.Types.Mixed
    }],
    gridSettings: {
        size: { type: Number, default: 40 },
        visible: { type: Boolean, default: true },
        color: { type: String, default: '#ccc' }
    }
});

module.exports = mongoose.model('Map', mapSchema);