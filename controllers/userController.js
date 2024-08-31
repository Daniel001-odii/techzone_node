const User = require('../models/userModel');
const Job = require('../models/jobModel');
const Employer = require('../models/employerModel');
const Application = require('../models/applicationModel');
const Contract = require('../models/contractModel');
const Notification = require('../models/notificationModel')
const imageParser = require("../utils/imageParser")
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Wallet = require("../models/walletModel");

const axios = require('axios');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { error } = require('console');
// Create S3 client
const s3Client = new S3Client({
  region: 'us-east-1', // Specify your AWS region
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  }
});


function hashPassword(password) {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');

  // Hash the password with SHA-256 and the salt
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');

  // Return the hashed password along with the salt
  return {
      hash: hashedPassword,
      salt: salt
  };
}


// Function to compare provided password with hashed password
function comparePasswords(providedPassword, storedHash, salt) {
  // Hash the provided password with the stored salt
  const hashedPassword = crypto.pbkdf2Sync(providedPassword, salt, 1000, 64, 'sha256').toString('hex');

  // Compare the hashed passwords
  return storedHash === hashedPassword;
};


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
       // programmaticaly calculate employer's rating while fetching user data....
       const jobs = await Job.find({ employer: user._id });
       const contracts = await Contract.find({ employer: user._id, status: 'completed' });
       let totalRating = 0;
       let totalRatingsCount = 0;
       contracts.forEach(contract => {
         if (contract.employer_feedback.review && contract.employer_feedback.rating !== undefined) {
           totalRating += contract.employer_feedback.rating;
           totalRatingsCount++; // Increment count of contracts with ratings
         }
       });
       // Calculate average rating
       let averageRating = totalRatingsCount > 0 ? totalRating / totalRatingsCount : 0;
       user.rating = averageRating;
       user.rating_count = totalRatingsCount;
       user.jobs_posted = jobs.length;

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
         // programmaticaly calculate employer's rating while fetching user data....
        const contracts = await Contract.find({ employer: id, status: 'completed' });
        let totalRating = 0;
        let totalRatingsCount = 0;
        contracts.forEach(contract => {
          if (contract.employer_feedback.review && contract.employer_feedback.rating !== undefined) {
            totalRating += contract.employer_feedback.rating;
            totalRatingsCount++; // Increment count of contracts with ratings
          }
        });
        // Calculate average rating
        let averageRating = totalRatingsCount > 0 ? totalRating / totalRatingsCount : 0;
        employer.rating = averageRating;
        employer.rating_count = totalRatingsCount;
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
      const userId = req.userId || req.employerId; // Get the user's ID from the authenticated user
      const updates = req.body; // Update fields from the request body
  
      // Update the user's profile fields
      const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }) || await Employer.findByIdAndUpdate(userId, updates, { new:true });
      await updatedUser.save();
  
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// update user bank account details...
exports.updateUserAccountDetails = async (req, res) => {
  try{
    const user = req.user;

    const { name, account_name, account_number, code } = req.body;

    // if(!bank_name || !account_name || !account_number || !code ){
    //   res.status(400).json({ message:"all fields are required"});
    // }

    console.log("from client: ", req.body);

    user.settings.bank = {
      name,
      account_number,
      account_name,
      code
    };
    

    await user.save();

    res.status(201).json({ message: "user bank settings updated successfully!"});
  }catch(error){
    res.status(500).json({ message: "error updating user bank account details", error});
    console.log("error updating user bank account details ");

  }
}

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


exports.changePassword = async (req, res) => {
  try {
    const user = req.user || req.employer;
    const { password, new_password, new_password_confirmation } = req.body;

    console.log("password change detected: ", user, "form :", req.body)

    // Compare password only if the user has a password
    // const isValidPassword = bcrypt.compareSync(password, user.password);
    const isValidPassword =  comparePasswords(password, user.password.hash, user.password.salt);

   

    if (!isValidPassword) {
      return res.status(401).send({ message: "Current password provided is invalid" });
    }

    // Check if the new password is the same as the previous one
    if (password === new_password) {
      return res.status(400).send({ message: "New password cannot be the same as the previous password" });
    }

    // Check if the new password matches its confirmation
    if (new_password !== new_password_confirmation) {
      return res.status(400).send({ message: "Passwords don't match" });
    }

    // Hash the new password and save it to the user
    const hashedPassword = hashPassword(new_password);
    user.password = hashedPassword;
    await user.save();

    // NOTIFY USER HERE >>>
    const newNotification = new Notification({
        receiver: "user",
        user,
        message: "You changed your password",
    });
    await newNotification.save();

    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


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


exports.uploadUserResumeToS3 = async (req, res) => {
  try {
    // Retrieve file information from the request
    const { originalname, path } = req.file;

    // Prepare parameters for S3 upload
    const params = {
      Bucket: 'techzone-storage',
      Key: `user-resumes/${originalname}`, // Use original file name for the object key
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

    user.portfolio_url = objectUrl;

    await user.save();

    res.json({ message: "resume uploaded successfully" });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
};


// GET USER WALLET....
exports.getUserWallet = async(req, res) => {
  try{
      const wallet = await Wallet.findOne({ user: req.userId });
      if(!wallet){
          return res.status(404).json({ message: "user wallet not found"});
      }

      res.status(200).json({ wallet });

  }catch(error){
      console.log("error getting user wallet: ", error);
      res.status(500).json({ message: "internal server error"});
  }
};


// DOJAH >>>>>>>>>>>>>
const dojah_config =  { 
  headers: {
    'AppId': process.env.DOJAH_APP_ID,
    'Authorization': process.env.DOJAH_AUTH,
  }
}

exports.checkNIN = async (req, res) => {
  try {
    const { nin } = req.body;
    const headers = {
      'AppId': process.env.DOJAH_APP_ID,
      'Authorization': process.env.DOJAH_AUTH,
    };

    const response = await axios.get(`${process.env.DOJAH_BASE_URL}/kyc/nin?nin=${nin}`, dojah_config);

    // Return only the data part of the response
    res.status(200).json(response.data);

  } catch (error) {
    res.status(500).json({ message: "internal server error" });
    console.log("error verifying user ID: ", error.message); // Use error.message for better error logging
  }
};



// this controller below is to verify user using NIN and selfi image...
// selfie image is to be converted to base 64 and used as payload when making request..
// payload = last_name, first_name, selfie_image, nin..

exports.verifyNIN_with_selfieImage = async (req, res) => {
  try {
    const { selfie_image, nin } = req.body;
    const user = req.user;

    const payload = {
      first_name: user.firstname,
      last_name: user.lastname,
      selfie_image,
      nin
    };

    if(!selfie_image){
      return res.status(400).json({ message: "please attach your passport photo"});
    }
    if(!nin){
      return res.status(400).json({ message: "please input your"});
    }


    const response = await axios.post(
      `${process.env.DOJAH_BASE_URL}/kyc/nin/verify`,
      payload,
      dojah_config
    );

    console.log("results from NIN: ", response.data);

    const dojah_user = response.data.entity;

    if (dojah_user.selfie_verification.match) {
      if(dojah_user.first_name != user.firstname && dojah_user.last_name != user.lastname){
        return res.status(400).json({ message: "Name on NIN does not match with profile name"});
      }

      const verify_date = Date.now();

      user.settings.KYC.is_verified = true;
      user.settings.KYC.NIN_number = nin;
      user.settings.KYC.verified_on = verify_date;

      await user.save();
      
      return res.status(200).json({ message: "Identity verified successfully!", user: response.data.entity });
    } else {
      return res.status(400).json({ message: "Identity verification failed, please try again", user: response.data.entity });
    }

  } catch (error) {
    console.log("error verifying user: ", error);

    // Handle Axios errors
    if (error.response) {
      // The request was made and the server responded with a status code outside the range of 2xx
      return res.status(error.response.status).json({
        message: "An error occurred while verifying identity 1",
        error: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(500).json({
        message: "An error occurred while verifying identity 2",
        error: error.request,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        message: "An error occurred while verifying identity 3",
        error,
      });
    }
  }
};




// search for users profile by employers...
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

          filter.$and = [
            {
              $or: [
                { firstname: { $regex: firstname, $options: 'i' } },
                { lastname: { $regex: lastname, $options: 'i' } },
              ],
            },
            {
              $or: [
                { 'profile.bio': { $regex: keywords, $options: 'i' } },
                { 'profile.skillTitle': { $regex: keywords, $options: 'i' } },
              ],
            },
          ];
        } else {
          filter.$or = [
            { firstname: { $regex: keywords, $options: 'i' } },
            { lastname: { $regex: keywords, $options: 'i' } },
            { 'profile.title': { $regex: keywords, $options: 'i' } },
            { 'profile.bio': { $regex: keywords, $options: 'i' } },
            { 'profile.location.state': { $regex: keywords, $options: 'i' } },
          ];
        }
      }
    }

    // Define which specific fields to return
    const fieldsToReturn = 'firstname lastname email isVerified profile settings createdAt'; // Add other fields as needed

    // Use the filter and fieldsToReturn to search for users
    const users = await User.find(filter).select(fieldsToReturn);

    res.status(200).json({ users });
  } catch (error) {
    console.log("error searching for wonderful user: ", error)
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

