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
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],


    // Add more fields as needed
  });
  
  const Job = mongoose.model('Job', jobSchema);
  module.exports = Job;
 