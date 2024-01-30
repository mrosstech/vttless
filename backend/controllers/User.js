const mongoose = require("mongoose");
const { User, Role } = require("../models");
const bcrypt = require("bcryptjs");


// Function to register a new user
exports.signup = async (req, res) => {
    try {
        const {email, username, password} = req.body;
        console.log("New user request!  Username: " + username);
        // Ensure that the username and email don't already exist
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "User e-mail already exists!"});
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists!"});
        }

        var userRole = await Role.findOne({"name": "User"});
        console.log(userRole);
        const newUser = new User({
            email, username, password, roles: [userRole._id]
        });

        await newUser.save().catch(function(err) {
            console.log(err);
        });

        res.status(201).json({ message: "User registered successfully ", user: newUser });

    } catch (error) {
        console.error("Error registering customer", error);
        res.status(500).json({message: "Internal server error"});
    }
};

