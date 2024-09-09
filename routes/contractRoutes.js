const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const employerController = require("../controllers/employerController");
const jobController = require("../controllers/jobController");
const middleware = require("../middlewares/authMiddleware");
const contractController = require("../controllers/contractController");

const checkStatus = require("../middlewares/accountMiddleware")



// route to send contract to user...
router.post("/contracts/:user_id/:job_id/send", middleware, contractController.sendContractOffer);

// route to send job assignment offer
router.post("/contracts/:user_id/:job_id/assign", middleware, contractController.assignJob);

// route to accept offer by user...
router.post("/contracts/accept/:contract_id", middleware, contractController.acceptOffer);

// route to decline offer by user...
router.post("/contracts/decline/:contract_id", middleware, contractController.declineOffer);

// route to get all user and emloyer contracts...
router.get("/contracts", middleware, contractController.getContracts);

// route to get only user completed and active contracts
router.get("/contracts/good/:user_id?", contractController.getCompletedContracts);

// route to get a contract by its ID
router.get("/contracts/:contract_id", contractController.getContractById);

// router.get("/contracts/:contract_id/open", middleware, contractController.getContractById);




// route to mark offer as completed
router.post("/contracts/:contract_id/complete", middleware, contractController.markContractAsComplete);

// route to pause contract
router.post("/contracts/:contract_id/pause", middleware, contractController.pauseContract);

// route to close contract
router.post("/contracts/:contract_id/close", middleware, contractController.closeContract);

// route to close contract
router.post("/contracts/:contract_id/resume", middleware, contractController.resumeContract);


// route to close contract
router.post("/contracts/:contract_id/employer-feedback", middleware, contractController.sendEmployerFeedback);

// route to close contract
router.post("/contracts/:contract_id/user-feedback", middleware, contractController.sendUserFeedback);

// route to edit contract budget...
router.patch("/contracts/:contract_id/budget", middleware, contractController.editContractBudget);




// PAYMENT CONTROLLER WILL HANDLE FUNDING AND PAYMENT STATUS...
router.post("/contracts/:contract_id/fund/", middleware, contractController.fundContract);

router.get("/contracts/funded/all", middleware, contractController.getAllFundedContracts);

// PAYMENT CONTROLLER TO GET A PARTICULAR CONTRACT FUNDING BY ITS ID...
router.get("/contracts/:contract_id/funds/status", contractController.getPurchaseById);


// ROUTE TO GET BANKS LISTS VIA QOREPAY...
router.get("/contracts/banks/list", contractController.getBankListForClient);


// ROUTE TO GET BANKS LISTS...
// router.get("/banks/all", contractController.getBankLists);



// ROUTE TO INITIATE ACTUAL WITHDRAWAL...
router.post("/funds/withdraw", middleware, contractController.withdrawFunds)

router.post("/payout/test", contractController.createNewPayoutAPI);
router.post("/payout/fund_release", contractController.releaseFundsAPI);

// SEND USER FEEDBACK
// SEND EMPLOYER FEEDBACK
// EDIT CONTRACT [HAS NOTIFICATION]\// EDIT CONTRACT [HAS NOTIFICATION]









module.exports = router;