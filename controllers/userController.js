const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Application = require('../models/applicationModel');
const mongoose = require('mongoose');

exports.getUser = async (req, res) => {
  try {
    if(req.user){
      const user = req.user;
      return res.status(200).json({ user });
    } else if(req.employer){
      const user = req.employer;
      // console.log("from get user function: ", user);
      return res.status(200).json({ user });
    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
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
        // if(user.settings.KYC.is_verified){
        //   user.lastname = `${user.lastname} is verified`
        // }
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
      const applications = await Application.find({ user: req.userId }).populate("job");

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
