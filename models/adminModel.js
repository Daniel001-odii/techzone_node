const mongoose = require('mongoose'), Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');


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
        default: "team-member",
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
    username: String,

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


adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to generate username
adminSchema.pre('save', async function (next) {
  // Check if firstname or lastname is modified or if username is not set
  if (this.isModified('firstname') || this.isModified('lastname') || !this.username) {
      // Generate username from firstname and lastname
      const username = `${this.firstname} ${this.lastname}`;
      this.username = username;
      console.log(`Generated username: ${this.username}`);
  }
  next();
});

  
module.exports = mongoose.model('administrators', adminSchema);