const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Application = require('../models/applicationModel');
const Contract = require('../models/contractModel');
const imageParser = require("../utils/imageParser")

const mongoose = require('mongoose');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// Create S3 client
const s3Client = new S3Client({
  region: 'us-east-1', // Specify your AWS region
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  }
});

exports.getUser = async (req, res) => {
  try {
    if(req.user){
      const user = req.user;
      res.status(200).json({ user });

      /*
      ** FOR EMPLOYERS
      **
      */
    } else if(req.employer){
      const user = req.employer;
      return res.status(200).json({ user });
    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserSavedJobs = async (req, res) => {

};


// route to get eitrher user or employer by their ID...
exports.getUserOrEmployerById = async (req, res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(404).json({ message: 'User or employer not found' });
    }
  
    try {
      // Check if the ID corresponds to a user
      const user = await User.findById(id);

      // If not, check if the ID corresponds to an employer
      const employer = await Employer.findById(id);
      if (user) {

      // programmaticaly calculate user's rating while fetching user data....
      const contracts = await Contract.find({ user: id, status: 'completed' });
      let totalRating = 0;
      let totalRatingsCount = 0;
      contracts.forEach(contract => {
        if (contract.user_feedback.review && contract.user_feedback.rating !== undefined) {
          totalRating += contract.user_feedback.rating;
          totalRatingsCount++; // Increment count of contracts with ratings
        }
      });
      // Calculate average rating
      let averageRating = totalRatingsCount > 0 ? totalRating / totalRatingsCount : 0;
      user.rating = averageRating;
      user.rating_count = totalRatingsCount;
        return res.status(200).json({ user });
      } 
      
      if (employer) {
        return res.status(200).json({ employer });
      }

      if(!user || !employer){
        // If neither user nor employer is found, return an error
        return res.status(404).json({ message: 'User or employer not found' });
     }
   
      
    } catch (error) {
      return res.status(500).json({ message: 'User or employer not found'});
    }
  };

// updating user profile....
exports.updateUserData= async (req, res) => {
    try {
      const userId = req.userId; // Get the user's ID from the authenticated user
      const updates = req.body; // Update fields from the request body
  
      // Update the user's profile fields
      const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
      await updatedUser.save();
  
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
  };

// search for user...
exports.searchUsers = async (req, res) => {
  try {
      const { keywords } = req.query;
      let filter = {};

      // Check if the search query is an ObjectId (for searching by ID)
      if (keywords && mongoose.Types.ObjectId.isValid(keywords)) {
          filter._id = keywords; // Search by ID if valid ObjectId is provided
      } else {
          // Search by keywords in various fields (including nested fields)
          if (keywords) {
              const spaceIndex = keywords.indexOf(' ');

              if (spaceIndex !== -1) {
                  // If space is found, split keywords into firstname and lastname
                  const firstname = keywords.substring(0, spaceIndex);
                  const lastname = keywords.substring(spaceIndex + 1);

                  filter.$or = [
                      { $and: [{ firstname: { $regex: firstname, $options: 'i' } }, { lastname: { $regex: lastname, $options: 'i' } }] },
                      { 'profile.bio': { $regex: keywords, $options: 'i' } },
                      { 'profile.skillTitle': { $regex: keywords, $options: 'i' } }
                  ];
              } else {
                  filter.$or = [
                      { firstname: { $regex: keywords, $options: 'i' } },
                      { lastname: { $regex: keywords, $options: 'i' } },
                      { 'profile.bio': { $regex: keywords, $options: 'i' } },
                      { 'profile.title': { $regex: keywords, $options: 'i' } },
                      { 'profile.location': { $regex: keywords, $options: 'i' } }
                  ];
              }
          }
      }

      // Define which specific fields to return
      const fieldsToReturn = 'firstname lastname email isVerified profile'; // Add other fields as needed

      // Use the filter and fieldsToReturn to search for users
      const users = await User.find(filter).select(fieldsToReturn);

      res.status(200).json({ users });
  } catch (error) {
      res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

// get user applied jobs..
exports.getAppliedJobs = async (req, res) => {
  try {
    const applications = await Application.aggregate([
      {
        $match: { user: req.userId } // Filter applications by user
      },
      {
        $lookup: {
          from: 'jobs', // Name of the referenced collection
          localField: 'job', // Field in the current collection
          foreignField: '_id', // Field in the referenced collection
          as: 'job' // Output array field
        }
      },
      {
        $unwind: '$job'
      },
      {
        $match: {
          'job': { $exists: true } // Filter to only include applications with existing jobs
        }
      }
    ]);

    if (applications.length === 0) {
      return res.status(200).json({ message: 'No applied jobs found for the user' });
    }

      // Extract the 'job' property from each element in the 'applications' array
      const appliedJobs = applications.map(appliedJob => appliedJob.job);

      return res.status(200).json({ applications: appliedJobs });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// get user applied jobs..
exports.getApplicationDetails = async (req, res) => {
  try {
      const jobId = req.params.job_id;

      const applicationDetail = await Application.find({ user: req.userId, job: jobId }).populate("job");

      return res.status(200).json({ applicationDetail });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getUserRating = async (req, res) => {
  try {
    // const user = req.params.user_id; // Corrected typo from req.prarams.user_id to req.params.user_id
    const contracts = await Contract.find({ user: req.params.user_id });

    let totalRating = 0;
    let totalRatingsCount = 0;

    contracts.forEach(contract => {
      if (contract.user_feedback && contract.user_feedback.rating !== undefined) {
        totalRating += contract.user_feedback.rating;
        totalRatingsCount++; // Increment count of contracts with ratings
      }
    });

    // Calculate average rating
    let averageRating = totalRatingsCount > 0 ? totalRating / totalRatingsCount : 0;

    return res.status(200).json({ averageRating, totalRatingsCount });
  } catch (error) {
    console.error("Error getting user rating: ", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.uploadProfileImageToS3 = async (req, res) => {
  try {
    // Retrieve file information from the request
    const { originalname, path } = req.file;

    // Prepare parameters for S3 upload
    const params = {
      Bucket: 'techzone-storage',
      Key: `profile-images/${originalname}`, // Use original file name for the object key
      Body: require('fs').createReadStream(path), // Read stream from local file
      ACL: 'public-read'
    };

    // Upload image to S3
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);

    // Clean up the temporary file
    require('fs').unlinkSync(path);

    // Return the S3 object URL as the response
    const objectUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;

    // save as user's profile image ...
    const user = req.user;

    user.profile.image_url = objectUrl;

    await user.save();

    res.json({ message: "profile image updates successfully" });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};