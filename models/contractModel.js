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
    review: {type: String, enum:["accepted", "declined", "pending", "none"], defualt: "none"},
    user_feedback: {
        rating: Number,
        feedback: String,
    },
    employer_feedback: {
        rating: Number,
        feedback: String,
    },
    created: {
        type: Date,
        default: Date.now
    },

}, {timestamps: true});


module.exports = mongoose.model('Contract', contractSchema);