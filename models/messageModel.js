// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  reply_text: String,
  files: [{
    type: String
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // employer: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Employer',
  // },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  isRead: {
    type: Boolean,
    default: false,
  },

}, {timestamps: true});

module.exports = mongoose.model('Message', messageSchema);