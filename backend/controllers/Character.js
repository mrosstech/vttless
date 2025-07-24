// backend/controllers/Character.js
const { Character, Campaign, Map } = require("../models");

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

        const characters = await Character.find({
            campaignId,
            ownerId: req.user._id
        })
        .populate('assetId')
        .sort({ created: -1 });

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
            hitPoints = 0, 
            maxHitPoints = 0, 
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
            maxHitPoints,
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

        const character = await Character.findById(characterId);
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }

        // Check if user owns this character or is GM
        const campaign = await Campaign.findById(character.campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        if (!isGM && !isOwner) {
            return res.status(403).json({ message: "You can only update your own characters" });
        }

        // Filter allowed updates
        const allowedUpdates = [
            'name', 'assetId', 'level', 'hitPoints', 'maxHitPoints', 'armorClass', 
            'defaultSize', 'notes', 'properties'
        ];
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        Object.assign(character, filteredUpdates);
        await character.save();

        await character.populate('ownerId', 'username');
        await character.populate('assetId');

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

        // Check if user owns this character or is GM
        const campaign = await Campaign.findById(character.campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isGM = campaign.gm.toString() === req.user._id.toString();
        const isOwner = character.ownerId.toString() === req.user._id.toString();

        if (!isGM && !isOwner) {
            return res.status(403).json({ message: "You can only delete your own characters" });
        }

        // Remove character from all maps in the campaign
        await Map.updateMany(
            { campaign: character.campaignId },
            { $pull: { characterInstances: { characterId } } }
        );

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