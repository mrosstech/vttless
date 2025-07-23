// backend/controllers/Map.js
const { Map, Campaign } = require("../models");
const { analyzeMapImage } = require("../services/mapAnalyzer");

exports.createMap = async (req, res) => {
    try {
        const { name, gridWidth, gridHeight, gridSize, campaign } = req.body;

        // Validate required fields
        if (!name || !gridWidth || !gridHeight || !campaign) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                errors: {
                    ...((!name) && { name: 'Map name is required' }),
                    ...((!gridWidth) && { gridWidth: 'Grid width is required' }),
                    ...((!gridHeight) && { gridHeight: 'Grid height is required' }),
                    ...((!campaign) && { campaign: 'Campaign ID is required' })
                }
            });
        }

        // Verify campaign exists and user has permission
        const campaignDoc = await Campaign.findById(campaign);
        if (!campaignDoc) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if user is GM of the campaign
        if (campaignDoc.gm.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the GM can create maps" });
        }

        const newMap = new Map({
            name,
            campaign,
            gridWidth,
            gridHeight,
            gridSettings: {
                size: gridSize || 40,
                visible: true,
                color: '#ccc'
            }
        });

        await newMap.save();

        // If this is the first map, set it as the active map
        if (!campaignDoc.activeMap) {
            campaignDoc.activeMap = newMap._id;
            await campaignDoc.save();
        }

        res.status(201).json(newMap);
    } catch (error) {
        console.error("Error creating map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getMap = async (req, res) => {
    try {
        const map = await Map.findById(req.params.id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check if user has access to the campaign
        const campaign = await Campaign.findById(map.campaign);
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

        res.json(map);
    } catch (error) {
        console.error("Error fetching map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateMap = async (req, res) => {
    try {
        const map = await Map.findById(req.params.id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check if user is GM of the campaign
        const campaign = await Campaign.findById(map.campaign);
        if (!campaign || campaign.gm.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the GM can update maps" });
        }

        const allowedUpdates = ['name', 'gridWidth', 'gridHeight', 'gridSettings', 'backgroundImage', 'tokens'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        Object.assign(map, updates);
        await map.save();

        res.json(map);
    } catch (error) {
        console.error("Error updating map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteMap = async (req, res) => {
    try {
        const map = await Map.findById(req.params.id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check if user is GM of the campaign
        const campaign = await Campaign.findById(map.campaign);
        if (!campaign || campaign.gm.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the GM can delete maps" });
        }

        // If this is the active map, clear the activeMap reference
        if (campaign.activeMap && campaign.activeMap.toString() === map._id.toString()) {
            campaign.activeMap = null;
            await campaign.save();
        }

        await map.deleteOne();
        res.json({ message: "Map deleted successfully" });
    } catch (error) {
        console.error("Error deleting map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getCampaignMaps = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.campaignId);
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

        const maps = await Map.find({ campaign: req.params.campaignId });
        res.json(maps);
    } catch (error) {
        console.error("Error fetching campaign maps:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Token management endpoints
exports.addToken = async (req, res) => {
    try {
        const map = await Map.findById(req.params.id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check if user has access to the campaign (either GM or player)
        const campaign = await Campaign.findById(map.campaign);
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

        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token data is required" });
        }

        // Validate token structure
        const requiredFields = ['id', 'assetId', 'x', 'y', 'width', 'height', 'ownerId', 'name'];
        const missingFields = requiredFields.filter(field => !token.hasOwnProperty(field));
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: "Missing required token fields", 
                missingFields 
            });
        }

        // Check if token ID already exists on the map
        const existingToken = map.tokens.find(t => t.id === token.id);
        if (existingToken) {
            return res.status(400).json({ message: "Token with this ID already exists" });
        }

        // Add token to map
        map.tokens.push(token);
        await map.save();

        res.status(201).json({ message: "Token added successfully", token });
    } catch (error) {
        console.error("Error adding token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateToken = async (req, res) => {
    try {
        const map = await Map.findById(req.params.id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check if user has access to the campaign
        const campaign = await Campaign.findById(map.campaign);
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

        const tokenId = req.params.tokenId;
        const tokenIndex = map.tokens.findIndex(token => token.id === tokenId);
        
        if (tokenIndex === -1) {
            return res.status(404).json({ message: "Token not found" });
        }

        // Check if user owns this token (unless they're the GM)
        const token = map.tokens[tokenIndex];
        if (!isGM && token.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only update your own tokens" });
        }

        // Update token properties
        const allowedUpdates = ['x', 'y', 'width', 'height', 'name', 'properties'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        Object.assign(map.tokens[tokenIndex], updates);
        await map.save();

        res.json({ message: "Token updated successfully", token: map.tokens[tokenIndex] });
    } catch (error) {
        console.error("Error updating token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteToken = async (req, res) => {
    try {
        const map = await Map.findById(req.params.id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Check if user has access to the campaign
        const campaign = await Campaign.findById(map.campaign);
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

        const tokenId = req.params.tokenId;
        const tokenIndex = map.tokens.findIndex(token => token.id === tokenId);
        
        if (tokenIndex === -1) {
            return res.status(404).json({ message: "Token not found" });
        }

        // Check if user owns this token (unless they're the GM)
        const token = map.tokens[tokenIndex];
        if (!isGM && token.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only delete your own tokens" });
        }

        // Remove token from array
        map.tokens.splice(tokenIndex, 1);
        await map.save();

        res.json({ message: "Token deleted successfully" });
    } catch (error) {
        console.error("Error deleting token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Map analysis endpoint
exports.analyzeMap = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: "No image file provided" 
            });
        }

        console.log("Analyzing map image:", req.file.path);
        const analysisResult = await analyzeMapImage(req.file.path);
        
        // Add suggestions based on analysis
        if (analysisResult.success) {
            analysisResult.suggestions = {
                gridWidth: Math.max(1, Math.round(analysisResult.gridWidth)),
                gridHeight: Math.max(1, Math.round(analysisResult.gridHeight)),
                gridSize: Math.max(20, Math.round(analysisResult.gridSize))
            };
        }

        res.json(analysisResult);
    } catch (error) {
        console.error("Error analyzing map:", error);
        res.status(500).json({ 
            success: false,
            message: "Analysis failed",
            error: error.message,
            // Provide fallback values
            gridHeight: 10,
            gridWidth: 10,
            gridSize: 40,
            confidence: 0.0
        });
    }
};