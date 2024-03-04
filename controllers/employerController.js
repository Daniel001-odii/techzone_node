const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const jwt = require('jsonwebtoken');

// get jobs posted by emplyer...
exports.getJobsByEmployer = async (req, res) => {
    try{
        const jobs = await Job.find({ employer: req.employerId });
        return res.status(200).json({ jobs });
    }
    catch(error){
        console.log(error);
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
}
