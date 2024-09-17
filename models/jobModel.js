const mongoose = require('mongoose'), Schema = mongoose.Schema;

const jobSchema = new Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Employer'
    },
    title: String,
    description: String,
    skills: [
        {type: String,}
    ],
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
    hourly_budget_helper: {
        type: Number,
        hours_per_day: Number,
        days_per_week: Number,
        required: function(){ return this.budget_type == 'hourly' },
    },
    flags: [{
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        reason: {
            type: String,
            enum: [
                "Just not interested",
                "Vague Description",
                "Unrealistic Expectations",
                "Poor reviews about the client",
                // "Doesn't Match Skills",
                // "Not in my preferred location"
              ]
        },
    }],
    location: {
        remote: {type: Boolean, default: false},
        state: String,
        address: String,
        latitude: String,
        longitude: String,
    },
    no_of_applications: {type: Number, default: 0},
    no_of_hires: Number,
    no_of_assigned: Number,
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    is_deleted: {
        type: Boolean, default: false
    },
    status: {
        type: String,
        enum: ["open", "closed"],
        default: "open"
    },

    // does job requires task watch?
    requires_taskwatch: {
        type: Boolean,
        default: false,
    },
    // plumbing, cabling etc...
    category: {
        type: String,
    },

}, {timestamps: true});

module.exports = mongoose.model('Job', jobSchema)