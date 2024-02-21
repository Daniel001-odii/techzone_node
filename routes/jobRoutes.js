const express = require("express");
const router = express.Router();
const middleware = require("../middlewares/authMiddleware");
const jobController = require("../controllers/jobController");



// post a job (for employers only)
router.post("/jobs", middleware, jobController.postJob);

// get job in details...
router.get("/jobs/:job_id", jobController.getJobById);

// jod editing route...
router.put("/jobs/:job_id", middleware, jobController.editJob);

// list job based on user preferences...
router.get("/jobs", middleware, jobController.listJobs);

// save a job (for users only)
router.post("/jobs/:job_id/save", middleware, jobController.saveJob);

// apply for a job
router.post("/jobs/:job_id/apply", middleware, jobController.submitApplicationMain);





module.exports = router;