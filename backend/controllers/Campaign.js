const { Campaign } = require('../models');
const passport = require('passport');

exports.list = async (req, res, next) => {
    try {
        const { user } = req;
        console.log(user);
        const campaigns = await Campaign.find({ $or: [ {"gm": user._id}, {"players": { $elemMatch: { $eq: user._id }}} ] } );
        res.send({campaigns: campaigns});
        next;
    } catch (err) {
        console.log(err);
        res.send({error: "Error getting campaigns"});
    }
}

exports.add = async (req, res, next) => {
    try {
        const {name, description, players, gm} = req.body;
        const { user } = req;
        console.log(user);
        const newCampaign = new Campaign({
            name, description, players, gm
        });
        console.log("Saving new campaign!");
        await newCampaign.save();
        res.status(201).send({message: "Campaign added successfully!"});
    } catch (err) {
        console.log(err);
        res.send({error: "Error adding new campaign"});
    }
}

exports.delete = async (req, res, next) => {
    try{
        const { user } = req;
        const {campaignId} = req.body;
        const deleteResult = await Campaign.deleteOne({$and: [{"_id": campaignId}, {"gm": user._id}]});
        if (deleteResult.deletedCount > 0) {
            console.log("Campaign deleted!");
            res.status(201).send({message: "Campaign deleted successfully"});
        } else {
            console.log("Campaign not found");
            res.status(400).send({error: "Campaign not found"});
        }
    } catch (err) {
        console.log("Error deleting campaign");
        res.status(500).send({ error: "Server error deleting campaign"});
    }
}

exports.update = async (req, res, next) => {
    try {
        const {user} = req;
        const {name, description, players, gm, id} = req.body;
        updateResult = await Campaign.updateOne(
            { $and: [{_id: id}, {gm: user._id}]},
            {
                $set: { name: name, description: description, players: players, gm: gm},
                $currentDate: { lastModified: true}
            }
        );
        if (updateResult.matchedCount == 1 && updateResult.modifiedCount == 1) {
            console.log("Campaign updated successfully");
            res.status(201).send({message: "Campaign updated successfully"});
        } else {
            console.log("No campaign to update");
            res.status(400).send({message: "No campaign to update"});
        }
    } catch (err) {
        console.log("Error updating campaign");
        res.status(500).send({ error: "Server error updating campaign"});
    }
}