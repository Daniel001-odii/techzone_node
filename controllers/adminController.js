const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


const User = require("../models/userModel");
const Employer = require("../models/employerModel");
const Job = require("../models/jobModel");
const Notification = require('../models/notificationModel');



const crypto = require('crypto');
const nodemailer = require('nodemailer');

 // Replace with the correct path


exports.signin = (req, res) => {
    const { email, password } = req.body;

  };



exports.getAllRecords = async (req, res) => {
    try {
        // Use Mongoose to fetch all records from the model
        const users = await User.find();
        const employers = await Employer.find();
        const Notifications = await Notification.find();
        const jobs = await Job.find();

        // You can add additional logic or filtering here if needed

        res.status(200).json({
          users:users.length,
          employers:employers.length,
          jobs:jobs.length,
          Notifications:Notifications.length,
          details:{
            users,
            employers,
            jobs,
          }

        });
      } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error: error.message });
      }
};



