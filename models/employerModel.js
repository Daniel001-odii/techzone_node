const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'), Schema = mongoose.Schema;


const employerSchema = new Schema({
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
    password: {
      type: Object,
    },
    role: {type: String, default: "employer"},
    firstname: {
      type: String,
      required: [true, "Please specify firstname"]
    },
    lastname: {
      type: String,
      required: [true, "Please specify lastname"]
    },
    settings: {
        // profile_visibility: {type: String, enum: ["public", "private"]}
    },
    // PROVIDER AND GOOGLE ID....
    provider: {
      type: String,
      enum: ["tech-zone", "google"],
      default: "tech-zone"
    },
    googleId: Number,
    // PROVIDER AND GOOGLE ID ENDS HERE....

    preffered_talent_types: [
      {type: String}
    ],
    profile: {
      company_name: {type: String, default: "A tech-zone company"},
      tag_line: String,
      description: String,
      location: {
        LGA: String,
        city: String,
        state: String,
        address: String,
      },
      phone: String,
      social: String,
      link: String,
      image_url: {type: String, default: 'https://icon-library.com/images/no-profile-pic-icon/no-profile-pic-icon-11.jpg'},
    },
    saved_users: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    rating: Number,
    rating_count: Number,

    is_verified: {type: Boolean, default: false},
    is_deleted: {type: Boolean, default: false},
    is_on_hold: {type: Boolean, default: false},
    email_verified: {
      type: Boolean,
      default: false,
    },
    verification_token: String,

    jobs_posted: Number,
    total_spent: {
      default: 0,
      type: Number
    },

    pass_reset: {
        token: String,
        expiry_date: Date,
    },

  }, {timestamps: true});

employerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

employerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model('Employer', employerSchema);