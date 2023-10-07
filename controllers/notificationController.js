const Notification = require('../models/notificationModel');


// Controller to get unread notifications for a user
exports.getUnreadNotifications = async (req, res) => {
  const userId = req.userId || req.employerId; // Assuming you have authentication middleware

  try {
    const unreadNotifications = await Notification.find({
      recipientId: userId,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json(unreadNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};
  

// Controller to mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.notificationId;

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // res.status(500).json({ message: 'Error marking notification as read' });
  }
};



// / Example API endpoint to get unread notifications for a user
exports.getAllNotifications = async (req, res) => {
  const userId = req.userId ? req.userId : req.employerId; // Assuming you have authentication middleware

  try {
    const allNotifications = await Notification.find({
      recipientId: userId,
    }).sort({ createdAt: -1 });

    res.json(allNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};
  
  


  
  // Mark all notifications as read for a specific user or employer
  exports.markAllNotificationsAsRead = async (req, res) => {
    try {
      const { userId, userType } = req.params;
  
      await Notification.updateMany(
        {
          recipientId: userId,
          recipientModel: userType,
          isRead: false,
        },
        { $set: { isRead: true } }
      );
  
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error marking notifications as read' });
    }
  };
  
