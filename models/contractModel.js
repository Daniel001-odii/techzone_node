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
    type: {
        type: String,
        enum: ["assigned", "applied"],
        default: "applied"
    },
    action: {
        type: String, 
        enum: ["accepted", "declined", "pending"],
        default: "pending"
    },
    status: {
        type: String,
        enum: ["open", "closed", "completed", "paused"],
        default: "open",
    },
    payment: {
        type: String, 
        enum: ["funded", "not-funded"],
        default: "not-funded",
    },
    payment_status: {
        type: String, 
        enum: ["paid", "unpaid"],
        defualt: "unpaid",
    },
    review: [{
        title: {type: String, default: "Sent a review"},
        status: {type: String, enum:["accepted", "declined", "pending", "none"], defualt: "none"},
    }],
    user_feedback: {
        rating: {type: Number},
        review: String,
    },
    employer_feedback: {
        rating: {type: Number},
        review: String,
    },
    created: {
        type: Date,
        default: Date.now
    },

}, {timestamps: true});


module.exports = mongoose.model('Contract', contractSchema);