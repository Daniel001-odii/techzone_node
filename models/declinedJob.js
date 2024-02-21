const mongoose = require('mongoose'), Schema = mongoose.Schema;

const declinedJob = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    job: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Job'
    },
    reason: String,
    created: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('declinedJob', declinedJob)