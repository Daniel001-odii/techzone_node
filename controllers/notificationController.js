const { getIo } = require('../utils/socket');
const Notification = require('../models/notificationModel');

// controller to create a new notification
exports.createNewNotification = async (req, res) => {
    try {
        const { message, type, lin } = req.body;
        const user_id = req.params.user_id;

        const newNotification = new Notification({
            user: user_id,
            message,
        });

        console.log("sent notification for user: ", user_id);

        // await newNotification.save();

        const io = getIo();
        // io.emit(`notification_${user_id}`, { message });
         // Emit the notification to a specific room corresponding to the user ID
        io.to(`user_${user_id}`).emit(`notification_${user_id}`, { message });

        res.status(201).json({ message: 'notification sent successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getNotifications = async (req, res) => {
    try{
        if(req.user){
            // console.log("getting user notifics...")
            const notifications = await Notification.find({ user: req.userId });
            res.status(200).json({ notifications });
        } else if(req.employer){
            // console.log("getting employer notifics...")
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