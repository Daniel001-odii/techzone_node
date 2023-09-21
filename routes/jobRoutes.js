// routes/jobRoutes.js

const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authJWT'); 

// Authentication middleware for checking user roles


// const roleMiddleware = require('../middleware/roleMiddleware');

// Route for posting a job (only accessible by employers)
// router.post('/post-job', roleMiddleware('employer'), jobController.postJob);


// Route for posting a job (only accessible by authenticated users)
router.post('/jobs', authMiddleware, jobController.postJob);



// Route for posting a job (for employers)
// router.post('/post-job', authMiddleware, jobController.postJob);



// Route for listing jobs (for users)
router.get('/jobs', jobController.listJobs);

module.exports = router;