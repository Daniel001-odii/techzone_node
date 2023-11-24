// controllers/jobController.js

const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

// Set up AWS credentials
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable } = require('stream');
const upload = multer({ dest: 'uploads/' });
const Notification = require('../models/notificationModel');


// Set up AWS credentials
const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'AKIASAQOSQHZO2X2NYWV',
    secretAccessKey: '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',
  },
});


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
        employer_company: req.employer_company_name,
        employer: req.employerId,
        location,
        // Add other job fields here
      });

      await job.save((err, job) => {
          // Update the employer's document with the posted job's reference
          Employer.findByIdAndUpdate(
            req.employerId, // Replace with the actual employer's ID
            { $push: { jobs: job } },
            (updateErr) => {
              if (updateErr) {
                // Handle the update error
              } else {
                // The employer's document is now updated with the posted job
              }
            }
          );
      });

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

exports.sendJobForReview = async (req, res) => {
  try {
    const { jobId, userId, employerId } = req.body;

    // Find the job by its ID
    const job = await Job.findById(jobId);
    const employer = await Employer.findById(employerId);
    const user = await User.findById(userId)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // this code block below sends notification to a user
    const message = `Your contract for the job: ${job.job_title} has been sent  to the client for approval`;
    const notification = new Notification({
      recipientId: userId,
      recipientModel: 'User',
      message: message,

    });
      // Save the notification to the user's/employer's notifications array
    notification.save();
    user.notifications.push(notification);
    await user.save();

    // this second code block sends notification to employer also...
    const employerMessage = `${user.firstname} ${user.lastname} has requested completion approval for the job: ${job.job_title}`;
    const notification2 = new Notification({
      recipientId: employerId,
      recipientModel: 'Employer',
      message: employerMessage,
      linkUrl: `client/contract/${job._id}/${userId}`
    });
    notification2.save();
    employer.notifications.push(notification2);
    await employer.save();


    // Assign the job to the users by adding their IDs to the assignedUsers array
    job.requestedReview.push(userId);
    await job.save();

    res.status(200).json({ message: 'Job sent for client review successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending job for review...', error: error.message });
  }
};

exports.approveReviewRequest = async (req, res) => {
  try {
    const { jobId, userId, employerId } = req.body;

    // Find the job by its ID
    const job = await Job.findById(jobId);
    const employer = await Employer.findById(employerId);
    const user = await User.findById(userId)

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

      // this code block below sends notification to a user
      const message = `Your request for the contract: ${job.job_title} has been approved by the client, project has been closed.`;
      const notification = new Notification({
        recipientId: userId,
        recipientModel: 'User',
        message: message,

      });
        // Save the notification to the user's/employer's notifications array
      notification.save();
      user.notifications.push(notification);
      await user.save();

    // Assign the job to the users by adding their IDs to the assignedUsers array
    job.completedBy.push(userId);
    job.isCompleted = true;

    user.completedJobs.push(jobId);

    await user.save();
    // Save the updated job
    await job.save();

    res.status(200).json({ message: 'Job completed by user successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking job as complete', error: error.message });
  }

};

exports.rateClient = async (req, res) => {
  try{
    const employerId = req.params.employer_id;
    const { jobId, userId, ratedValue } = req.body;

    const employer = await Employer.findById(employerId);
    const job = await Job.findById(jobId);
    const ratingUser = await User.findById(userId);
    const user_id = userId;
    const job_id = jobId;

    const user = `${ratingUser.firstname} ${ratingUser.lastname}`;

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const job_title = job.job_title;

    employer.realRating.push({job_id, user_id, job_title, user, ratedValue});

    // calculate the employers average ratings and save to the ratedValue record..
    const total = employer.realRating.reduce((acc, rating) => acc + rating.ratedValue, 0);

    const average = total / employer.realRating.length;

    employer.ratedValue = average;

    // completeJob();

    await employer.save();
    res.status(200).json({ message: 'Client feedback sent successfully!' });

  }
  catch(error){
    res.status(500).json({ message: 'Error sending feedback rating', error: error.message });
  }
}


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

exports.editJob = async (req, res) => {
  try{
    const jobId = req.params.jobId;
    const edits = req.body;

    const updateJob = await Job.findByIdAndUpdate(jobId, edits, {new: true});
    res.status(200).json({ message: "job updated successfully!", job: updateJob})
  }
  catch(error){
    res.status(500).json({ message: 'Error editing job', error: error.message });
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

    // Filter by location
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Calculate date range based on "posted" value
    if (posted) {
      const currentDate = new Date();
      let startDate;

      switch (posted) {
        case 'under 24 hrs':
          startDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Subtract 24 hours
          break;
        case 'under a week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Subtract 7 days
          break;
        case 'under a month':
          startDate = new Date(currentDate.getFullYear() - 30 * 24 * 60 * 60 * 1000); // Subtract 1 month
          break;
        case 'over a month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
          break;
        default:
          break;
      }

      if (startDate) {
        filter.created_at = { $gte: startDate, $lte: currentDate };
      }
    }

    // Use the filter criteria to search for jobs
    const jobs = await Job.find(filter);

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error searching jobs', error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { userName, userId } = req.query;

    // Define a filter object to build the query conditions
    const filter = {};

    // Search by userName (case-insensitive partial match) or by userId
    if (userName) {
      filter.$or = [
        { firstName: { $regex: userName, $options: 'i' } },
        { lastName: { $regex: userName, $options: 'i' } },
      ];
    }

    if (userId) {
      filter._id = userId;
    }

    // Use the filter to search for users
    const users = await User.find(filter);

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};


exports.applyForJob = async (req, res) => {
  try {
    const { coverLetter, counterOffer, reasonForCounterOffer } = req.body;
    const jobId = req.params.job_id;
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

    // Verify the token and get the user ID from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }



      const userId = decoded.id; // Get the user's ID from the token
      const user = await User.findOne({_id: userId});

      console.log('Decoded user ID:', userId, "applying for: ", req.body);

        // Create a job application object
        const application = {
          user: userId,
          firstname: user.firstname,
          lastname: user.lastname,
          coverLetter,
          counterOffer,
          reasonForCounterOffer,
        };


          // Find the job by ID and add the application to the applications array
          const job = await Job.findByIdAndUpdate(
            jobId,
            { $push: { applications: application } },
            { new: true }
          );


      // this code block below sends notification to a user after a successful job application....
      const message = `Your application for the job ${job.job_title} has been sent!`;
      const notification = new Notification({
        recipientId: userId,
        recipientModel: 'User',
        message,
      });
        // Save the notification to the user's/employer's notifications array
      notification.save();

      user.notifications.push(notification);
      user.save();



      // Check if there are attachment files in the request
      const attachmentUrls = [];

      if (req.files && req.files.length > 0) {
        console.log('Number of files uploaded:', req.files.length);
        for (const file of req.files) {
          const fileStream = fs.createReadStream(file.path);
          const uploadParams = {
            Bucket: 'fortechzone', // Replace with your bucket name
            Body: fileStream,
            Key: file.filename,
          };

          const upload = new Upload({
            client: s3Client, // Assuming you have s3Client set up
            params: uploadParams,
          });

          const result = await upload.done();
          attachmentUrls.push(result.Location);

          // Clean up the temporary file created by multer
          fs.unlinkSync(file.path);
        }
      }


      if (attachmentUrls.length > 0) {
        application.attachments = attachmentUrls; // Assign an array of attachment URLs if there are attachments
      }


      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.status(201).json({ message: 'Application submitted successfully' });
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Error submitting application' });
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

      // alert both user and employer on successful hire.....
      const notifiedUser = await User.findOne({_id: userId});
      const hiredJob = await Job.findOne({_id: jobId});

      const message = `You Successfully hired ${notifiedUser.firstname} ${notifiedUser.lastname} for the job ${ hiredJob.job_title.substring(0, 120)}`;
      const notification = new Notification({
        recipientId: employerId,
        recipientModel: 'Employer',
        message: message,
      });
      notification.save();
      const employer = await Employer.findOne({_id: employerId});
      if(employer){
        employer.notifications.push(notification);
        employer.save();
      }

      // const hiredJob = await Job.findOne({_id: jobId});
      const RecipientMessage = `Congratulations, youve been hired for the job: ${hiredJob.job_title}`;
      const notification2 = new Notification({
        recipientId: userId,
        recipientModel: 'User',
        message: RecipientMessage,
      });
        // Save the notification to the user's/employer's notifications array
      notification2.save();
      const user = await User.findOne({_id: userId});
      if(user){
        user.notifications.push(notification2);
        user.save();
      }




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


exports.getUserAssignedJobs = async (req, res) => {
  try {
    // Get the user's ID from the JWT token (assuming you're using authentication)
    const userId = req.userId;

    // Fetch jobs assigned to the user
    const assignedJobs = await Job.find({ assignedUsers: userId });

    res.status(200).json({ assignedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user-assigned jobs', error: error.message });
  }
};


exports.getUserCompletedJobs = async (req, res) => {
  try {
    // Get the user's ID from the JWT token (assuming you're using authentication)
    const userId = req.userId;

    // Fetch jobs assigned to the user
    const completedJobs = await Job.find({ completedBy: userId });

    res.status(200).json({ completedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user-completed jobs', error: error.message });
  }
};

// this controller below fetches the jobs for all users.....
exports.getUserAppliedJobs = async (req, res) => {
  try {
    // Get the user's ID from the decoded JWT token
    const userId = req.user.id;

    // Find all jobs where the user's ID is in the applications
    const jobs = await Job.find({ 'applications.user': userId });
    if(!userId){
      res.status(401).json({message: "Sorry, You are not authorised to view this page."})
    }

    res.status(200).json({ jobs });
  } catch (error) {
    // res.status(500).json({ message: 'Error fetching user\'s applied jobs', error: error.message });
    res.status(500).json({ message: 'unauthorised'});
  }
};