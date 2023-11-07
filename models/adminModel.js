var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


var adminSchema = new Schema({
  email: {
    type: String,
    unique: [true, "email already exists in database!"],
    lowercase: true,
    trim: true,
    required: [true, "email not provided"],
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: '{VALUE} is not a valid email!'
    }

  },
  role: {
    type: String,
    enum: ["Admin", "Manager", "Moderator", "TeamLead", "TeamMember"],
    required: [true, "Please specify role"]
  },
  password: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    required: [true, "Please specify firstname"]
  },
  lastname: {
    type: String,
    required: [true, "Please specify lastname"]
  },
  created: {
    type: Date,
    default: Date.now
  },
  resetToken: String,
  resetTokenExpiration: Date,
});



module.exports = mongoose.model('Administration', adminSchema);