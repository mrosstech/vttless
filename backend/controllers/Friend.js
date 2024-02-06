const { Friend, User } = require('../models');


exports.add = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { user } = req;
        let targetUser = null;

        // Lookup the email or the username based on what's provided
        if (email != null) {
            // Lookup by e-mail
            console.log("Looking up by e-mail: " + email);
            targetUser = await User.findOne({email: email});
        }
        console.log("Target user returned: ");
        console.log(targetUser);
        if (targetUser == null) {
            // No username or e-mail found.
            // TODO: Add logic to send e-mail to unknown users to ask them to join.
            console.log("No user found with this email or username");
            res.status(200).send({message: "Friend request submitted successfully"});
            return;
        }
        const newFriend = new Friend({
            requestor: user._id, requestee: targetUser._id, confirmed: false
        });
        console.log("Saving new friend request!");
        await newFriend.save();
        res.status(201).send({message: "Friend request submitted successfully!"});
    } catch (err) {
        console.log(err);
        res.status(500).send({error: "Error adding new friend request"});
    }
}
exports.unconfirmed = async (req, res, next) => {
    try {
        const {user} = req;
        const friends = await Friend.find({ $and: [ {"requestee": user._id}, {"confirmed": false} ] } );
        res.status(200).send(friends);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: "Error getting unconfirmed friend requests"});
    }
}

exports.confirm = async (req, res, next) => {
    try {
        const {user} = req;
        const {id} = req.body;
        updateResult = await Friend.updateOne(
            { $and: [{_id: id}, {requestee: user._id}]},
            {
                $set: { confirmed: true},
                $currentDate: { lastModified: true}
            }
        );
        if (updateResult.matchedCount == 1 && updateResult.modifiedCount == 1) {
            console.log("Friend request confirmed successfully");
            res.status(201).send({message: "Friend request updated successfully"});
        } else {
            console.log("No friend request to update");
            res.status(400).send({message: "No friend request to update"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({error: "Error updating friend requests"});
    }
}

exports.delete = async (req, res, next) => {
    try {
        const {user} = req;
        const {id} = req.body;
        deleteResult = await Friend.deleteOne( {$and: [{_id: id}, {requestee: user._id}]});
        if (deleteResult.deletedCount > 0) {
            console.log("Friend request deleted!");
            res.status(201).send({message: "Friend request deleted successfully"});
        } else {
            console.log("Friend request not found");
            res.status(400).send({error: "Friend request not found"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({error: "Error removing friend request"});
    }
}
exports.list = async (req, res, next) => {
    try {
        const {user} = req;
        const returnFriends = [];
        const friends = await Friend.find({ $and: [ {$or: [{"requestee": user._id}, {"requestor": user._id}]}, {"confirmed": true} ] } );
   
        for await (const friend of friends) {
            if (friend.requestee.equals(user._id)) {
                findResult = await User.findOne({_id: friend.requestor});
            } else {
                findResult = await User.findOne({_id: friend.requestee});
            }
            returnFriends.push({_id: findResult._id, username: findResult.username});
        };
        console.log('Friends listed successfully');
        res.status(200).send(returnFriends);
    
        
    } catch (err) {
        console.log(err);
        res.status(500).send({error: "Error listing friends"});
    }
}
