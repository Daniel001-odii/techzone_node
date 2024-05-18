// models/room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: String,
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  unread_messages: {type: Number, default: 0},
}, {timestamps: true});

module.exports = mongoose.model('Room', roomSchema);