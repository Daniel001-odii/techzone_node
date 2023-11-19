var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * User Schema
 */
var userSchema = new Schema({
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
    enum: ["user", "employer", "admin"],
    required: [true, "Please specify user role"]
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
  savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  completedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  profile: {
    skillTitle: String,
    bio: String,
    location: String,
    phone: String,
    socialAccount: String,
    skillsList: String, // Store skills as an array of strings
    profileImage: {type: String, default: 'https://images.freeimg.net/thumbs/blank-profile-picture-973460_1280.png'},
    },
  portfolio: String, // Store content type (e.g., 'application/pdf')
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  notifications: [{ type: Schema.Types.ObjectId, ref: 'Notifications' }],
  resetToken: String,
  resetTokenExpiration: Date,
});



module.exports = mongoose.model('User', userSchema);