const express = require("express");

const User = require("../models/userModel");
const Employer = require("../models/employerModel");

const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const jobController = require("../controllers/jobController");
const employerController = require("../controllers/employerController");
const { sendVerificationEmail, verifyEmail } = require('../controllers/emailController');
const  userController = require("../controllers/userController");

const multer = require('multer');
// Configure multer to specify where to store uploaded profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'userUploads/profiles/'); // Set the folder where profile images will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});


// const upload = multer({ storage });

const fs = require('fs');

// Set up AWS credentials
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable } = require('stream');
const upload = multer({ dest: 'uploads/' });

// Set up AWS credentials
const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'AKIASAQOSQHZO2X2NYWV',
    secretAccessKey: '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',
  },
});


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
    sendPasswordResetEmail,
    resetPassword,
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
// router.get('/jobs/saved', verifyToken, jobController.getSavedJobs);


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



router.post("/sendpassreset", sendPasswordResetEmail, function (req, res) {
});

// router.post("/reset-password/:token", resetPassword, function (req, res) {
// });

router.post("/reset-password", resetPassword, function (req, res) {
});


// Define a route to handle file uploads
router.post('/upload-user-image', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const fileStream = fs.createReadStream(req.file.path);
    const uploadParams = {
      Bucket: 'fortechzone', // Replace with your bucket name
      Body: fileStream,
      Key: req.file.filename,
    };
    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });
    const result = await upload.done();

    // find the uploading user ID....
    const userId = req.userId;
    const user = await User.findOne({_id: userId});
    
    user.profile.profileImage = result.Location;
    await user.save();

    console.log('File uploaded successfully:', result.Location);

    // Close the file stream
    fileStream.destroy();

    // Clean up the temporary file created by multer
    fs.unlinkSync(req.file.path);

    res.status(200).send('Profile image uploaded successfully');
  } catch (err) {
    console.error('Error uploading image:', err.message);
    res.status(500).send('Failed to upload image');
  }
});


// Route to handle user profile image uploads
router.post('/upload-client-image', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    const imageUrl = req.file.path; // Get the path to the uploaded image

    const userId = req.employerId;
    console.log("this is the ID of the user uploading: ", userId);
    console.log("and the uploaded image path is: ", req.file.path);

    // Find the user by ID and update the profilePicture property with the image URL
    const user = await Employer.findOne({
      _id: userId,
    });


    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }else{console.log("user found: ", user.firstname + "-" + user.lastname)}

    user.profile.profileImage = `${process.env.LOCAL_URL}/${imageUrl}`;
    // user.profile.profileImage = `/${imageUrl}`;
    await user.save();

    res.status(200).json({ message: 'Profile image uploaded successfully', imageUrl });
  } catch (error) {
    console.error('Error uploading profile image', error);
    res.status(500).json({ message: 'Error uploading profile image', error: error.message });
  }
});


// Route to get jobs assigned to a user
router.get('/user-assigned-jobs', verifyToken, jobController.getUserAssignedJobs);


// Route to get jobs completed by a user
router.get('/user-completed-jobs', verifyToken, jobController.getUserCompletedJobs);


// Route to fetch all jobs a user has applied to
router.get('/user-applied-jobs', verifyToken, jobController.getUserAppliedJobs);






  
 


  module.exports = router;