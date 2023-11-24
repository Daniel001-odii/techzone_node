const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    job_title: {
      type: String,
      required: [true, "Please specify user job title"],
    },
    job_description: {
      type: String,
      required: [true, "Please specify user job description"],
    },
    skills: {
        type: String,
        required: [true, "Please specify user job description"],
      },
    period: {
        type: String,
        enum: ["small", "medium", "large"],
        required: [true, "Please specify job period"]
      },
    budget_type: {
        type: String,
        required: [true, "please specify budget type"]
    },
    budget:{
        type: Number,
        required: [true, "Please specify user budget amount"],
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer'
    },
    employer_company: {type: String},
    location: {
      type: String,
      required: [true, "please specify location for job"]
  },
    created_at: {
      type: Date,
      default: Date.now, // Set the default value to the current date and time
    },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    requestedReview: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hiredUsers: [{type: mongoose.Schema.Types.ObjectId,ref: 'User'},],
    applications: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        firstname: String,
        lastname: String,
        coverLetter: String,
        attachment: String, // Store the file name or link
        counterOffer: Number,
        reasonForCounterOffer: String,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // Add more fields as needed
  });

  const Job = mongoose.model('Job', jobSchema);
  module.exports = Job;
