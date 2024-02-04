require('dotenv').config();
const express = require("express");
const cors = require("cors")
const MongoStore = require("connect-mongo");
const cookieParser = require('cookie-parser');
require("./db.js");
require("./passport.js");

const serverPort = 3001
const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

const authRoute = require("./routes/auth");
app.use("/auth", authRoute);

const userRoute = require("./routes/users");
const { db } = require('./models/user.js');
app.use("/users", userRoute);

const campaignsRoute = require("./routes/campaigns");
app.use("/campaigns", campaignsRoute);

const friendsRoute = require("./routes/friends");
app.use("/friends", friendsRoute);


app.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})