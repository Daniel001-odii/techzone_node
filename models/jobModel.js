const mongoose = require('mongoose'), Schema = mongoose.Schema;

const jobSchema = new Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Employer'
    },
    title: String,
    description: String,
    skills: [],
    type: {type: String, enum:["small", "medium", "large"]},
    period: {
        type: String, 
        enum: ["less than a month", "1 to 3 months", "3 to 6 months", "6 months plus"]
    },
    budget: Number,
    budget_type: {
        type: String,
        enum: ["fixed-price", "hourly"],
        default: "fixed-price"
    },
    flags: {
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        reason: String,
    },
    location: {
        remote: {type: Boolean, default: false},
        state: String,
        address: String,
        latitude: Number,
        longitude: Number,
    },
    no_of_applications: {type: Number, default: 0},
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