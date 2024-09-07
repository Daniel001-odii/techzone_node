// models/room.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  balance: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "onhold", "blocked"],
    default: "active"
  },
  transactions: [{
    date: {
        type: Date,
        default: Date.now()
    },
    amount: Number,
    status: {
      type: String,
      enum: ["successful", "pending", "failed"],
      default: "successful",
    },
    type: {
        type: String,
        enum: ["withdrawal", "refund"],
        default: "withdrawal"
    }
  }],

}, {timestamps: true});

module.exports = mongoose.model('Wallet', walletSchema);