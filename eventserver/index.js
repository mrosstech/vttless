require('dotenv').config();
const express = require("express");
const serverPort = 4001
const app = express();
const cors = require("cors");
const http = require("http");
const {Server} = require("socket.io");

app.use(cors());
const server = http.createServer(app);
const io = new Server(server);
io.on("connection", (socket) => {
  console.log("a user connected");
})




app.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})