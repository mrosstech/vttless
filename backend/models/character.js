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
        required: false,
        default: null
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    assetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Asset',
        required: false,
        default: null
    },
    
    // Basic character info
    class: { 
        type: String, 
        default: ''
    },
    race: { 
        type: String, 
        default: ''
    },
    background: { 
        type: String, 
        default: ''
    },
    alignment: { 
        type: String, 
        default: ''
    },
    
    // Character progression data
    level: { 
        type: Number, 
        default: 1,
        min: 1
    },
    hitPoints: {
        max: {
            type: Number,
            default: 0
        },
        current: {
            type: Number,
            default: 0
        }
    },
    armorClass: { 
        type: Number,
        default: 10
    },
    speed: {
        type: Number,
        default: 30
    },
    
    // Ability scores with modifiers
    abilities: {
        strength: { 
            score: { type: Number, default: 10 },
            modifier: { type: Number, default: 0 }
        },
        dexterity: { 
            score: { type: Number, default: 10 },
            modifier: { type: Number, default: 0 }
        },
        constitution: { 
            score: { type: Number, default: 10 },
            modifier: { type: Number, default: 0 }
        },
        intelligence: { 
            score: { type: Number, default: 10 },
            modifier: { type: Number, default: 0 }
        },
        wisdom: { 
            score: { type: Number, default: 10 },
            modifier: { type: Number, default: 0 }
        },
        charisma: { 
            score: { type: Number, default: 10 },
            modifier: { type: Number, default: 0 }
        }
    },
    
    // Skills and saves
    savingThrows: { type: mongoose.Schema.Types.Mixed, default: {} },
    skills: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Combat and abilities
    attacks: [{ type: mongoose.Schema.Types.Mixed }],
    spells: [{ type: mongoose.Schema.Types.Mixed }],
    feats: [{ type: mongoose.Schema.Types.Mixed }],
    inventory: [{ type: mongoose.Schema.Types.Mixed }],
    
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
characterSchema.index({ ownerId: 1 }); // For fetching all user characters
characterSchema.index({ campaignId: 1, ownerId: 1 }); // For campaign-specific characters
characterSchema.index({ campaignId: 1 });

module.exports = mongoose.model('Character', characterSchema);