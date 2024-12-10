const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    name: String,
    type: { type: String, enum: ['token', 'background', 'other'] },
    key: String, // S3 key instead of URL
    status: { type: String, enum: ['pending', 'active', 'deleted'], default: 'pending' },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);