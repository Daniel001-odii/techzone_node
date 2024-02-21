const mongoose = require('mongoose'), Schema = mongoose.Schema;

const jobSchema = new Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Employer'
    },
    title: String,
    description: String,
    skills: [],
    period: String,
    budget: Number,
    budget_type: {
        type: String,
        enum: ["fixed price", "hourly"],
        default: "fixed price"
    },
    flags: {
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        reason: String,
    },
    location: {
        remote: {type: Boolean, default: false},
        address: String,
    },
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    is_deleted: {
        type: Boolean, default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Job', jobSchema)