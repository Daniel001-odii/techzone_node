const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.get('/', function(req, res){
    return res.status(200).json({ message: 'Apex-tek API is live...'})
})
router.post("/register/user", authController.userSignup);
router.post("/register/employer", authController.employerSignup);
router.post("/login", authController.login);
router.post("/google-auth", authController.googleClientAuthHandler);

module.exports = router;