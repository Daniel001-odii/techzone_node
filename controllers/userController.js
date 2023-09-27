// Import your User and Employer models
const User = require('../models/userModel');
const Employer = require('../models/employerModel');



// Route to update a user's profile
// router.put('/user', authMiddleware, async (req, res) => {
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user's ID from the authenticated user
    const updates = req.body; // Update fields from the request body

    // Update the user's profile fields
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};


// Route to update an employer's profile
exports.updateEmployerProfile = async (req, res) => {
  try {
    const employerId = req.employer._id; // Get the employer's ID from the authenticated employer
    const updates = req.body; // Update fields from the request body

    // Update the employer's profile fields
    const updatedEmployer = await Employer.findByIdAndUpdate(employerId, updates, { new: true });

    res.status(200).json({ message: 'Profile updated successfully', employer: updatedEmployer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

