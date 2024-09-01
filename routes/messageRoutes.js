
const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController")
const secure = require("../middlewares/authMiddleware");


const { uploadMultipleMessageDocuments } = require('../utils/uploadDocument');

// CREATE A NEW MESSAGE ROOM >>>
router.post("/create-room", messageController.createMessageRoom);

// GET USER MESSAGE ROOMS >>>
router.get("/user/:user_id/rooms", messageController.getUserMessageRooms);

// GET EMPLOYERS MESSAGE ROOMS >>>
router.get("/employer/:employer_id/rooms", messageController.getEmployerMessageRooms);

// GET MESSAGES IN A ROOM >>>
router.get("/room/:room_id/messages", messageController.getMessagesInRoom);

// SEND MESSAGE TO A ROOM >>>
router.post("/room/:room_id", messageController.sendMessageToRoom)

// send status
router.post("/room/:room_id/status/:status", messageController.sendTypingStatus);

// MARK BULK MESSAGES AS READ >>
router.put("/:room_id/read", secure, messageController.markBulkMessageAsRead);


// 
router.post("/room/:room_id/rooms/file", uploadMultipleMessageDocuments, messageController.uploadDocument)

module.exports = router;