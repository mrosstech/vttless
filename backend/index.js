require('dotenv').config();
const express = require("express");
const cors = require("cors")
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
require("./db.js");


const serverPort = 3001
const app = express();


app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(passport.authenticate('session'));

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



app.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})