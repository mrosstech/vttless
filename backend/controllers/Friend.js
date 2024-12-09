const { Friend, User } = require('../models');


exports.add = async (req, res) => {
    try {
        const { emails } = req.body;
        const results = [];

        for (const email of emails) {
            // Find user by email
            const requestee = await User.findOne({ email });
            
            if (!requestee) {
                results.push({ email, status: 'not_found' });
                continue;
            }

            // Check if friend request already exists
            const existingRequest = await Friend.findOne({
                $or: [
                    { requestor: req.user._id, requestee: requestee._id },
                    { requestor: requestee._id, requestee: req.user._id }
                ]
            });

            if (existingRequest) {
                results.push({ email, status: 'already_exists' });
                continue;
            }

            // Create new friend request
            const friendRequest = new Friend({
                requestor: req.user._id,
                requestee: requestee._id
            });

            await friendRequest.save();
            results.push({ email, status: 'success' });
        }

        res.status(201).json({ results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.list = async (req, res) => {
    try {
        // Find all confirmed friendships where user is either requestor or requestee
        const friends = await Friend.find({
            $and: [
                {
                    $or: [
                        { requestor: req.user._id },
                        { requestee: req.user._id }
                    ]
                },
                { confirmed: true }
            ]
        })
        .populate('requestor', 'username email')
        .populate('requestee', 'username email');

        // Format the response to only include friend's information
        const formattedFriends = friends.map(friendship => {
            const friend = friendship.requestor._id.equals(req.user._id) 
                ? friendship.requestee 
                : friendship.requestor;
            return {
                _id: friend._id,
                username: friend.username,
                email: friend.email
            };
        });

        res.json(formattedFriends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.pending = async (req, res) => {
    try {
        // Find pending friend requests sent to the user
        const pendingRequests = await Friend.find({
            requestee: req.user._id,
            confirmed: false
        })
        .populate('requestor', 'username email');

        res.json(pendingRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.confirm = async (req, res) => {
    try {
        const { requestId } = req.body;
        
        const friendRequest = await Friend.findOne({
            _id: requestId,
            requestee: req.user._id,
            confirmed: false
        });

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        friendRequest.confirmed = true;
        friendRequest.lastModified = Date.now();
        await friendRequest.save();

        res.json({ message: 'Friend request confirmed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.reject = async (req, res) => {
    try {
        const { requestId } = req.body;
        
        const result = await Friend.deleteOne({
            _id: requestId,
            requestee: req.user._id,
            confirmed: false
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { friendId } = req.body;
        
        const result = await Friend.deleteOne({
            $or: [
                { requestor: req.user._id, requestee: friendId },
                { requestor: friendId, requestee: req.user._id }
            ],
            confirmed: true
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Friendship not found' });
        }

        res.json({ message: 'Friend removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};