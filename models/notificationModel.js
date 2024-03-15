var mongoose = require('mongoose'), Schema = mongoose.Schema;

const notificationSchema = new Schema({
    receiver:{
        type: String,
        enum: ["user", "employer", "both"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Employer'
    },
   message: String,
   link_url: String,
   thumbnail: String,
   isRead: {
    type: Boolean,
    default: false
   },
   created: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Notifcation', notificationSchema);