var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * User Schema
 */
var employerSchema = new Schema({
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

  // //////
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],

  completedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],

  realRating: [{
    job_id: {type: mongoose.Schema.Types.ObjectId},
    user_id:  {type: mongoose.Schema.Types.ObjectId},
    job_title: String,
    ratedValue: Number,
    user: String,
  }],

  ratedValue: {type: Number},

  profile: {
    // skillTitle: String,
    tagline: String,
    description: String,
    company_name: {type: String, default: "Techzone Employer"},
    website: String,
    industry_type: String,
    // --------------------------------------
    phone: String,
    location: String,
    city:{city_name: String, zip: String},
    socialAccount: String,
    profileImage: {type: String, default: 'https://images.freeimg.net/thumbs/blank-profile-picture-973460_1280.png'},
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  notifications: [{ type: Schema.Types.ObjectId, ref: 'Notifications' }],
  resetToken: String,
  resetTokenExpiration: Date,
  verificationToken: String,
});



module.exports = mongoose.model('Employer', employerSchema);