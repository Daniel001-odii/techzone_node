const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
const adminMiddleware = require("../middlewares/adminAuthMiddleware")
const adminController = require("../controllers/adminController");

// route to get all user and emloyer contracts...
// please add middleware for admins....

router.get("/data", adminMiddleware, adminController.getAdmin);

router.get("/count/all", adminMiddleware, adminController.getAllRecordsCount);

router.get("/contracts/all", adminMiddleware, adminController.getAllContracts);

// ADMIN >>>
router.get("/employers/all", adminMiddleware, adminController.getAllEmployers);
router.get("/admins/all", adminMiddleware, adminController.getAdminUsers);

// ADMIN...
router.get("/users/all", adminMiddleware, adminController.getAllUsers);

// EARLY USERS
router.get("/early_users/all", adminMiddleware, adminController.getAllEarlyUsers);

router.post("/bulk_email", adminMiddleware, adminController.sendBulkEmail);

module.exports = router;