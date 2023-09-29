// controllers/jobController.js

const Job = require('../models/jobModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Controller for posting a job (for employers)
exports.postJob = async (req, res) => {
  if (req.employer) {
    // The user is an employer, allow them to post a job
    try {
      const { job_title, job_description, skills, period, budget_type, budget, location } = req.body;
      
      // Validate the request body
      if (!job_title) {
        return res.status(400).json({ message: 'Job title is required' });
      }
      if (!job_description) {
        return res.status(400).json({ message: 'Job description is required' });
      }
      if (!period) {
        return res.status(400).json({ message: 'Job period is required' });
      }
      if (!budget_type) {
        return res.status(400).json({ message: 'Budget type is required' });
      }
      if (budget_type === 'fixed' && (!budget || isNaN(budget) || budget <= 0)) {
        return res.status(400).json({ message: 'Invalid budget for fixed budget type' });
      }
      if (!location) {
        return res.status(400).json({ message: 'job location type is required' });
      }
      
      const job = new Job({
        job_title,
        job_description,
        skills,
        period,
        budget_type,
        budget,
        employer: req.employerId,
        location,
        // Add other job fields here
      });
      
      await job.save();
      
      res.status(201).json({ message: 'Job posted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error posting job', error: error.message });
    }
  } else {
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


// Controller to get a job by its ID
exports.getJobById = async (req, res) => {
  try {
    const jobId = req.params.jobId; // Get the job ID from the URL parameter
    
    // Query the database to find the job by its ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Send the job as a JSON response
    res.status(200).json({ job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
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


exports.completeJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    // Find the job by its ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // mark job as complete......
    job.isCompleted = true; 
    // Save the updated job
    await job.save();

    res.status(200).json({ message: 'Job completed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking job as complete', error: error.message });
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
    const { keywords, budgetMin, budgetMax, jobType, location, posted } = req.query;
    
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
      filter.period = jobType;
    }
    
    // Filter by job creation time
    if (posted) {
      filter.created_at = posted;
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


exports.applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, attachment, counterOffer, reasonForCounterOffer } = req.body;
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

    // Verify the token and get the user ID from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = decoded.id; // Get the user's ID from the token

      // Create a job application object
      const application = {
        user: userId,
        coverLetter,
        attachment,
        counterOffer,
        reasonForCounterOffer,
      };

      // Find the job by ID and add the application to the applications array
      const job = await Job.findByIdAndUpdate(
        jobId,
        { $push: { applications: application } },
        { new: true }
      );

      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.status(201).json({ message: 'Application submitted successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
};


exports.getAppliedJobs = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

    // Verify the token and get the user ID from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = decoded.id; // Get the user's ID from the token

      // Find all jobs where the user's ID exists in the applications array
      const appliedJobs = await Job.find({ 'applications.user': userId });

      res.status(200).json({ appliedJobs });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving applied jobs', error: error.message });
  }
};


exports.deleteJob = async (req, res) => {
  try {
    const jobId = req.params.jobId; // Get the job ID from the route parameter
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

    // Verify the token and get the user ID and role from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = decoded.id; // Get the user's ID from the token
      const userRole = decoded.role; // Get the user's role from the token

      if (userRole !== 'employer') {
        return res.status(403).json({ message: 'Access denied. Only employers can delete jobs.' });
      }

      // Find the job by ID and check if the user ID matches the job's createdBy field
      const job = await Job.findOne({ _id: jobId, createdBy: userId });

      if (!job) {
        return res.status(404).json({ message: 'Job not found or you do not have permission to delete it.' });
      }

      // Delete the job
      await Job.deleteOne({ _id: jobId });

      res.status(200).json({ message: 'Job deleted successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
};


exports.hireApp = async (req, res) => {
  try {
    const { jobId, applicantId } = req.params; // Get the job ID and applicant ID from the route parameters
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

    // Verify the token and get the user ID and role from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = decoded.id; // Get the user's ID from the token
      const userRole = decoded.role; // Get the user's role from the token

      if (userRole !== 'employer') {
        return res.status(403).json({ message: 'Access denied. Only employers can hire applicants.' });
      }




      // Find the job by ID and check if it was posted by the employer making the request
      const job = await Job.findOne({ _id: jobId, createdBy: userId });

      if (!job) {
        return res.status(404).json({ message: 'Job not found or you do not have permission to hire for it.' });
      }

      // Check if the applicant exists in the job's applications
      const applicantIndex = job.applications.findIndex((app) => app.user.toString() === applicantId);

      if (applicantIndex === -1) {
        return res.status(404).json({ message: 'Applicant not found for this job.' });
      }

      // Mark the applicant as hired
      job.applications[applicantIndex].status = 'hired';

      // Save the updated job document
      await job.save();

      res.status(200).json({ message: 'Applicant hired successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error hiring applicant', error: error.message });
  }
};


exports.hireApplicant = async (req, res) => {
  try {
    const jobId = req.params.jobId; // Get the job ID from the route parameter
    const userId = req.params.userId; // Get the user ID from the route parameter
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

    // Verify the token and get the employer's ID from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const employerId = decoded.id; // Get the employer's ID from the token

      // Check if the employer has the permission to hire for this job (e.g., they posted the job)
      const job = await Job.findOne({ _id: jobId, createdBy: employerId });

      if (!job) {
        return res.status(404).json({ message: 'Job not found or you do not have permission to hire for it.' });
      }

      // Add the user's ID to the "hiredUsers" array of the job
      job.hiredUsers.push(userId);

      // Save the updated job document
      await job.save();

      res.status(200).json({ message: 'User hired successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error hiring user', error: error.message });
  }
};



exports.getJobsByEmployer = (req, res) => {
  const { employerId } = req.params;

  // Query the database for jobs posted by the specific employer
  Job.find({ employer: employerId }, (err, jobs) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving jobs', error: err.message });
    }
    
    res.status(200).json({ jobs });
  });
};


