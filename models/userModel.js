var mongoose = require('mongoose'), Schema = mongoose.Schema;
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
      type: Object,
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
 
    // PROVIDER AND GOOGLE ID....
    provider: {
      type: String,
      enum: ["tech-zone", "google"],
      default: "tech-zone"
    },
    googleId: Number,
    // PROVIDER AND GOOGLE ID ENDS HERE...

    preffered_job_types: [
      {type: String}
    ],
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
      skills: String,
      image_url: {type: String, default: 'https://icon-library.com/images/no-profile-pic-icon/no-profile-pic-icon-11.jpg'},
      },
    portfolio_url: String, // Store content type (e.g., 'application/pdf')
    saved_jobs: [{
      type: mongoose.Schema.Types.ObjectId, ref: 'Job'
    }],

    rating: Number,
    rating_count: Number,

    is_deleted: {type: Boolean, default: false},
    is_on_hold: {type: Boolean, default: false},
    email_verified: {
      type: Boolean,
      default: false,
    },
    // earned: {type: Number, default: 0},
    verification_token: String,
    
    pass_reset: {
      token: String,
      expiry_date: Date,
    },

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
  
module.exports = mongoose.model('User', userSchema);