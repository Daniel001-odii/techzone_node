const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const userController = require("../controllers/userController");
const secure = require("../middlewares/authMiddleware");

// WALLET ROUTE CODES GOES HERE...

// controller to get user wallet...
router.get("/info", secure, walletController.getUserWallet);

// get wallet transactions....
router.get("/transactions", secure, walletController.getWalletTransactions);


module.exports = router;

