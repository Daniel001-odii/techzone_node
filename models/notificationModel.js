var mongoose = require('mongoose'), Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Employer'
    },
    type: {
        type: String,
        enum: ["contract", "job", "account", "platform", "payment", "message"]
    },
   message: String,
   link_url: String,
   thumbnail: String,
   isRead: {
        type: Boolean,
        default: false
   },
}, {timestamps: true});


module.exports = mongoose.model('Notifcation', notificationSchema);