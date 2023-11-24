const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel', // Reference to either User or Employer
  },
  recipientModel: {
    type: String,
    enum: ['User', 'Employer'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  linkUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Notifications = mongoose.model('Notifications', notificationSchema);
module.exports =  Notifications;
