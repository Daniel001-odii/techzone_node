// routes/jobRoutes.js

const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authJWT'); 
const verifyToken = require('../middleware/authJWT');

// Authentication middleware for checking user roles


// const roleMiddleware = require('../middleware/roleMiddleware');

// Route for posting a job (only accessible by employers)
// router.post('/post-job', roleMiddleware('employer'), jobController.postJob);


// Route for posting a job (only accessible by authenticated users)
router.post('/jobs', authMiddleware, jobController.postJob);

// Route for listing jobs (for users)
router.get('/jobs', jobController.listJobs);

// Route for assigning jobs to users
router.post('/assignJob', verifyToken, jobController.assignJob);

// Define the route for getting saved jobs and apply the verifyToken middleware
router.get('/savedJobs', verifyToken, jobController.getSavedJobs);

// Define the route for searching jobs
router.get('/search', jobController.searchJobs);



module.exports = router;