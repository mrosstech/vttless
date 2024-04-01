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
    console.log("Token move for campaign: " + data.campaignId + " and token: " + data.tokenId + " and x: " + data.x + " and y: " + data.y + "and player: " + data.playerId);
    
    socket.to(data.campaignId).emit("tokenMove", data);
  
  });
  socket.on("joinCampaign", (campaignId) => {
    console.log("Joining campaign: " + campaignId + " for user: " + socket.id);
    socket.join(campaignId);
  })
});






httpServer.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})