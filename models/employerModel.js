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
      type: String,
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

    username: String,

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

    email_verification:{
      token: String,
      expiry_date: Date,
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

    settings: {
      notifications: {
        contracts: {type: Boolean, default: true},
        messages: {type: Boolean, default: true},
        emails: {type: Boolean, default: true},
      },
      KYC: {
        NIN_number: String,
        is_verified: {type: Boolean, default: false},
        verified_on: Date,
      }
    },

    // account status...
    account_status: {
      type: String,
      enum: ["active", "onhold", "blocked"],
      default: "active"
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


// Pre-save hook to generate username
employerSchema.pre('save', async function (next) {
  // Check if firstname or lastname is modified or if username is not set
  if (this.isModified('firstname') || this.isModified('lastname') || !this.username) {
      // Generate username from firstname and lastname
      const username = `${this.firstname} ${this.lastname}`;
      this.username = username;
      console.log(`Generated username: ${this.username}`);
  }
  next();
});


employerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model('Employer', employerSchema);