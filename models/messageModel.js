// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  files: [{
   /*  name: String,
    preview: String,
    url: String,
    type: String,
    size: String, */
  }],
  reply:{
    text: String,
    files: [{
      name: String,
      preview: String,
      type: String,
      size: String,
    }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },

}, {timestamps: true});

module.exports = mongoose.model('Message', messageSchema);