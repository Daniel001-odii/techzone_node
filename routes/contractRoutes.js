const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const employerController = require("../controllers/employerController");
const jobController = require("../controllers/jobController");
const middleware = require("../middlewares/authMiddleware");
const contractConttroller = require("../controllers/contractController");



// route to send contract to user...
router.post("/contracts/:user_id/:job_id/send", middleware, contractConttroller.sendContractOffer);

// route to send job assignment offer
router.post("/contracts/:user_id/:job_id/assign", middleware, contractConttroller.assignJob);

// route to accept offer by user...
router.post("/contracts/accept/:contract_id", middleware, contractConttroller.acceptOffer);

// route to decline offer by user...
router.post("/contracts/decline/:contract_id", middleware, contractConttroller.declineOffer);

// route to get all user and emloyer contracts...
router.get("/contracts", middleware, contractConttroller.getContracts);

// route to get only user completed and active contracts
router.get("/contracts/good/:user_id?", contractConttroller.getCompletedContracts);

// route to get a contract by its ID
router.get("/contracts/:contract_id", middleware, contractConttroller.getContractById);




// route to mark offer as completed
router.post("/contracts/:contract_id/complete", middleware, contractConttroller.markContractAsComplete);

// route to pause contract
router.post("/contracts/:contract_id/pause", middleware, contractConttroller.pauseContract);

// route to close contract
router.post("/contracts/:contract_id/close", middleware, contractConttroller.closeContract);

// route to close contract
router.post("/contracts/:contract_id/resume", middleware, contractConttroller.resumeContract);


// route to close contract
router.post("/contracts/:contract_id/employer-feedback", middleware, contractConttroller.sendEmployerFeedback);

// route to close contract
router.post("/contracts/:contract_id/user-feedback", middleware, contractConttroller.sendUserFeedback);


/*
**
**  ADMNISTRATIVE ENDPOINTS
**
*/
// route to get all user and emloyer contracts...
// please add middleware for admins....
router.get("/contracts/all", contractConttroller.getAllContracts);





// PAYMENT CONTROLLER WILL HANDLE FUNDING AND PAYMENT STATUS

// SEND USER FEEDBACK
// SEND EMPLOYER FEEDBACK
// EDIT CONTRACT [HAS NOTIFICATION]\// EDIT CONTRACT [HAS NOTIFICATION]

module.exports = router;