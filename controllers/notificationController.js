const Notification  = require('../models/notificationModel');


exports.notify = (message) => {
    io.emit('notification', { message });
    res.status(200).json({ success: true });
}