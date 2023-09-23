const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const jobController = require("../controllers/jobController");
const employerController = require("../controllers/employerController");


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
router.get('/employers/hired-applicants', verifyToken, employerController.viewHiredApplicants);











router.post("/sign-out", (req, res) => {
    // For a simple logout, you don't need to do much on the server side since JWT tokens are stateless.
    // The client will discard the token.
    // You can provide a success message if needed.
    res.status(200).json({ message: "User Logged Out Successfully" });
  });















  router.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if the user with the provided email exists
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a unique reset token (you can use a library like `crypto` for this)
      const resetToken = generateUniqueResetToken();
  
      // Save the reset token and its expiration time in the user's document in the database
      user.resetToken = resetToken;
      user.resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour
  
      // Save the user document with the updated reset token
      await user.save();
  
      // Send a password reset email to the user's email address
      // Include a link to the reset password endpoint with the reset token
    //   sendPasswordResetEmail(user.email, resetToken);
      return res.status(200).json({ message: resetToken });
  
      return res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });


  router.post("/reset-password", async (req, res) => {
    try {
      const { email, resetToken, newPassword } = req.body;
  
      // Check if the user with the provided email exists
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Verify that the provided reset token matches the one stored in the user's document
      if (user.resetToken !== resetToken || user.resetTokenExpiration < Date.now()) {
        return res.status(401).json({ message: "Invalid or expired reset token" });
      }
  
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // Update the user's password with the new hashed password
      user.password = hashedPassword;
  
      // Clear the reset token and expiration
      user.resetToken = null;
      user.resetTokenExpiration = null;
  
      // Save the updated user document
      await user.save();
  
      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  router.get("/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
  
      // Verify the token against the user's document
      const user = await User.findOne({ verificationToken: token });
  
      if (!user) {
        return res.status(401).json({ message: "Invalid verification token" });
      }
  
      // Mark the user as verified and clear the verification token
      user.isVerified = true;
      user.verificationToken = null;
  
      // Save the updated user document
      await user.save();
  
      return res.status(200).json({ message: "Email verification successful" });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });


  function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
  
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing' });
    }
  
    try {
        const decoded = jwt.verify(token, '12345'); // Replace with your secret key
        req.userId = decoded.userId;
        console.log(decoded.userId); // Store the user ID in the request object
        next();
      } catch (error) {
        console.error('JWT Verification Error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
  }


  
 


  module.exports = router;