const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const jobController = require("../controllers/jobController");
const employerController = require("../controllers/employerController");
const { sendVerificationEmail, verifyEmail } = require('../controllers/emailController');
const  userController = require("../controllers/userController");



// const router = express.Router();
// const crypto = require('crypto');

const router = express.Router(),

verifyToken = require('../middleware/authJWT'),
  {
    signup,
    signin,
    employerSignin,
    employerSignup,
    getUser,
    getEmployer,
    getUserOrEmployerById,
  } = require("../controllers/authController.js");

  

router.post("/register", signup, function (req, res) {
});

router.post("/register-employer", employerSignup, function (req, res){
});

router.post("/login", signin, function (req, res) {

});


// Route for employer sign-in
router.post('/employer/login', employerSignin, function (req, res) {
});



router.get("/hiddencontent", verifyToken, function (req, res) {
  if (!User) {
    res.status(403)
      .send({
        message: "Invalid JWT token"
      });
  }
  if (req.User == "admin") {
    res.status(200)
      .send({
        message: "Congratulations! but there is no hidden content"
      });
  } else {
    res.status(403)
      .send({
        message: "Unauthorised access"
      });
  }
});


// Route to fetch user details using JWT token
//this first routes uses middleware to authorize requests.....
// router.get('/user-info', verifyToken, getUser);

router.get('/user-info', getUser);

 
// Route to fetch employer details using JWT token
//this first routes uses middleware to authorize requests.....
// router.get('/employer-info', verifyToken, getEmployer);
router.get('/employer-info', getEmployer);



// Route for saving jobs ......
router.post("/jobs/save/:jobId", verifyToken, jobController.saveJob);


// Route for retrieving saved jobs
router.get('/jobs/saved', verifyToken, jobController.getSavedJobs);


// Define the route for employers to view hired applicants and apply the verifyToken middleware
router.get('/employer/hired-applicants', verifyToken, employerController.viewHiredApplicants);


// Route to get all jobs posted by a particular employer
router.get('/employer/:employerId/jobs', jobController.getJobsByEmployer);

// Route to get user or employer details by ID
router.get('/get-info/:id', getUserOrEmployerById);

// Route to logout......
router.post("/sign-out", (req, res) => {
    // For a simple logout, you don't need to do much on the server side since JWT tokens are stateless.
    // The client will discard the token.
    // You can provide a success message if needed.
    res.status(200).json({ message: "User Logged Out Successfully" });
  });


  // Route for verifying the email
router.get('/verify-email/:token', verifyEmail);


// Route for sending the verification email
router.post('/send-verification-email', sendVerificationEmail);


router.put("/user",  verifyToken, userController.updateUserProfile);
router.put("/employer",  verifyToken, userController.updateEmployerProfile);











  
 


  module.exports = router;