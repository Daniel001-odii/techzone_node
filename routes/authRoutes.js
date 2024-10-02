const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");

router.get('/', function(req, res){
    return res.status(200).json({ message: 'Apex-tek API is live...'})
})
router.post("/register/user", authController.userSignup);
router.post("/register/employer", authController.employerSignup);
router.post("/login", authController.login);
router.post("/google-auth", authController.googleClientAuthHandler);


router.post("/email/:email/verify", authController.verifyEmail);

router.get("/email/:email/:token/verify/native", authController.verifyEmailNative);

router.post("/email/:email/send", authController.sendEmailVerificationMail)
/* 
**
GOOGLE AUTH ROUTE
**
*/

// Route to initiate Google login
router.get("/auth/google", authController.googleLogin);

// Callback route for Google authentication
router.get("/auth/google/callback", authController.googleCallback);



/*
**
PASSWORD RESET ROUTES
**
*/

router.post("/password/forgot", authController.sendPasswordResetEmail);
router.post("/password/reset", authController.resetPassword);
router.get("/password/:reset_token/check", authController.checkPassResetToken);



// ORDINARY PASSWORD CHECKER FOR CERTAIN APPROVALS
router.post("/password/check", protect, authController.passwordCheck);


/*
**
ADMIN ROUTES
**
*/

router.post("/register/admin", authController.adminSignup);
router.post("/login/admin", authController.adminLogin);
router.post("/OTP/admin", authController.adminOTPTest);
router.post("/email/test", authController.sendTestEmail);
router.post("/admin/new_user/invite", authController.adminRegisterInvite);



module.exports = router;