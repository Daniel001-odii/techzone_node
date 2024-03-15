const Notification  = require('../models/notificationModel');


exports.notify = (message) => {
    io.emit('notification', { message });
    res.status(200).json({ success: true });
}

exports.getNotifications = async (req, res) => {
    try{
        const notifications = await Notification.find({ user:req.userId });
        res.status(200).json({ notifications })
    }catch(error){
        console.log("error getting notifications", error)
    }
}


exports.getUnreadNotifications = async (req, res) => {
    try{
        const notifications = await Notification.find({ user:req.userId, isRead: false });
        res.status(200).json({ notifications })
    }catch(error){
        console.log("error getting notifications", error)
    }
}

exports.markAsRead = async (req, res) => {
    const notification_id = req.params.notification_id;

    try{
        
        const notification = await Notification.findById(notification_id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: "notification mark as read" })
    }catch(error){
        console.log("error getting notifications", error)
    }
}