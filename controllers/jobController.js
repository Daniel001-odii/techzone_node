// controllers/jobController.js

const Job = require('../models/jobModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Controller for posting a job (for employers)
exports.postJob = async (req, res) => {
    if (req.employer) {
        // The user is an employer, allow them to post a job
  try {
    const { job_title, job_description, skills, period, budget_type, budget } = req.body;
    
    const job = new Job({
      job_title,
      job_description,
      skills,
      period,
      budget_type,
      budget,
      employer: req.employerId,
      // Add other job fields here
    });
    
    await job.save();
    
    res.status(201).json({ message: 'Job posted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error posting job', error: error.message });
  }
} else{
    // The user is not an employer, deny access
    return res.status(403).json({ message: 'Access denied' });
}
};

// Controller for listing jobs (for users)
exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    
    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error listing jobs', error: error.message });
  }
};


// Controller for saving a job
//working................
exports.saveJob = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the user ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the user ID from the token to perform the update
    const { jobId } = req.params; // Assuming you're passing the jobId in the route parameter

    // Check if the job is already saved by the user
    User.findById(decoded.id, (findErr, user) => {
      if (findErr) {
        return res.status(500).json({ message: 'Error finding user', error: findErr.message });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const jobIndex = user.savedJobs.indexOf(jobId);

      // If the job is already saved, remove it; otherwise, save it
      const updateOperation = jobIndex !== -1
        ? { $pull: { savedJobs: jobId } } // Remove the job from savedJobs
        : { $addToSet: { savedJobs: jobId } }; // Add the job to savedJobs

      User.updateOne({ _id: decoded.id }, updateOperation, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: 'Error saving job', error: updateErr.message });
        }

        const successMessage = jobIndex !== -1
          ? 'Job removed from saved jobs'
          : 'Job saved successfully';

        res.status(201).json({ message: successMessage });
      });
    });
  });

  if (!token) {
    return res.status(401).send({ message: 'No authorization headers found' });
  }
};



exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have user data available in req.user

    // Fetch the user's saved jobs
    const user = await User.findById(userId).populate('savedJobs');
    const savedJobs = user.savedJobs;

    res.status(200).json({ savedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching saved jobs', error: error.message });
  }
};
