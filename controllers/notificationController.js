const Notification  = require('../models/notificationModel');


exports.notify = (message) => {
    io.emit('notification', { message });
    res.status(200).json({ success: true });
}

exports.getNotifications = async (req, res) => {
    try{
        if(req.user){
            console.log("getting user notifics...")
            const notifications = await Notification.find({ user: req.userId });
            res.status(200).json({ notifications });
        } else if(req.employer){
            console.log("getting employer notifics...")
            const notifications = await Notification.find({ employer: req.employerId });
            res.status(200).json({ notifications })
        }
        
    }catch(error){
        console.log("error getting notifications", error)
    }
}


exports.getUnreadNotifications = async (req, res) => {
    try{
        if(req.user){
            console.log("getting user notifics...")
            const notifications = await Notification.find({ user: req.userId, isRead: false });
            res.status(200).json({ notifications });
        } else if(req.employer){
            console.log("getting employer notifics...")
            const notifications = await Notification.find({ employer: req.employerId, isRead: false });
            res.status(200).json({ notifications })
        }
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
};


exports.deleteAllUserNotifications = async (req, res) => {
    try {
        if (req.user) {
            console.log("Deleting user notifications...");
            await Notification.deleteMany({ user: req.userId });
            res.status(200).json({ message: "All user notifications deleted successfully" });
        } else if (req.employer) {
            console.log("Deleting employer notifications...");
            await Notification.deleteMany({ employer: req.employerId });
            res.status(200).json({ message: "All employer notifications deleted successfully" });
        }
    } catch (error) {
        console.log("Error deleting notifications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};