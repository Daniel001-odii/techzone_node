const express = require('express');
const http = require('http');
const router = express.Router();
const Room = require('../models/roomModel');
const Message = require('../models/messageModel');
const setupSocketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const mongoose = require('mongoose');

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

// GET USER MESSAGE ROOMS
exports.getUserMessageRooms = async (req, res) => {
  const userId = req.params.user_id;

  try {
    // Fetch rooms for the user and populate employer data
    const rooms = await Room.find({ user: userId }).populate({
      path: 'employer',
      select: 'firstname lastname profile',
    });

    // Fetch unread messages for the employers in those rooms
    const unreadMessages = await Message.find({
      room: { $in: rooms.map(room => room._id) },
      user: { $ne: userId }, // Messages sent by the employer
      isRead: false,
    });

    // Create a map to count unread messages for each room
    const unreadMap = unreadMessages.reduce((acc, message) => {
      const roomId = message.room.toString();
      if (!acc[roomId]) {
        acc[roomId] = 0;
      }
      acc[roomId] += 1;
      return acc;
    }, {});

    // Attach unread message counts to rooms
    rooms.forEach(room => {
      room.unread_messages = unreadMap[room._id.toString()] || 0;
    });

    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch rooms' });
    console.log('error getting user rooms: ', error);
  }
};

// GET EMPLOYER MESSAGE ROOMS
exports.getEmployerMessageRooms = async (req, res) => {
  const employerId = req.params.employer_id;

  try {
    // Fetch rooms for the employer and populate user data
    const rooms = await Room.find({ employer: employerId }).populate({
      path: 'user',
      select: 'firstname lastname profile',
    });

    // Fetch unread messages for the users in those rooms
    const unreadMessages = await Message.find({
      room: { $in: rooms.map(room => room._id) },
      user: { $ne: employerId }, // Messages sent by the user
      isRead: false,
    });

    // Create a map to count unread messages for each room
    const unreadMap = unreadMessages.reduce((acc, message) => {
      const roomId = message.room.toString();
      if (!acc[roomId]) {
        acc[roomId] = 0;
      }
      acc[roomId] += 1;
      return acc;
    }, {});

    // Attach unread message counts to rooms
    rooms.forEach(room => {
      room.unread_messages = unreadMap[room._id.toString()] || 0;
    });

    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch rooms' });
    console.log('error getting employer rooms: ', error);
  }
};



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

      const room = await Room.findById(roomId);
      const today = Date.now();

      // Create a new message
      // const message = new Message({ text, user: userId, room: roomId });
      const message = await Message.create({ text, user: userId, room: roomId });

      room.updatedAt = today;
      console.log("room date updated!!!")

      await room.save();
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

// MARK BULK MESSAGE AS READ >>>
exports.markBulkMessageAsRead = async (req, res) => {
  const userId = req.userId || req.employerId;
  const roomId = req.params.room_id;

  try {
    // Fetch unread messages for the room where the user is not the current user
    const unreadMessages = await Message.find({
      room: roomId,
      isRead: false,
      user: { $ne: userId },
    });

    // Mark each unread message as read
    for (const message of unreadMessages) {
      message.isRead = true;
      await message.save();
    }

    res.status(200).send({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).send({ message: 'Error marking messages as read', error });
    console.log('Error marking messages as read:', error);
  }
};