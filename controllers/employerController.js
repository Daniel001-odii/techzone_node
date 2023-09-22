// viewHiredApplicantsController.js
const Employer = require('../models/employerModel');
const Job = require('../models/jobModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');


exports.viewHiredApplicants = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers
    // Verify the token and get the user ID from it
    jwt.verify(token, process.env.API_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const employerId = decoded.id; // Get the employer's ID from the token

      // Query the database to retrieve the list of hired applicants for this employer
      const hiredApplicants = await Employer.findById(employerId, 'hiredApplicants').populate('hiredApplicants');

      res.status(200).json({ hiredApplicants });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving hired applicants', error: error.message });
  }
};