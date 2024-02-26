require('dotenv').config();
const express = require("express");

const serverPort = 4000
const app = express();


app.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})