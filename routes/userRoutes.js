const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const jobController = require("../controllers/jobController")
const middleware = require("../middlewares/authMiddleware")


router.get("/user", middleware,  userController.getUser);

router.get("/user/:id", userController.getUserOrEmployerById);

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

module.exports = router;