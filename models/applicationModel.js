const mongoose = require('mongoose'), Schema = mongoose.Schema;

const applicationSchema = new Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Job'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    cover_letter: String,
    attachments: [],
    counter_offer: String,
    reason_for_co: String,
    created: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Application', applicationSchema)