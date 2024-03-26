require('dotenv').config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
//import * as socket from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
    }
 });


const serverPort = 4001;

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("tokenMove", (data) => {
    console.log("Token Move Recieved by the Server");
    socket.broadcast.emit("tokenMove", data);
  
  });
});






httpServer.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})