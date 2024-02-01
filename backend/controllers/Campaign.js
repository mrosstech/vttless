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
    //res.send({message: "campaign lists not implemented"});
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
    //res.send({message: "add a new campaign not implemented"});
}

exports.delete = async (req, res, next) => {
    res.send({message: "delete campaign not implemented"});
}

exports.update = async (req, res, next) => {
    res.send({message: "update campaign not implemented"});
}