var mongoose = require('mongoose'), Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const Wallet = require("../models/walletModel");

const userSchema = new Schema({
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
    role: {type: String, default: "user"},
    firstname: {
      type: String,
      // required: [true, "Please specify firstname"]
    },
    lastname: {
      type: String,
      // required: [true, "Please specify lastname"]
    },
    username: {
      type: String,
    },
 
    // PROVIDER AND GOOGLE ID....
    provider: {
      type: String,
      enum: ["native", "google"],
      default: "native"
    },
    googleId: Number,

    preffered_job_types: [
      {type: String}
    ],
    profile: {
      title: String,
      bio: String,
      location: {
        LGA: String,
        city: String,
        state: String,
        address: String,
      },
      phone: String,
      social: String,
      skills: String,
      is_verified: { 
        type: Boolean,
        default: false,
      },
      // image_url: {type: String, default: 'https://icon-library.com/images/no-profile-pic-icon/no-profile-pic-icon-11.jpg'},
      image_url: {type: String, default: '../uploads/profiles/no_profile_image.png'},
      },
    portfolio_url: String, // Store content type (e.g., 'application/pdf')
    saved_jobs: [{
      type: mongoose.Schema.Types.ObjectId, ref: 'Job'
    }],

    rating: Number,
    rating_count: Number,

    // user account status...
    account_status: {
      type: String,
      enum: ["active", "onhold", "blocked"],
      default: "active"
    },

    // email verification & verification status...
    email_verified: {
      type: Boolean,
      default: false,
    },

    email_verification:{
      type: String,
      expiry_date: Date,
    },
    
    pass_reset: {
      token: String,
      expiry_date: Date,
    },

    // user settings starts....
    settings: {
      profile_visibility: {type: String, enum: ["public", "private"], default: "public"},
      notifications: {
        contracts: {type: Boolean, default: true},
        messages: {type: Boolean, default: true},
        emails: {type: Boolean, default: true},
      },
      bank: {
        name: String,
        account_number: Number,
        account_name: String,
        code: Number,
      },
      KYC: {
        NIN_number: String,
        is_verified: {type: Boolean, default: false},
      }
    },

    total_earnings: {
      type: Number,
      default: 0,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'wallet', 
      autopopulate: true
    },


  }, {timestamps: true});


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('firstname') || !this.isModified('lastname')) {
      return next();
  }
  // generate username from user firstname and lastname...
  const username = this.firstname + '' + this.lastname;
  this.username = username;
  console.log(`create username: ${this.username}`);
  next();
});



module.exports = mongoose.model('User', userSchema);