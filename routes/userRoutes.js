const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const jobController = require("../controllers/jobController")
const middleware = require("../middlewares/authMiddleware")


const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get("/user", middleware,  userController.getUser);

router.get("/user/:id", userController.getUserOrEmployerById);

// update user's password
router.post("/user/password/change", middleware, userController.changePassword);

// get user saved jobs
router.get("/user/jobs/saved", middleware, jobController.getSavedJobs);

// Define the route for searching jobs
router.get('/user/jobs/search', jobController.searchJobs);

// search for users....
router.get('/user/users/search', userController.searchUsers);

// get user applications/applied jobs...
router.get("/user/jobs/applied", middleware, userController.getAppliedJobs);

// get application details...
router.get("/user/jobs/:job_id", middleware, userController.getApplicationDetails);

// updating user's profile...
router.patch("/user/profile", middleware, userController.updateUserData);

// get user's rating...
router.get("/user/:user_id/rating", userController.getUserRating);

router.post("/profile/image", middleware, upload.single('image'), userController.uploadProfileImageToS3);

router.post("/profile/resume", middleware, upload.single('file'), userController.uploadUserResumeToS3);

// GET USER's WALLET...
router.get("/user/wallet/get", middleware, userController.getUserWallet);



module.exports = router;