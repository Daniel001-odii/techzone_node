const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const employerController = require("../controllers/employerController");
const jobController = require("../controllers/jobController")
const middleware = require("../middlewares/authMiddleware")


router.post("/employer/:user_id/save-user", middleware, employerController.saveUser);
router.get("/employer/jobs", middleware, employerController.getJobsByEmployer);
router.get("/employer/jobs/:job_id/applications", middleware, jobController.getApplicationsForJob);

router.get("/employer/users/saved", middleware, employerController.getEmployerSavedUsers);

router.get("/employer/contracts/completed", middleware, employerController.getCompletedContracts);

router.patch("/employer/profile/update", middleware, employerController.updateEmployerData)




module.exports = router;
