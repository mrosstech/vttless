const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    campaignId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Campaign', 
        required: true 
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    assetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Asset',
        required: true
    },
    
    // Character progression data
    level: { 
        type: Number, 
        default: 1,
        min: 1
    },
    hitPoints: { 
        type: Number,
        default: 0
    },
    maxHitPoints: { 
        type: Number,
        default: 0
    },
    armorClass: { 
        type: Number,
        default: 10
    },
    
    // Default size (can be overridden per map)
    defaultSize: {
        width: { 
            type: Number, 
            default: 40 
        },
        height: { 
            type: Number, 
            default: 40 
        }
    },
    
    // Extended metadata
    properties: mongoose.Schema.Types.Mixed,
    notes: { 
        type: String,
        default: ''
    },
    
    // Timestamps
    created: { 
        type: Date, 
        default: Date.now 
    },
    lastModified: { 
        type: Date, 
        default: Date.now 
    }
});

// Update lastModified on save
characterSchema.pre('save', function(next) {
    this.lastModified = new Date();
    next();
});

// Indexes for performance
characterSchema.index({ campaignId: 1, ownerId: 1 });
characterSchema.index({ campaignId: 1 });

module.exports = mongoose.model('Character', characterSchema);