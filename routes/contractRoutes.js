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
router.post("/contracts/accept/:contract_id", middleware, contractConttroller.acceptOffer);

// route to decline offer by user...
router.post("/contracts/decline/:contract_id/", middleware, contractConttroller.declineOffer);

// route to mark offer as completed
router.post("/contracts/complete/:contract_id/", middleware, contractConttroller.markContractAsComplete);

// route to pause contract
router.post("/contracts/pause/:contract_id/", middleware, contractConttroller.pauseContract);

// route to close contract
router.post("/contracts/close/:contract_id/", middleware, contractConttroller.closeContract);

// route to get all user and emloyer contracts...
router.get("/contracts", middleware, contractConttroller.getContracts);

// route to get a contract by its ID
router.get("/contracts/:contract_id", middleware, contractConttroller.getContractById);

// PAYMENT CONTROLLER WILL HANDLE FUNDING AND PAYMENT STATUS

// SEND USER FEEDBACK
// SEND EMPLOYER FEEDBACK
// EDIT CONTRACT [HAS NOTIFICATION]\// EDIT CONTRACT [HAS NOTIFICATION]

module.exports = router;