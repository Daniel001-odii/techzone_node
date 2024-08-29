const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Application = require('../models/applicationModel');
const Contract = require('../models/contractModel');
const jwt = require('jsonwebtoken');
const Notification = require('../models/notificationModel')
const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');

const formidable = require('formidable');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Storage } = require("@aws-sdk/lib-storage");
const { Readable } = require('stream');
const multer = require('multer');
const multerS3 = require('multer-s3');
const fileparser = require("./fileparser");

// Create S3 client
const s3Client = new S3Client({
  region: 'us-east-1', // Specify your AWS region
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  }
});

// Controller for posting a job (for employers)
exports.postJob = async (req, res) => {
    console.log("job posting by: ",req.employer)
    if (req.employer) {
      // The user is an employer, allow them to post a job
      try {
        const { title, 
          description, 
          type, 
          skills, 
          period, 
          budget, 
          budget_type,
          requires_taskwatch,
          category, 
          location
         } = req.body;
  
        // Validate the request body
        if (!title) {
          return res.status(400).json({ message: 'Job title is required' });
        }
        if (!description) {
          return res.status(400).json({ message: 'Job description is required' });
        }
        if (!skills) {
            return res.status(400).json({ message: 'Job skills is required' });
          }
        if (!period) {
          return res.status(400).json({ message: 'Job period is required' });
        }
        if (!budget) {
            return res.status(400).json({ message: 'Job budget is required' });
          }
        if (!budget_type) {
          return res.status(400).json({ message: 'Budget type is required' });
        }
        if (budget_type === 'fixed' && (!budget || isNaN(budget) || budget <= 0)) {
          return res.status(400).json({ message: 'Invalid budget for fixed budget type' });
        }
        if (!location) {
          return res.status(400).json({ message: 'job location is required' });
        }
  
        const job = new Job({
          employer: req.employerId,
          title,
          description,
          skills,
          period,
          budget,
          budget_type,
          location,
          requires_taskwatch,
          category,
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

// Controller to get a job by its ID
exports.getJobById = async (req, res) => {
    try {
      const job_id = req.params.job_id; // Get the job ID from the URL parameter

      // Validate if job_id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(job_id)) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Query the database to find the job by its ID
      const job = await Job.findById(job_id).populate("employer", "is_verified profile createdAt");
      
      // Query applications associated with the current job and count them
      const applicationsCount = await Application.countDocuments({ job: job._id });
      const usersAssigned = await Contract.countDocuments({ job: job._id, type: 'assigned'});
      const usersHired = await Contract.countDocuments({ job: job._id, type: 'applied'});

      // Update the number_of_applications field for the current job
      job.no_of_applications = applicationsCount;
      job.no_of_assigned = usersAssigned;
      job.no_of_hires = usersHired;
  
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

// Controller for listing jobs (for users)
exports.listUserDefinedJobs = async (req, res) => {
  try {
      // Assuming the user's preferred job types are stored in req.user.preferred_job_types
      const userPreferredJobTypes = req.user.preferred_job_types;

      // Fetch all jobs with non-null employers
      const allJobs = await Job.find({ employer: { $ne: null }, is_deleted: false }).populate("employer", "is_verified profile created");

      // Sort jobs based on user's preferred job types
      const sortedJobs = allJobs.sort((jobA, jobB) => {
          // Check if jobA's type is in the user's preferred types
          const isJobATypePreferred = userPreferredJobTypes.includes(jobA.type);

          // Check if jobB's type is in the user's preferred types
          const isJobBTypePreferred = userPreferredJobTypes.includes(jobB.type);

          // Compare the two jobs based on their relevance to user's preferences
          if (isJobATypePreferred && !isJobBTypePreferred) {
              return -1; // jobA comes first
          } else if (!isJobATypePreferred && isJobBTypePreferred) {
              return 1; // jobB comes first
          } else {
              return 0; // no preference, maintain current order
          }
      });

      res.status(200).json({ jobs: sortedJobs });
  } catch (error) {
      res.status(500).json({ message: 'Error listing jobs', error: error.message });
  }
};


exports.listJobs = async (req, res) => {
  try{
     // Fetch all jobs with non-null employers
     const jobs = await Job.find({ employer: { $ne: null }, is_deleted: false }).populate("employer", "is_verified profile created");
    res.status(200).json({ jobs })
  }catch(error){
    console.log(error)
    res.status(500).json({ message: "internal server error" })
  }
}


exports.listJobsNew = async (req, res) => {
  try {
    // Get the page and limit from query parameters, with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the starting index of the results for the given page
    const startIndex = (page - 1) * limit;

    // Fetch jobs with non-null employers, applying pagination
    const jobs = await Job.find({ employer: { $ne: null }, is_deleted: false })
      .populate("employer", "is_verified profile created")
      .skip(startIndex)
      .limit(limit);

    // Get the total count of jobs for pagination metadata
    const totalJobs = await Job.countDocuments({ employer: { $ne: null }, is_deleted: false });

    // Calculate total pages
    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      jobs,
      page,
      limit,
      totalPages,
      totalJobs,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.flagJob = async(req, res) => {
  try{
    const job_id = req.params.job_id;
    const { user , reason } = req.body;

    const job = await Job.findOne({ _id: job_id });
   
    // Check if user has already flagged the job
    const userFlag = job.flags.find(flag => flag.user.toString() == user);
    if (userFlag) {
      return res.status(400).json({ success: false, message: "You have already flagged this job!" });
    }


    // save users flag....
    job.flags.push({
      user,
      reason
    });


    if(!job){
      return res.status(404).json({ success: false, message: "job not found!"});
    }
    res.status(200).json({ success: true, message: "Job flagged successfully!"});

    await job.save();


    // SEND NOTIFICATION AND EMAIL TO ADMIN & JOB EMPLOYER HERE >>>
    const newNotification = new Notification({
        employer: job.employer,
        message: `Your job: ${job.title} was flagged, reason: ${reason}, please review to avoid being closed`,
        link_url: `jobs/${job_id}`,
    });
    await newNotification.save();

  }catch(error){
    console.log("error flaggin job: ", error);
    res.status(500).json({ success: false, message: "internal server error"})
  }
}

// exports.listJobs = async (req, res) => {
//   try {
//     const jobs = await Job.find();

//     // Filter out jobs without a valid employer
//     const populatedJobs = await Promise.all(
//       jobs.map(async (job) => {
//         if (job.employer) {
//           const employer = await Employer.findById(job.employer);
//           if (employer) {
//             // If employer is found, populate the job with selected fields
//             return {
//               ...job.toJSON(),
//               employer: {
//                 is_verified: employer.is_verified,
//                 profile: employer.profile,
//                 created: employer.created,
//               },
//             };
//           }
//         }
//         return job.toJSON(); // No employer found or employer field is null
//       })
//     );

//     res.status(200).json({ jobs: populatedJobs });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };



// controller to get application for a job..

// gets the application details for a user's job application...
exports.getUserApplicationForJob = async (req, res) => {
  try {
    const job_id = req.params.job_id;
    const user_id = req.userId;

    // Validate if job_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Convert job_id to a valid ObjectId
    const objectIdJobId = new mongoose.Types.ObjectId(job_id);

    // Query the database to find the job by its ID
    const job = await Job.findById(objectIdJobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Job is found, proceed to find the application
    try {
      const application = await Application.findOne({ job: objectIdJobId, user: user_id });

      if (!application) {
        return res.status(404).json({ message: 'Application for job not found' });
      }

      return res.status(200).json({ application });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// controller to fetch all users that have applied for a job...
exports.getApplicationsForJob = async (req, res) => {
  try{
    const job_id = req.params.job_id;
    const applications = await Application.find({ job:job_id }).populate("user", "firstname lastname profile");
    if(!applications){
      return res.status(200).json({ message: "no applications yet"})
    }
    return res.status(200).json({ applications })
  }catch(error){
    console.log("get applications error: ",error)
  }
};

// controller to save a job...
exports.saveJob = async (req, res) => {
    try {
        const user = req.user;
        const job_id = req.params.job_id;
        if (!mongoose.Types.ObjectId.isValid(job_id)) {
          return res.status(404).json({ message: 'Job not found' });
        }
        const job = await Job.findById(job_id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        } else {
            if (user.saved_jobs.includes(job_id)) {
                // Job already exists in saved jobs, remove it
                user.saved_jobs = user.saved_jobs.filter(savedJobId => String(savedJobId) !== String(job_id));
                await user.save(); // Save the user after removing the job
                res.status(200).json({ message: "Job unsaved successfully" });
            } else {
                // Job doesn't exist in saved jobs, add it
                user.saved_jobs.push(job_id);
                await user.save(); // Save the user after adding the job
                res.status(201).json({ message: "Job saved successfully" });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error saving job" });
    }
};

// controller to mark job as deleted...
exports.deleteJob = async (req, res) => {
  try{
    const job_id = req.params.job_id;
    const job = await Job.findById(job_id);

    if (!mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(404).json({ message: 'Job not found' });
    };

    job.is_deleted = true;
    job.status = "closed";
    job.save();

    res.status(200).json({ message: "Job deleted successfully!"});

  }catch(error){
    console.log("error deleting job: ", error);
    res.status(500).json({ message: "error deleting job"});
  }
}

// controller to mark job as closed...
exports.closeJob = async (req, res) => {
  try{
    const job_id = req.params.job_id;
    const job = await Job.findById(job_id);

    if (!mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(404).json({ message: 'Job not found' });
    };

    job.status = "closed";
    job.save();

    res.status(200).json({ message: "Job closed successfully!"});

  }catch(error){
    console.log("error closing job: ", error);
    res.status(500).json({ message: "error closing job"});
  }
}



// controller to edit a job...
exports.editJob = async (req, res) => {
    try{
      const job_id = req.params.job_id;
      if (!mongoose.Types.ObjectId.isValid(job_id)) {
        return res.status(404).json({ message: 'Job not found' });
      }
      const edits = req.body;
  
      const updateJob = await Job.findByIdAndUpdate(job_id, edits, {new: true});
      res.status(200).json({ message: "job updated successfully!", job: updateJob})
    }
    catch(error){
      res.status(500).json({ message: 'Error editing job', error: error.message });
    }
};
  
// controller to get user saved jobs...
exports.getSavedJobs =  async (req, res) => {
    try{
        const user = await User.findById(req.userId).populate('saved_jobs');
        return res.status(200).json({ savedJobs: user.saved_jobs });
    }
    catch(error){
        console.log(error);
    }
   
};

// controller to search for jobs...
exports.searchJobs = async (req, res) => {
    try {
        const { keywords, budgetMin, budgetMax, jobType, location, posted } = req.query;

        // Build the filter criteria based on user's input
        const filter = {};

        // Search keywords in job title and description
        if (keywords) {
            filter.$or = [
                { title: { $regex: keywords, $options: 'i' } },
                { skills: { $regex: keywords, $options: 'i' } },
                { description: { $regex: keywords, $options: 'i' } },
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
            filter.type = jobType;
        }

        // Filter by location
        if (location && location.states && Array.isArray(location.states)) {
            const locationFilter = { $or: [] };

            location.states.forEach(state => {
                locationFilter.$or.push({ 'location.state': { $regex: new RegExp(state, 'i') } });
            });

            filter.$and = [{ 'location': { $exists: true } }, locationFilter];
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
        const jobs = await Job.find(filter).populate("employer", "is_verified profile created");

        jobs.forEach(job => {
            if (!job.employer) {
                job.is_deleted = true;
                job.save();
            }
        });

        const legit_jobs = jobs.filter(job => !job.is_deleted);

        res.status(200).json({ jobs: legit_jobs });
    } catch (error) {
        res.status(500).json({ message: 'Error searching jobs', error: error.message });
    }
};




const deleteFile = require('../utils/deleteFile');


exports.uploadDocument = async (req, res) => {
  try{
    const files = req.uploadResults;
  
    if (!files) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
  
    const fileUrls = files.map(file => file.Location);

    console.log("uploads: ", req.uploadResults)
    
    res.status(200).json({ message: 'files uploaded successfully!', files: req.uploadResults });
  }catch(error){
    res.status(500).json({ message: 'internal server error', error: error.message });
  }
};

exports.deleteUploadedFile = async (req, res) => {
  const key = req.params.key; // The key of the file to delete, passed in the request body

  if (!key) {
    return res.status(400).json({ message: 'File key is required' });
  }

  try {
    await deleteFile(key);
    res.status(200).json({ message: 'File deleted successfully!' });
  } catch (error) {
    console.log("erro deleting file: ", error);
    res.status(500).json({ message: 'Failed to delete file', error: error.message });
  }
};

// sends clients application to databse and creates a new application record >>>
exports.submitApplicationMain = async (req, res) => {
  const job_id = req.params.job_id;
  const job = await Job.findById(job_id);

  const existingAplication = await Application.findOne({ user:req.userId, job: req.job });
  if(existingAplication){
    res.status(200).json({ message: "You already submitted an application"})
  } else if(job.status == 'closed'){
     return res.status(400).json({ message: "you cant send an application, this job has been closed by the employer"});
  } else {
    try {
      // Access form data
      const { cover_letter, counter_offer, reason_for_co, attachments } = req.body;
  
      // Return necessary information
      res.status(200).json({
        message: 'Job application submitted successfully',
        cover_letter,
        counter_offer,
        reason_for_co,
        attachments,
      });

      const newApplication = new Application({
        job: req.params.job_id,
        user: req.userId,
        cover_letter,
        attachments,
        counter_offer,
        reason_for_co
      })

      await newApplication.save();

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  };



// Function to handle file upload
exports.handleFileUpload = async(req, res) => {
  try {
    const files = req.files;

    // Array to store uploaded file URLs
    const fileUrls = [];

    // Folder name within the bucket
    const folderName = 'job-application-attachments/';

    // Iterate through each file
    for (const file of files) {
      // Read file content
      const fileContent = fs.readFileSync(file.path);

      // Set params for S3 upload with the folder name included in the Key
      const params = {
        Bucket: 'techzone-storage',
        Key: `${folderName}${Date.now()}_${file.originalname}`,
        Body: fileContent,
        ACL: 'public-read'
      };

      // Upload file to S3
      const command = new PutObjectCommand(params);
      const uploadResult = await s3Client.send(command);

      // Delete local file after uploading to S3
      fs.unlinkSync(file.path);
      
      for (const file of files) {
          const key = `${folderName}${Date.now()}_${file.originalname}`;
      
          const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${key}`;
          
          fileUrls.push(fileUrl);
      }

      // Push S3 file URL to array
      // fileUrls.push(uploadResult);
    }

    // Send response with array of uploaded file URLs
    res.json({ fileUrls });
  } catch (error) {
    console.log("error uploading file: ", error);
    res.status(500).json({ error: 'Error uploading file' });
  }
}


// Function to submit job applications [SAVES ATTACHMENTS TO S3 BUCKET]
exports.submitApplication = async (req, res) => {
  const existingAplication = await Application.findOne({ user:req.userId });
  if(existingAplication){
    res.status(200).json({ message: "You already submitted an application"})
  } else {
    try {
      // Access form data
      const { cover_letter, counter_offer, reason_for_co } = req.body;

      // Return necessary information
      res.status(200).json({
        message: 'Job application submitted successfully',
        cover_letter,
        counter_offer,
        reason_for_co,
        // attachments: attachments.map((file) => file.location), // Use file.location for S3 URLs
      });
  
      const newApplication = new Application({
        job: req.params.job_id,
        user: req.userId,
        cover_letter,
        // attachments will be added..
        counter_offer,
        reason_for_co,
      });
  
      await newApplication.save();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};



exports.uploadFilesToS3 = async (req, res) => {
  await fileparser(req)
  .then(data => {
    res.status(200).json({
      message: "Success",
      data
    });
    
  })
  .catch(error => {
    res.status(400).json({
      message: "An error occurred.",
      error
    })
  })
};



