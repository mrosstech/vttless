// backend/controllers/Map.js
const { Map, Campaign } = require("../models");

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

        const allowedUpdates = ['name', 'gridWidth', 'gridHeight', 'gridSettings'];
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