require('dotenv').config();
const mongoose = require("mongoose");
const db = require("./models");
const Role = db.Role;
const User = db.User

db.mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then( () => {
    console.log("Successfully connected to MongoDB");
}).catch(err => {
    console.error("Connection error", err);
    process.exit();
});
