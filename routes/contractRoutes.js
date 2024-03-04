const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const employerController = require("../controllers/employerController");
const jobController = require("../controllers/jobController");
const middleware = require("../middlewares/authMiddleware");
const contractConttroller = require("../controllers/contractController");



// route to send contract to user...
router.post("/contracts/:user_id/:job_id/send", middleware, contractConttroller.sendContractOffer);

// route to accept offer by user...
router.post("/contracts/accept/:job_id", middleware, contractConttroller.acceptOffer);

// route to decline offer by user...
router.post("/contracts/decline/:job_id/", middleware, contractConttroller.declineOffer);

// route to get all user and emloyer contracts...
router.get("/contracts", middleware, contractConttroller.getContracts);

// controllers for
// CLOSE CONTRACT [HAS NOTIFICATION]
// COMPLETE CONTRACT [HAS NOTIFICATION]
// PAUSE CONTRACT [HAS NOTIFICATION]

// PAYMENT CONTROLLER WILL HANDLE FUNDING AND PAYMENT STATUS

// SEND USER FEEDBACK
// SEND EMPLOYER FEEDBACK
// EDIT CONTRACT [HAS NOTIFICATION]\// EDIT CONTRACT [HAS NOTIFICATION]

module.exports = router;