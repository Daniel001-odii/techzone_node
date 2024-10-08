const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.post("/notify/:user_id", middleware, notificationController.createNewNotification);

// get all notifications...
router.get("/notifications", middleware, notificationController.getNotifications);

// get only unread notifications...
router.get("/notifications/unread", middleware, notificationController.getUnreadNotifications);

// mark notification as read..
router.post("/notifications/:notification_id/read", middleware, notificationController.markAsRead);

router.post("/notifications/clear", middleware, notificationController.deleteAllUserNotifications);


module.exports = router;