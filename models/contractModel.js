var mongoose = require('mongoose'), Schema = mongoose.Schema;

const contractSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Employer'
    },
    job: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Job'
    },
    status: {
        type: String, 
        enum: ["open", "closed"]
    },
    payment_status: {
        type: String, 
        enum: ["funded", "not-funded"]
    },
    user_rating: Number,
    employer_rating: Number,
    user_review: String,
    employer_review: String,
    created: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Contract', contractSchema);