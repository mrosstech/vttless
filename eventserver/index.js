require('dotenv').config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
//import * as socket from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
    }
 });

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "eventserver" });
});


const serverPort = 4001;

// Track user to socket mapping for direct messaging
const userSocketMap = new Map();

io.on("connection", (socket) => {

  socket.on("tokenMove", (data) => {
    // Removed excessive logging for performance - token moves happen frequently during dragging
    socket.to(data.campaignId).emit("tokenMove", data);
  });

  socket.on("tokenUpdate", (data) => {
    // Keep minimal logging for token updates (less frequent than moves)
    socket.to(data.campaignId).emit("tokenUpdate", data);
  });

  socket.on("characterPlaced", (data) => {
    socket.to(data.campaignId).emit("characterPlaced", data);
  });
  socket.on("joinCampaign", (campaignId, userId) => {
    socket.join(campaignId);
    
    // Track user ID to socket ID mapping for direct WebRTC signaling
    if (userId) {
      userSocketMap.set(userId, socket.id);
    }
  });

  // WebRTC signaling events - send directly to intended recipient
  socket.on("webrtc-offer", (data) => {
    const targetSocketId = userSocketMap.get(data.toUserId);
    if (targetSocketId) {
      // Send directly to the intended recipient
      socket.to(targetSocketId).emit("webrtc-offer", {
        ...data,
        userName: data.userName || data.fromUserName // Ensure userName is forwarded
      });
    } else {
      // Fallback to room broadcast
      socket.to(data.campaignId).emit("webrtc-offer", {
        ...data,
        userName: data.userName || data.fromUserName
      });
    }
  });

  socket.on("webrtc-answer", (data) => {
    const targetSocketId = userSocketMap.get(data.toUserId);
    if (targetSocketId) {
      // Send directly to the intended recipient
      socket.to(targetSocketId).emit("webrtc-answer", data);
    } else {
      // Fallback to room broadcast
      socket.to(data.campaignId).emit("webrtc-answer", data);
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const targetSocketId = userSocketMap.get(data.toUserId);
    if (targetSocketId) {
      // Send directly to the intended recipient
      socket.to(targetSocketId).emit("webrtc-ice-candidate", data);
      // Don't log ICE candidates - too frequent
    } else {
      // Fallback to room broadcast
      socket.to(data.campaignId).emit("webrtc-ice-candidate", data);
    }
  });

  socket.on("user-joined-video", (data) => {
    socket.to(data.campaignId).emit("user-joined-video", data);
  });

  socket.on("user-left-video", (data) => {
    socket.to(data.campaignId).emit("user-left-video", data);
  });

  // Test event to verify socket connectivity
  socket.on("test-event", (data) => {
    socket.to(data.campaignId).emit("test-event", data);
  });

  socket.on("disconnect", () => {
    
    // Clean up user socket mapping
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
});






httpServer.listen(serverPort, ()=>{
    console.log("Server is listening on port " + serverPort);
})