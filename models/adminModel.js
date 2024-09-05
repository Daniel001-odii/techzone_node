var mongoose = require('mongoose'), Schema = mongoose.Schema;

const adminSchema = new Schema({
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
    role: {type: String, 
        default: "admin",
        enum: ["admin", "manager", "moderator", "team-lead", "team-member"]
    },
    firstname: {
      type: String,
      required: [true, "Please specify firstname"]
    },
    lastname: {
      type: String,
      required: [true, "Please specify lastname"]
    },

    // user account status...
    account_status: {
      type: String,
      enum: ["active", "onhold", "blocked"],
      default: "active"
    },

    email_verified: {
      type: Boolean,
      default: false,
    },

    email_verification:{
      token: String,
      expiry_date: Date,
    },

    login_code_expiration: Date,
    login_code: String,
 
    // PROVIDER AND GOOGLE ID....
    profile: {
      title: String,
      bio: String,
      location: {
        city: String,
        state: String,
        address: String,
      },
      phone: String,
      social: String,
      image_url: {type: String, default: 'https://icon-library.com/images/no-profile-pic-icon/no-profile-pic-icon-11.jpg'},
      },

    is_deleted: {type: Boolean, default: false},
    is_on_hold: {type: Boolean, default: false},
    // earned: {type: Number, default: 0},
    verification_token: String,

    // settings starts....
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
        sort_code: Number,
      },
      KYC: {
        NIN_number: String,
        is_verified: {type: Boolean, default: false},
      }
    },
    // settings ends here...

    created: {
        type: Date,
        default: Date.now
    },
  });
  
module.exports = mongoose.model('administrators', adminSchema);