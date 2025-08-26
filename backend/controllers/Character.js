// backend/controllers/Character.js
const { Character, Campaign, Map, Asset } = require("../models");

// Migration helper to convert old ability format to new format
const migrateCharacterAbilities = (character) => {
    if (!character.abilities) return character;
    
    const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const needsMigration = abilityNames.some(ability => 
        character.abilities[ability] && typeof character.abilities[ability] === 'number'
    );
    
    if (needsMigration) {
        console.log(`🔄 Migrating abilities for character ${character.name}`);
        abilityNames.forEach(ability => {
            if (character.abilities[ability] && typeof character.abilities[ability] === 'number') {
                const score = character.abilities[ability];
                character.abilities[ability] = {
                    score: score,
                    modifier: Math.floor((score - 10) / 2)
                };
            }
        });
        console.log(`✅ Migrated abilities:`, character.abilities);
    }
    
    return character;
};

// Get all characters for the current user across all campaigns
exports.getAllUserCharacters = async (req, res) => {
    try {
        // Get all characters owned by the current user
        const characters = await Character.find({
            ownerId: req.user._id
        })
        .populate('ownerId', 'username')
        .populate('assetId')
        .populate('campaignId', 'name') // Include campaign name for display
        .sort({ created: -1 });

        // Migrate characters with old ability format
        const migratedCharacters = characters.map(character => {
            const migrated = migrateCharacterAbilities(character);
            if (migrated !== character) {
                // Save the migrated character
                migrated.save().catch(err => console.error('Migration save error:', err));
            }
            return migrated;
        });

        res.json(migratedCharacters);
    } catch (error) {
        console.error("Error fetching user characters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new character (general, not campaign-specific)
exports.createUserCharacter = async (req, res) => {
    try {
        const { 
            name, 
            class: characterClass,
            level = 1,
            race,
            background,
            alignment,
            hitPoints = { max: 0, current: 0 },
            armorClass = 10,
            speed = 30,
            abilities = {
                strength: { score: 10, modifier: 0 },
                dexterity: { score: 10, modifier: 0 },
                constitution: { score: 10, modifier: 0 },
                intelligence: { score: 10, modifier: 0 },
                wisdom: { score: 10, modifier: 0 },
                charisma: { score: 10, modifier: 0 }
            },
            savingThrows = {},
            skills = {},
            attacks = [],
            spells = [],
            feats = [],
            inventory = [],
            notes = '',
            assetId,
            campaignId // Optional - can be null for general characters
        } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Character name is required'
            });
        }

        // If campaignId is provided, verify user has access to that campaign
        if (campaignId) {
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            const isGM = campaign.gm.toString() === req.user._id.toString();
            const isPlayer = campaign.players.some(player => 
                player.toString() === req.user._id.toString()
            );

            if (!isGM && !isPlayer) {
                return res.status(403).json({ message: "Access denied to campaign" });
            }
        }

        const newCharacter = new Character({
            name: name.trim(),
            class: characterClass,
            level,
            race,
            background,
            alignment,
            hitPoints,
            armorClass,
            speed,
            abilities,
            savingThrows,
            skills,
            attacks,
            spells,
            feats,
            inventory,
            notes,
            ownerId: req.user._id,
            assetId: assetId,
            campaignId: campaignId,
            defaultSize: { width: 40, height: 40 },
            properties: {}
        });

        await newCharacter.save();

        // Populate the response
        await newCharacter.populate('ownerId', 'username');
        await newCharacter.populate('assetId');
        if (campaignId) {
            await newCharacter.populate('campaignId', 'name');
        }

        res.status(201).json(newCharacter);
    } catch (error) {
        console.error("Error creating character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all characters for a campaign
exports.getCampaignCharacters = async (req, res) => {
    try {
        const { campaignId } = req.params;

        // Verify campaign exists and user has access
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isPlayer = campaign.players.some(player => 
            player.toString() === req.user._id.toString()
        );

        if (!isGM && !isPlayer) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Get characters for this campaign
        let query = { campaignId };
        
        // Players can only see their own characters unless GM
        if (!isGM) {
            query.ownerId = req.user._id;
        }

        const characters = await Character.find(query)
            .populate('ownerId', 'username')
            .populate('assetId')
            .sort({ created: -1 });

        res.json(characters);
    } catch (error) {
        console.error("Error fetching campaign characters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get user's characters for a campaign
exports.getUserCampaignCharacters = async (req, res) => {
    try {
        const { campaignId } = req.params;

        // Verify campaign exists and user has access
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isPlayer = campaign.players.some(player => 
            player.toString() === req.user._id.toString()
        );

        if (!isGM && !isPlayer) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Try new Character model first
        let characters = await Character.find({
            campaignId,
            ownerId: req.user._id
        })
        .populate('assetId')
        .sort({ created: -1 });


        // Check for legacy token assets that haven't been migrated yet
        const existingAssetIds = characters.map(char => char.assetId._id.toString());
        
        const legacyAssets = await Asset.find({
            campaign: campaignId,
            uploadedBy: req.user._id,
            type: 'token',
            status: 'active',
            _id: { $nin: existingAssetIds } // Only assets not already converted
        }).sort({ created: -1 });


        // Auto-migrate legacy assets to characters
        const migratedCharacters = [];
        for (const asset of legacyAssets) {
            try {
                const newCharacter = new Character({
                    name: asset.name || 'Imported Character',
                    campaignId,
                    ownerId: req.user._id,
                    assetId: asset._id,
                    level: 1,
                    hitPoints: { max: 0, current: 0 },
                    armorClass: 10,
                    defaultSize: { width: 40, height: 40 },
                    notes: 'Auto-migrated from legacy token',
                    properties: { migrated: true, originalAssetId: asset._id }
                });

                await newCharacter.save();
                await newCharacter.populate('assetId');
                migratedCharacters.push(newCharacter);
                
            } catch (migrationError) {
                console.error(`Failed to migrate asset ${asset._id}:`, migrationError);
            }
        }

        // Combine existing characters with newly migrated ones
        characters = [...characters, ...migratedCharacters];
        
        if (migratedCharacters.length > 0) {
            
            // Clean up legacy tokens that have been migrated to characters
            const migratedAssetIds = migratedCharacters.map(char => char.assetId._id);
            
            try {
                // Find maps with legacy tokens that need to be migrated
                const mapsWithLegacyTokens = await Map.find({
                    campaign: campaignId,
                    'tokens.assetId': { $in: migratedAssetIds },
                    'tokens.ownerId': req.user._id
                });
                
                for (const map of mapsWithLegacyTokens) {
                    const legacyTokensToMigrate = map.tokens.filter(token => 
                        migratedAssetIds.some(id => id.equals(token.assetId)) && 
                        token.ownerId.equals(req.user._id)
                    );
                    
                    for (const legacyToken of legacyTokensToMigrate) {
                        // Find the corresponding migrated character
                        const migratedCharacter = migratedCharacters.find(char => 
                            char.assetId._id.equals(legacyToken.assetId)
                        );
                        
                        if (migratedCharacter) {
                            // Check if character instance already exists on this map
                            const existingInstance = map.characterInstances.find(instance => 
                                instance.characterId.equals(migratedCharacter._id)
                            );
                            
                            if (!existingInstance) {
                                // Migrate the legacy token position to a character instance
                                map.characterInstances.push({
                                    characterId: migratedCharacter._id,
                                    x: legacyToken.x,
                                    y: legacyToken.y,
                                    width: legacyToken.width || 40,
                                    height: legacyToken.height || 40,
                                    visible: true
                                });
                                
                            }
                        }
                    }
                    
                    // Remove the legacy tokens
                    map.tokens = map.tokens.filter(token => 
                        !(migratedAssetIds.some(id => id.equals(token.assetId)) && 
                          token.ownerId.equals(req.user._id))
                    );
                    
                    await map.save();
                }
                
            } catch (cleanupError) {
                console.error('Error cleaning up legacy tokens:', cleanupError);
            }
        }

        res.json(characters);
    } catch (error) {
        console.error("Error fetching user campaign characters:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new character
exports.createCharacter = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { 
            name, 
            assetId, 
            level = 1, 
            hitPoints = { max: 0, current: 0 },
            armorClass = 10,
            defaultSize = { width: 40, height: 40 },
            notes, 
            properties 
        } = req.body;

        // Validate required fields
        if (!name || !assetId) {
            return res.status(400).json({
                message: 'Name and asset are required',
                errors: {
                    ...((!name) && { name: 'Character name is required' }),
                    ...((!assetId) && { assetId: 'Character asset is required' })
                }
            });
        }

        // Verify campaign exists and user has access
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isPlayer = campaign.players.some(player => 
            player.toString() === req.user._id.toString()
        );

        if (!isGM && !isPlayer) {
            return res.status(403).json({ message: "Access denied" });
        }

        const newCharacter = new Character({
            name: name.trim(),
            campaignId,
            ownerId: req.user._id,
            assetId,
            level,
            hitPoints,
            armorClass,
            defaultSize,
            notes: notes || '',
            properties: properties || {}
        });

        await newCharacter.save();

        // Populate the response
        await newCharacter.populate('ownerId', 'username');
        await newCharacter.populate('assetId');

        res.status(201).json(newCharacter);
    } catch (error) {
        console.error("Error creating character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update a character
exports.updateCharacter = async (req, res) => {
    try {
        const { characterId } = req.params;
        const updates = req.body;
        
        console.log('📝 Updating character:', characterId);
        console.log('📤 Update data received:', JSON.stringify(updates, null, 2));

        const character = await Character.findById(characterId);
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        // Check if user owns this character or is GM (for campaign characters)
        let isGM = false;
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        // If character belongs to a campaign, check GM permissions
        if (character.campaignId) {
            const campaign = await Campaign.findById(character.campaignId);
            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }
            isGM = campaign.gm.toString() === req.user._id.toString();
        }

        if (!isGM && !isOwner) {
            return res.status(403).json({ message: "You can only update your own characters" });
        }

        // Filter allowed updates
        const allowedUpdates = [
            'name', 'class', 'race', 'background', 'alignment', 'assetId', 'level', 
            'hitPoints', 'armorClass', 'speed', 'abilities', 'savingThrows', 'skills',
            'attacks', 'spells', 'feats', 'inventory', 'defaultSize', 'notes', 'properties'
        ];
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        console.log('🔍 Filtered updates to apply:', JSON.stringify(filteredUpdates, null, 2));
        console.log('🔍 Character before update:', JSON.stringify(character.abilities, null, 2));
        
        Object.assign(character, filteredUpdates);
        
        // Apply migration if needed (for old characters or mixed data)
        migrateCharacterAbilities(character);
        
        await character.save();
        
        console.log('✅ Character saved with abilities:', JSON.stringify(character.abilities, null, 2));

        await character.populate('ownerId', 'username');
        await character.populate('assetId');
        if (character.campaignId) {
            await character.populate('campaignId', 'name');
        }

        res.json(character);
    } catch (error) {
        console.error("Error updating character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a character
exports.deleteCharacter = async (req, res) => {
    try {
        const { characterId } = req.params;

        const character = await Character.findById(characterId);
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        // Check if user owns this character or is GM (for campaign characters)
        let isGM = false;
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        // If character belongs to a campaign, check GM permissions
        if (character.campaignId) {
            const campaign = await Campaign.findById(character.campaignId);
            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }
            isGM = campaign.gm.toString() === req.user._id.toString();

            // Remove character from all maps in the campaign
            await Map.updateMany(
                { campaign: character.campaignId },
                { $pull: { characterInstances: { characterId } } }
            );
        }

        if (!isGM && !isOwner) {
            return res.status(403).json({ message: "You can only delete your own characters" });
        }

        // Delete the character
        await character.deleteOne();

        res.json({ message: "Character deleted successfully" });
    } catch (error) {
        console.error("Error deleting character:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Place character on a map
exports.placeCharacterOnMap = async (req, res) => {
    try {
        const { characterId, mapId } = req.params;
        const { x, y, width, height } = req.body;

        // Validate required position data
        if (x === undefined || y === undefined) {
            return res.status(400).json({ 
                message: "Position coordinates (x, y) are required" 
            });
        }

        const character = await Character.findById(characterId);
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        const map = await Map.findById(mapId);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Verify character and map belong to same campaign
        if (character.campaignId.toString() !== map.campaign.toString()) {
            return res.status(400).json({ 
                message: "Character and map must belong to the same campaign" 
            });
        }

        // Check permissions
        const campaign = await Campaign.findById(character.campaignId);
        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        if (!isGM && !isOwner) {
            return res.status(403).json({ 
                message: "You can only place your own characters" 
            });
        }

        // Check if character is already on this map
        const existingInstance = map.characterInstances.find(
            instance => instance.characterId.toString() === characterId
        );

        if (existingInstance) {
            return res.status(409).json({ 
                message: "Character is already placed on this map" 
            });
        }

        // Use provided dimensions or character defaults
        const finalWidth = width || character.defaultSize.width;
        const finalHeight = height || character.defaultSize.height;

        // Add character instance to map
        map.characterInstances.push({
            characterId,
            x,
            y,
            width: finalWidth,
            height: finalHeight,
            visible: true
        });

        await map.save();

        res.json({ 
            message: "Character placed on map successfully",
            instance: {
                characterId,
                x,
                y,
                width: finalWidth,
                height: finalHeight,
                visible: true
            }
        });
    } catch (error) {
        console.error("Error placing character on map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Remove character from a map
exports.removeCharacterFromMap = async (req, res) => {
    try {
        const { characterId, mapId } = req.params;

        const character = await Character.findById(characterId);
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        const map = await Map.findById(mapId);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check permissions
        const campaign = await Campaign.findById(character.campaignId);
        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        if (!isGM && !isOwner) {
            return res.status(403).json({ 
                message: "You can only remove your own characters" 
            });
        }

        // Remove character instance from map
        map.characterInstances = map.characterInstances.filter(
            instance => instance.characterId.toString() !== characterId
        );

        await map.save();

        res.json({ message: "Character removed from map successfully" });
    } catch (error) {
        console.error("Error removing character from map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update character position on map (for drag/drop)
exports.updateCharacterPosition = async (req, res) => {
    try {
        const { characterId, mapId } = req.params;
        const { x, y, width, height } = req.body;

        const character = await Character.findById(characterId);
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        const map = await Map.findById(mapId);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check permissions
        const campaign = await Campaign.findById(character.campaignId);
        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        if (!isGM && !isOwner) {
            return res.status(403).json({ 
                message: "You can only move your own characters" 
            });
        }

        // Find and update character instance
        const instanceIndex = map.characterInstances.findIndex(
            instance => instance.characterId.toString() === characterId
        );

        if (instanceIndex === -1) {
            return res.status(404).json({ 
                message: "Character not found on this map" 
            });
        }

        // Update position and optionally size
        if (x !== undefined) map.characterInstances[instanceIndex].x = x;
        if (y !== undefined) map.characterInstances[instanceIndex].y = y;
        if (width !== undefined) map.characterInstances[instanceIndex].width = width;
        if (height !== undefined) map.characterInstances[instanceIndex].height = height;

        await map.save();

        res.json({ 
            message: "Character position updated successfully",
            instance: map.characterInstances[instanceIndex]
        });
    } catch (error) {
        console.error("Error updating character position:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};