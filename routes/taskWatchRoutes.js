const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const employerController = require("../controllers/employerController");
const jobController = require("../controllers/jobController");
const taskWatchController = require("../controllers/taskWatchController");
const middleware = require("../middlewares/authMiddleware")

// start watch
router.post("/watch/:contract_id/start", middleware, taskWatchController.startWatch);

// pause watch..
router.patch("/watch/:contract_id/toggle", middleware, taskWatchController.pauseAndResumeWatch);

// stop watch..
// router.patch("/watch/:contract_id/stop", middleware, taskWatchController.stopWatch);
router.patch("/watch/:contract_id/stop", taskWatchController.stopWatch);

// get all watches lists for a contract...
router.get("/watch/:contract_id/all", middleware, taskWatchController.getWatch);

// get current day watch list...
router.get("/watch/:contract_id/today", middleware, taskWatchController.getCurrentDayWatch);


// Approve time stamps...
router.post("/watch/:watch_id/approve", middleware, taskWatchController.approveTimestamp);

// decline time stamps...
router.post("/watch/:watch_id/decline", middleware, taskWatchController.declineTimestamp);

module.exports = router;
