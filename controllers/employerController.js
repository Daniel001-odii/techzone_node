const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Application = require('../models/applicationModel');
const Contract = require('../models/contractModel.js');
const jwt = require('jsonwebtoken');


exports.getJobsByEmployer = async (req, res) => {
  try {
      // Fetch jobs by employer
      const jobs = await Job.find({ employer: req.employerId });

      // Iterate through the fetched jobs
      for (let job of jobs) {
          // Query applications associated with the current job and count them
          const applicationsCount = await Application.countDocuments({ job: job._id });

          // Update the number_of_applications field for the current job
          job.no_of_applications = applicationsCount;
      }

      // Return the updated jobs
      return res.status(200).json({ jobs });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.saveUser = async (req, res) => {
    console.log("saving user...")
      try {
        const userId = req.params.user_id;
        const employer = req.employer;
  
        // Find the user by its ID
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: `User ${userId} does not exist, try again...` });
        }
  
        const userAlreadySaved = employer.saved_users.includes(userId);
        if (userAlreadySaved) {
          // If user already exists in saved_users, remove the user
          employer.saved_users = employer.saved_users.filter(savedUser => String(savedUser) !== String(userId));
          await employer.save();
          return res.status(200).json({ message: 'User removed successfully' });
        } else {
          // If user not found in saved_users, add the user
          employer.saved_users.push(userId);
          await employer.save();
          return res.status(200).json({ message: 'User saved successfully' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Error saving user', error: error.message });
      }
};


exports.getEmployerSavedUsers = async (req, res) => {
  try{
    const employer = await Employer.findById(req.employerId).populate('saved_users');
    return res.status(200).json({ saved_users: employer.saved_users });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: 'internal server error' })
  }
};

// updating user profile....
exports.updateEmployerData= async (req, res) => {
  try {
    const employerId = req.employerId; // Get the user's ID from the authenticated user
    const updates = req.body; // Update fields from the request body
    console.log("from client: ", updates)
    // Update the user's profile fields
    // const employer = await Employer.findByIdAndUpdate(employerId, updates, { new: true });
    const employer = await Employer.findById(employerId);

    // console.log("found employer: ", employer);

    employer.profile = updates.profile;
    employer.preffered_job_types = updates.preffered_job_types;

    await employer.save();

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
    console.error("error updating employer profile: ", error)
  }
};

exports.getCompletedContracts = async (req, res) => {
  try{
    const employer = req.employerId;
    const contracts = await Contract.find({ employer, status: "completed" }).populate("job");

    res.status(200).json({ success: true, contracts })

  }catch(error){
    res.status(500).json({ message: "internal server error"});
    console.log("error getting completed contracts: ", error);
  }
};



