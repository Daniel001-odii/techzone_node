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

exports.assignJob = async (req, res) => {
  try {
    const { jobId, userIds, employerId } = req.body;

    // Find the job by its ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Find the users by their IDs
    const users = await User.find({ _id: { $in: userIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    // Assign the job to the users by adding their IDs to the assignedUsers array
    job.assignedUsers.push(...userIds);

    // Save the updated job
    await job.save();

    res.status(200).json({ message: 'Job assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning job', error: error.message });
  }
};




exports.getSavedJobs = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the user ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the user ID from the token to fetch the user's saved jobs
    User.findById(decoded.id)
      .populate('savedJobs') // Assuming you have a "savedJobs" field that references Job documents
      .exec((findErr, user) => {
        if (findErr) {
          return res.status(500).json({ message: 'Error finding user', error: findErr.message });
        }

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Return the user's saved jobs
        res.status(200).json({ savedJobs: user.savedJobs });
      });
  });

  if (!token) {
    return res.status(401).send({ message: 'No authorization headers found' });
  }
};


// exports.searchJobs = async (req, res) => {
//   try {
//     const { keywords } = req.query;

//     // Use the keywords to perform a case-insensitive search in job titles and descriptions
//     const jobs = await Job.find({
//       $or: [
//         { job_title: { $regex: keywords, $options: 'i' } },
//         { job_description: { $regex: keywords, $options: 'i' } },
//       ],
//     });

//     res.status(200).json({ jobs });
//   } catch (error) {
//     res.status(500).json({ message: 'Error searching jobs', error: error.message });
//   }
// };

exports.searchJobs = async (req, res) => {
  try {
    const { keywords, budgetMin, budgetMax, jobType, location } = req.query;
    
    // Build the filter criteria based on user's input
    const filter = {};
    
    // Search keywords in job title and description
    if (keywords) {
      filter.$or = [
        { job_title: { $regex: keywords, $options: 'i' } },
        { job_description: { $regex: keywords, $options: 'i' } },
      ];
    }
    
    // Filter by budget range
    if (budgetMin && budgetMax) {
      filter.budget = { $gte: parseInt(budgetMin), $lte: parseInt(budgetMax) };
    } else if (budgetMin) {
      filter.budget = { $gte: parseInt(budgetMin) };
    } else if (budgetMax) {
      filter.budget = { $lte: parseInt(budgetMax) };
    }
    
    // Filter by job type
    if (jobType) {
      filter.job_type = jobType;
    }
    
    // Filter by location
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Use the filter criteria to search for jobs
    const jobs = await Job.find(filter);

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error searching jobs', error: error.message });
  }
};