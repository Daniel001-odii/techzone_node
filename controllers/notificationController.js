const Notification = require('../models/notificationModel');


const notification = new Notification({
    recipientId: userId, // User or employer ID
    message: 'Your notification message here',
    timestamp: new Date(),
    type: 'message', // Optional
  });
  


 
  // Send a notification
  exports.sendNotification = async (req, res) => {
    try {
      const { senderId, senderModel, recipientId, recipientModel, message } = req.body;
  
      const notification = new Notification({
        senderId,
        senderModel,
        recipientId,
        recipientModel,
        message,
      });
  
      await notification.save();
  
      res.status(201).json({ message: 'Notification sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error sending notification' });
    }
  };
  
  // Get notifications for a specific user or employer
  exports.getNotifications = async (req, res) => {
    try {
      const { userId, userType } = req.params;
  
      const notifications = await Notification.find({
        recipientId: userId,
        recipientModel: userType,
      }).sort({ createdAt: -1 });
  
      res.status(200).json({ notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving notifications' });
    }
  };
  


  // Mark a notification as read
  exports.markNotificationAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
  
      const notification = await Notification.findById(notificationId);
  
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
  
      notification.isRead = true;
      await notification.save();
  
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error marking notification as read' });
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
  

  // Save the notification to the user's/employer's notifications array
  user.notifications.push(notification);
  await user.save();
  
  // Save the notification to the notifications collection
  await notification.save();