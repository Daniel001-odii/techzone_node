const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const User = require("../models/userModel");
const Employer = require("../models/employerModel");
const Job = require("../models/jobModel");
const Notification = require('../models/notificationModel');
const Administrator = require('../models/adminModel');


const crypto = require('crypto');
const nodemailer = require('nodemailer');

 // Replace with the correct path
 exports.adminSignup = (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Check if required fields are missing
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).send({ message: "All fields are required" });
  }

  // Check if the email is already registered
  Administrator.findOne({ email: email }, (err, existingAdmin) => {
    if (err) {
      return res.status(500).send({ message: "Internal server error" });
    }

    if (existingAdmin) {
      return res.status(400).send({ message: "Email is already registered" });
    }

    // Create a new admin with the provided data
    const adminsitrator = new Administrator({
      firstname: firstname,
      lastname: lastname,
      email: email,
      role: 'Admin',
      password: bcrypt.hashSync(password, 8),
    });
    // Save the new admin
    adminsitrator.save((err, savedadmin) => {
      if (err) {
        return res.status(500).send({ message: "admin registration failed" });
      }

      // Send a success response
      res.status(200).send({ message: "Administrator registered successfully" });
    });
  });
};




exports.adminSignin = (req, res) => {
  Administrator.findOne({ email: req.body.email })
      .exec((err, admin) => {
        if (err) {
          return res.status(500).send({ message: err });
        }

        if (!admin) {
          return res.status(404).send({ message: 'Administrator with email not found' });
        }

        // Verify admin's credentials
        const passwordIsValid = bcrypt.compareSync(req.body.password, admin.password);

        if (!passwordIsValid) {
          return res.status(401).send({ accessToken: null, message: 'Invalid Password' });
        }



        // Generate and send the access token for admin
        const token = jwt.sign({ id: admin._id, role: "Admin" }, process.env.API_SECRET, {
          expiresIn: 86400,
        });

        res.status(200).send({
          Administrator: {
            id: Administrator._id,
            role: "admin",
            email: admin.email,
            // Add other admin data if needed
          },
          message: 'Administrator login successful',
          accessToken: token,
        });
      });
  };



exports.getAllRecords = async (req, res) => {
    try {
        // Use Mongoose to fetch all records from the model
        const users = await User.find();
        const employers = await Employer.find();
        const Notifications = await Notification.find();
        const jobs = await Job.find();
        const administrators = await Administrator.find();

        // You can add additional logic or filtering here if needed

        res.status(200).json({
          users:users.length,
          employers:employers.length,
          jobs:jobs.length,
          administrators: administrators.length,
          Notifications:Notifications.length,
          details:{
            users,
            employers,
            jobs,
            administrators,
          }

        });
      } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error: error.message });
      }
};



exports.getAdminDetails = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the user ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the user ID from the token to fetch the user details from the database
    Administrator.findById(decoded.id, (err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      if (!user) {
        return res.status(404).send({ message: 'Administrator not found' });
      }

      // Send the user details in the response
      res.status(200).send({ user });
    });
  });

  if(req.headers.authorization.split(' ')[1] == undefined || req.headers.authorization.split(' ')[1] == null){
    return res.status(401).send({message: "no authorization headers found.."})
  }
};


exports.addNewAdmin = (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  // Check if required fields are missing
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).send({ message: "All fields are required" });
  }

  // Check if the email is already registered
  Administrator.findOne({ email: email }, (err, existingAdmin) => {
    if (err) {
      return res.status(500).send({ message: "Internal server error" });
    }

    if (existingAdmin) {
      return res.status(400).send({ message: "Email is already registered" });
    }

    // Create a new admin with the provided data
    const admin = new Administrator({
      firstname: firstname,
      lastname: lastname,
      email: email,
      role: role,
      password: bcrypt.hashSync(password, 8),
    });
    // Save the new admin
    admin.save((err, savedadmin) => {
      if (err) {
        return res.status(500).send({ message: "admin registration failed" });
      }

      // Send a success response
      res.status(200).send({ message: `${admin.role} registered successfully` });
    });
  });
};


exports.updateProfile = async (req, res) => {
  try {
    console.log(req);
    const adminId = req.admin._id; // Get the user's ID from the authenticated user
    const updates = req.body; // Update fields from the request body


    // Update the user's profile fields
    const updatedAdmin = await Administrator.findByIdAndUpdate(adminId, updates, { new: true });

    res.status(200).json({ message: 'Admin Details updated successfully', user: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};



