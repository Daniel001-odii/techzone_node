const Job = require('../models/jobModel');
const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const Contract = require('../models/contractModel');
const Application = require('../models/applicationModel');
const Admin = require("../models/adminModel");
const EarlyBirds = require("../models/waitListUser");


const Notification = require('../models/notificationModel')
const notificationController = require('../controllers/notificationController');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);


const sendSecondaryEmail = require("../utils/emailSecondary.js");

/*
CREATE
READ
UPDATE
DELETE
*/


exports.getAdmin = async (req, res) => {
    try {
      if(req.user){
        const user = req.user;
        res.status(200).json({ user });
    } 
    }catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getAdminUsers = async (req, res) => {
  try {
    const administrative_users = await Admin.find();
    res.status(200).json({ administrative_users });
  }catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// get all documents.count...
exports.getAllRecordsCount = async (req, res) => {
    try{
        const users = await User.find();
        const employers = await Employer.find();
        const jobs = await Job.find();
        const applications = await Application.find();
        const contracts = await Contract.find();
        const administrator = await Admin.find();
        
        const count = {
            users: users.length,
            employers: employers.length,
            jobs: jobs.length,
            applications: applications.length,
            contracts: contracts.length,
            administrators: administrator.length
            
        }

        res.status(200).json({ count });


    }catch(error){
        console.log("error retrieving totla doc count: ", error);
        res.status(500).json({ message: "internal server error" });
    }
}

// GET ALL CONTRACTS...
exports.getAllContracts = async(req, res) => {
    try{
     
        const contracts = await Contract.find()
        .populate({
            path: "employer",
            select: "firstname lastname profile" // Specify the properties you want to populate
        })
        .populate({
            path: "employer",
            select: "firstname lastname profile" // Specify the properties you want to populate
        })
        .populate({
            path: "job"
        });

        const total = await Contract.countDocuments();

        return res.status(200).json({ contracts, total_contracts });
               
    }catch(error){
        console.log(error)
    }
}

// GET ALL EMPLOYER RECORDS...
exports.getAllEmployers = async (req, res) => {
    try{
      const all_employers = await Employer.find();
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const total = await Employer.countDocuments();
      const employers = await Employer.find().skip(startIndex).limit(limit);

      res.status(200).json({ page, limit, total, pages: Math.ceil(total / limit), employers, all_employers });
    }catch(error){
      console.log(error);
      res.status(500).json({ message: 'internal server error' })
    }
  }

// GET ALL USER RECORDS...
exports.getAllUsers = async (req, res) => {
    try {
      const all_users = await User.find();
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const total = await User.countDocuments();
      const users = await User.find().skip(startIndex).limit(limit);

      res.status(200).json({ page, limit, total, pages: Math.ceil(total / limit), users, all_users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
};

// GET ALL EARLY USERS...
exports.getAllEarlyUsers = async (req, res) => {
  try {

    // implementing pagination for the sake of good ol times...
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const total = await EarlyBirds.countDocuments();

    const users = await EarlyBirds.find().skip(startIndex).limit(limit);
    const all_users = await EarlyBirds.find();

    // const users = await EarlyBirds.find();
    res.status(200).json({ page, limit, total, pages: Math.ceil(total / limit), users, all_users });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/* 
 to,
  subject,
  text,
  html,
  template,
  context,
  */
exports.sendBulkEmail = async (req, res) => {
  try{
    const  { emails, mail } = req.body;

    console.log("from send-b email client: ", emails, `\n ${mail}`)
    // await sendEmail(recipient, subject, null, null, template, context);
    sendSecondaryEmail(emails, mail.subject, null, mail.body, "apex-alert", );

    res.status(200).json({ message: "Bulk email message sent successfuly!"});

  }catch(error){
    console.log("error with sendin bulk email: ", error);
    return res.status(500).json({ error: "couldnt send bulk email"});
  }
}