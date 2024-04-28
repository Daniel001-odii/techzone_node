const express = require('express');
const http = require('http');
const router = express.Router();
const Room = require('../models/roomModel');
const Message = require('../models/messageModel');
const setupSocketIO = require('socket.io');
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with your server
const io = setupSocketIO(server);


// const { io } = require("../app");

exports.createMessageRoom = async (req, res) => {
    try {
      const { name, userId, employerId } = req.body;

      // Check if the room already exists
      const existingRoom = await Room.findOne({ name, user: userId, employer: employerId });

      if (existingRoom) {
        return res.status(400).json({ error: 'Room already exists' });
      }

      // Create a new room and store references to the user and employer
      const room = new Room({ name: name, user: userId, employer: employerId });
      await room.save();

      res.status(201).json({ room });
      console.log("new room created");
    } catch (error) {
      res.status(500).json({ error: 'Unable to create room' });
      console.log("error creating rooom: ", error);
    }
  };


exports.getUserMessageRooms = async (req, res) => {
    const userId = req.params.user_id;
    try{
      const rooms = await Room.find({ user: userId }).populate("employer");
  
      res.status(200).json({ rooms })
    }catch(error){
      res.status(500).json({ error: 'Unable to fetch rooms' });
      console.log("error getting user rooms: ", error);
    }
  }

// GET EMPLOYER MESSAGE ROOMS >>>
exports.getEmployerMessageRooms = async (req, res) => {
    const employerId = req.params.employer_id;
    try{
      const rooms = await Room.find({ employer: employerId }).populate({
        path: "user",
        select: "firstname lastname profile" // Specify the properties you want to populate
    });
  
      res.status(200).json({ rooms })
    }catch(error){
      res.status(500).json({ error: 'Unable to fetch rooms' });
      console.log("error getting user rooms: ", error);
    }
  }


// GET MESSAGES IN ROOM CONTROLLLER >>>
exports.getMessagesInRoom = async (req, res) => {
    try {
      const roomId = req.params.room_id;
      const messages = await Message.find({ room: roomId });

      res.json({ messages });
    } catch (error) {
      res.status(500).json({ error: 'Unable to fetch messages' });
      console.log("error getting user messages for room: ", error);
    }
  }

// SEND MESSAGE CONTROLLER >>>
exports.sendMessageToRoom = async (req, res) => {
    try {
      const roomId = req.params.room_id;
      const { text, userId } = req.body;

      // Create a new message
      // const message = new Message({ text, user: userId, room: roomId });
      const message = await Message.create({ text, user: userId, room: roomId });
      // await message.save();

      // Emit the message to the room using Socket.io
      io.to(roomId).emit('message', message);
      console.log("new socket msg sent to room: ", roomId);

      res.status(201).json({ message });
    } catch (error) {
      console.error('Error sending message:', error); // Log the error
      res.status(500).json({ error: 'Unable to send message' });
    }
  }