require('dotenv').config();
const mongoose = require("mongoose");
const db = require("./models");
const Role = db.Role;
const User = db.User

db.mongoose.connect(process.env.MONGO_URI, { }).then( () => {
    console.log("Successfully connected to MongoDB");
}).catch(err => {
    console.error("Database connection error", err);
    process.exit();
});
