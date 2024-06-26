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


router.post("/email/:email/verify", authController.verifyEmail);

/*
**
PASSWORD RESET ROUTES
**
*/

router.post("/password/forgot", authController.sendPasswordResetEmail);

router.post("/password/reset", authController.resetPassword);

router.get("/password/:reset_token/check", authController.checkPassResetToken);

/*
**
ADMIN ROUTES
**
*/

router.post("/register/admin", authController.adminSignup);

router.post("/login/admin", authController.adminLogin);

router.post("/OTP/admin", authController.adminOTPTest);




module.exports = router;