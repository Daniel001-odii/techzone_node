// models/room.js
const mongoose = require('mongoose');

const watchSchema = new mongoose.Schema({
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active", "paused", "stopped"],
    default: "pending",
  },

  time_stamp: {
    clock_in_time: Date,
    start_time: Date,
    stop_time: Date,
    duration: {
      type: Number,
      default: 0
    },
    activity_description: String,
    action: {
      enum: ["approved", "declined", "pending"],
      default: "pending",
      type: String,
    }
  },

}, {timestamps: true});

module.exports = mongoose.model('TaskWatch', watchSchema);


/*

Contract,
time_stamps: [{
  start_time: {type: Date},
  pause_time: {type: Date},
  stop_time: {type: Date},
  duration: {type: Number, default: 0},
  activity_descriptoin
}]

*/