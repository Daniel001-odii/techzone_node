const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

// get all notifications...
router.get("/notifications", middleware, notificationController.getNotifications);

// get only unread notifications...
router.get("/notifications/unread", middleware, notificationController.getUnreadNotifications);

// mark notification as read..
router.post("/notifications/:notification_id/read", middleware, notificationController.markAsRead);


module.exports = router;