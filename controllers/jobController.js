const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Application = require('../models/applicationModel');
const jwt = require('jsonwebtoken');

const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');


const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Set up AWS credentials
const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
  });

// Create a function to convert buffer to Readable stream
const bufferToStream = (buffer) => {
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    return readableStream;
  };
  
  const upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: 'your-s3-bucket-name',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        cb(null, 'public/applications/attachments/' + Date.now() + '-' + file.originalname);
      },
    }),
  });



// Controller for posting a job (for employers)
exports.postJob = async (req, res) => {
    console.log("job posting by: ",req.employer)
    if (req.employer) {
      // The user is an employer, allow them to post a job
      try {
        const { title, description, type, skills, period, budget, budget_type, location } = req.body;
  
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
        return res.status(400).json({ message: 'Invalid job ID format' });
      }
  
      // Query the database to find the job by its ID
      const job = await Job.findById(job_id).populate("employer", "is_verified profile created");
  
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

        // Fetch all jobs
        const allJobs = await Job.find().populate("employer", "is_verified profile created");;

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
    const jobs = await Job.find().populate("employer", "is_verified profile created");
    res.status(200).json({ jobs })
  }catch(error){
    console.log(error)
    res.status(500).json({ message: "internal server error" })
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

exports.getUserApplicationForJob = async (req, res) => {
  try {
    const job_id = req.params.job_id;
    const user_id = req.userId;

    // Validate if job_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(job_id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
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
        const job = await Job.findById(job_id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        } else {
            if (user.saved_jobs.includes(job_id)) {
                // Job already exists in saved jobs, remove it
                user.saved_jobs = user.saved_jobs.filter(savedJobId => String(savedJobId) !== String(job_id));
                await user.save(); // Save the user after removing the job
                res.status(200).json({ message: "Job removed from saved-jobs successfully" });
            } else {
                // Job doesn't exist in saved jobs, add it
                user.saved_jobs.push(job_id);
                await user.save(); // Save the user after adding the job
                res.status(200).json({ message: "Job saved successfully" });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error saving job" });
    }
};

// controller to edit a job...
exports.editJob = async (req, res) => {
    try{
      const job_id = req.params.job_id;
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
        filter.period = jobType;
      }
  
      // Filter by location
      if (location && typeof location === 'object') {
        const locationFilter = {};
        if (location.state) {
            locationFilter['location.state'] = { $regex: new RegExp(location.state, 'i') };
        }
        if (location.city) {
            locationFilter['location.city'] = { $regex: new RegExp(location.city, 'i') };
        }
        if (location.address) {
            locationFilter['location.address'] = { $regex: new RegExp(location.address, 'i') };
        }
        if (Object.keys(locationFilter).length > 0) {
            filter.$and = [{ 'location': { $exists: true } }, locationFilter];
        }
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
        if(!job.employer){
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

// Function to submit job applications [SAVES ATTACHMENTS IN SERVER]
exports.submitApplicationMain = async (req, res) => {
  const existingAplication = await Application.findOne({ user:req.userId });
  if(existingAplication){
    res.status(200).json({ message: "You already submitted an application"})
  } else {
    try {
      // Access form data
      const { cover_letter, counter_offer, reason_for_co } = req.body;
  
      // Access files if they exist
      const attachments = req.files ? Object.values(req.files) : [];

      // increase number of applications...
      const job = await Job.findOne({ _id:req.params.job_id });
      job.no_of_applications += 1;
      await job.save();
  
      // Perform any necessary validations or processing here
  
      // Move files to a public folder (you might want to improve this for security)
      const publicFolder = 'public/applications/attachments';
      if (!fs.existsSync(publicFolder)) {
        fs.mkdirSync(publicFolder, { recursive: true });
      }
      console.log('publicFolder:', publicFolder);
  
      if (attachments.length > 0) {
        // Flatten the nested array if it exists
        const flatAttachments = attachments.flat();
      
        flatAttachments.forEach((file) => {
          const destinationPath = path.join(__dirname, publicFolder, file.name);
          file.mv(destinationPath, (err) => {
            if (err) throw err;
          });
        });
      }  
      // Return necessary information
      res.status(200).json({
        message: 'Job application submitted successfully',
        cover_letter,
        counter_offer,
        reason_for_co,
        // attachments: attachments.length > 0 ? attachments.flat().map((file) => path.join(publicFolder, file.name)) : [],
      });



      const newApplication = new Application({
        job: req.params.job_id,
        user: req.userId,
        cover_letter,
        attachment: attachments.length > 0 ? attachments.flat().map((file) => ({
          name: file.name,
          url: path.join(__dirname, publicFolder, file.name),
        })): [],
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
  

// Function to submit job applications
exports.submitApplication = upload.array('attachments', 5, async (req, res) => {
// exports.submitApplication = async (req, res) => {
  const existingAplication = await Application.findOne({ user:req.userId });
  if(existingAplication){
    res.status(200).json({ message: "You already submitted an application"})
  } else {
    try {
      // Access form data
      const { cover_letter, counter_offer, reason_for_co } = req.body;
  
      // Access files if they exist
      const attachments = req.files || [];
  
      // Upload files to S3
      const uploadPromises = attachments.map((file) => {
        const uploadParams = {
          Bucket: 'your-s3-bucket-name',
          Key: 'public/applications/attachments/' + Date.now() + '-' + file.originalname,
          Body: bufferToStream(file.buffer),
          ContentType: file.mimetype,
          ACL: 'public-read',
        };
  
        return s3Client.send(new PutObjectCommand(uploadParams));
      });
  
      await Promise.all(uploadPromises);
  
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
        // attachments: attachments.map((file) => file.location),
        attachment: attachments.length > 0 ? attachments.flat().map((file) => ({
          name: file.name,
          url: file.location
        })): [],
        counter_offer,
        reason_for_co,
      });
  
      await newApplication.save();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  });
  // };

