const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const Employer = require("../models/employerModel"); // Correct the import for Employer model
const Wallet = require("../models/walletModel");



const Admin = require('../models/adminModel');

const sendEmail = require("../utils/email");


const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(
  {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_CALLBACK,
  }
)


function hashPassword(password) {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');

    // Hash the password with SHA-256 and the salt
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');

    // Return the hashed password along with the salt
    return {
        hash: hashedPassword,
        salt: salt
    };
}


// Function to compare provided password with hashed password
function comparePasswords(providedPassword, storedHash, salt) {
    // Hash the provided password with the stored salt
    const hashedPassword = crypto.pbkdf2Sync(providedPassword, salt, 1000, 64, 'sha256').toString('hex');

    // Compare the hashed passwords
    return storedHash === hashedPassword;
};


/*
**
EMAIL CONCERNED CONTROLLERS
**/

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'danielsinterest@gmail.com',
      pass: 'qdjctvwagyujlqyg',
    },
});



// user signup....
exports.userSignup = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Check if required fields are missing
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        const existingEmployer = await Employer.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'The email has already been registered as a user' });
        } else if (existingEmployer) {
            return res.status(400).json({ message: 'The email has already been registered as an employer' });
        } else {
            // create new user...
            const newUser = new User({
                firstname,
                lastname,
                email,
                password
            });
            await newUser.save();

            // create new wallet for user...
            const userWallet = new Wallet({
                user: newUser._id,
            })

            await userWallet.save();

            
            //   SEND EMAIL HERE >>>>            
            const recipient = email;
            const subject = "Welcome to ApexTeks!";
            const template = "welcome";
            const context = { firstname, lastname };
            
            await sendEmail(recipient, subject, null, null, template, context);

            res.status(200).send({ message: "User registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "User registration failed!" });
        console.log("error registering user: ", error);
    }
}

// employer signup....
exports.employerSignup = async (req, res) => {
    try {
        const { firstname, lastname, email, password, company_name } = req.body;

        // Check if required fields are missing
        if (!firstname || !lastname || !email || !password || !company_name) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        const existingEmployer = await Employer.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'this email is already registered!' });
        } else if (existingEmployer) {
            return res.status(400).json({ message: 'this email is already registered!' });
        } else {
            const newEmployer = new Employer({
                firstname,
                lastname,
                email,
                password,
                profile: { 
                    company_name: company_name 
                },
            });

            await newEmployer.save();
            //   SEND EMAIL HERE >>>>            
            const recipient = email;
            const subject = "Welcome to ApexTeks!";
            const template = "welcome";
            const context = { firstname, lastname };
            
            // await sendEmail(recipient, subject, null, null, template, context);

            res.status(200).send({ message: "Employer registered successfully!" });
        }
    } catch (error) {
        console.log("error registering employer: ", error)
        res.status(500).send({ message: "Employer registration failed!" });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }) || await Employer.findOne({ email });

        // Check if user exists and password is correct
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials provided' });
        };

        // Assign user/employer id to response and generate token
            const userId = user._id;
            const role = user.role;
            const token = jwt.sign({ id: userId, role }, process.env.API_SECRET, { expiresIn: '1d' });

            // Send a response
            const response = {
                user: {
                    id: userId,
                    email: email,
                    role: role,
                },
                message: "Login Successful",
                accessToken: token,
            };

            res.status(200).send(response);

            // NOTIFY USER HERE >>>
            const newNotification = new Notification({
                receiver: "both",
                user: userId,
                employer: userId,
                message: `New signin alert`
            });
            newNotification.save();

    } catch (error) {
        console.log("error during login: ", error);
        res.status(500).send({ message: "Login failed" });
    }
};

exports.verifyEmail = async (req, res) => {
    try{
        const email = req.params.email;
        const user = await User.findOne({ email });
        const employer = await Employer.findOne({ email });

        if(!user && !employer){
            return res.status(404).json({ success: false, message: "no user or employer record with email found"});
        }

        if(user){
            if(user.email_verified){
                return res.status(201).json({ success: true, message: "Email already verified, please login"})
            }
            user.email_verified = true;
            await user.save();
            return res.status(201).json({ success: true, message: "Email verified successfully, please login"})
        }
        else if(employer){
            if(employer.email_verified){
                return res.status(201).json({ success: true, message: "Email already verified, please login"})
            }
            employer.email_verified = true;
            await employer.save();
            return res.status(201).json({ success: true, message: "Email verified successfully, please login"})
        }
        // user.email
    }catch(error){
        res.status(500).json({ success: false, message: "internal server error"});
        console.log("error verifying email: ", error);
    }
}


// Call this function to validate OAuth2 authorization code sent from client-side
async function verifyCode(code) {
    let { tokens } = await client.getToken(code)
    client.setCredentials({ access_token: tokens.access_token })
    const userinfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    })
    return userinfo.data
  }


// this function checks for exisitng users and is utitlized by the googleClientAuthHandler below...
const findExistingUser = async ({ googleId, email }) => {
    // Check "User" model
    const existingUserInUserModel = await User.findOne({ googleId, email });

    if (existingUserInUserModel) {
        return { model: 'User', user: existingUserInUserModel };
    }

    // Check "Employer" model
    const existingUserInEmployerModel = await Employer.findOne({ googleId, email });

    if (existingUserInEmployerModel) {
        return { model: 'Employer', user: existingUserInEmployerModel };
    }

    // User not found in either model
    return null;
};


// Call this function to validate OAuth2 authorization code sent from client-side
exports.googleClientAuthHandler = async (req, res) => {
    try {
        const authCodeFromClient = req.body;
        const role = authCodeFromClient.role;

        console.log("code from client: ", authCodeFromClient);

        try {
            // Verify code from client using google..
            const userInfo = await verifyCode(authCodeFromClient.code);

            const { sub: googleId, given_name: firstname, family_name: lastname, email, picture } = userInfo;

            // Check if user already exists in either "User" or "Employer" model
            const existingUserResult = await findExistingUser({ googleId, email });

            if (existingUserResult) {
                const { model, user } = existingUserResult;

                // Generate JWT token for authentication
                // const token = jwt.sign({ googleId, role: user.role }, process.env.API_SECRET, { expiresIn: '1d' });
                const token = jwt.sign({ id: user._id, role: user.role }, process.env.API_SECRET, { expiresIn: '1d' });

                console.log("see user: ", user)

                // Respond with the token and user information
                res.status(200).json({
                    message: 'Sign-in successful',
                    token,
                    role: user.role,
                    user,
                });

                // NOTIFY USER HERE >>>
                const newNotification = new Notification({
                    receiver: "both",
                    user: user._id,
                    employer: user._id,
                    message: `New google signin alert`
                });
                await newNotification.save();
                
            } else {
                console.log("new user record!");

                // check user role from request and create new user based on the defined role...
                if(role == "user"){
                    // Create a new user in the "User" model
                    const newUser = new User({
                        googleId,
                        email,
                        // firstname,
                        // lastname,
                        provider: "google",
                        // profile: { image_url: picture },
                    });

                    // Save the new user to the "User" model
                    await newUser.save();

                    // Generate JWT token for authentication
                    const token = jwt.sign({ googleId, role: "user" }, process.env.API_SECRET, { expiresIn: '1d' });


                    //   SEND EMAIL HERE >>>>
                    const mailOptions = {
                        from: 'danielsinterest@gmail.com',
                        to: newUser.email,
                        subject: 'Welcome to Apex-tek',
                        html: `<p>we are so happy to have you here, we founded Apek-tek because we wanted you to have a trusted place where you as a talent gets to work with employers without much hassles. welcome to the family!</p>`
                    };
                    
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('Error sending email:', error);
                            return res.status(500).json({ message: 'Failed to send welcome email' });
                        }
                    
                        console.log('welcome email sent:', info.response);
                        res.status(200).json({ message: 'welcome email sent' });
                    });

                    res.status(200).json({
                        message: "User registered successfully",
                        token,
                        role: "user",
                        newUser,
                    });

                } else if(role == "employer"){
                    // Create a new user in the "User" model
                    const newUser = new Employer({
                        googleId,
                        email,
                        firstname,
                        lastname,
                        provider: "google",
                        profile: { image_url: picture },
                    });

                    // Save the new user to the "User" model
                    await newUser.save();

                    // Generate JWT token for authentication
                    const token = jwt.sign({ googleId, role: "employer" }, process.env.API_SECRET, { expiresIn: '1d' });

                    //   SEND EMAIL HERE >>>>
                    const mailOptions = {
                        from: 'danielsinterest@gmail.com',
                        to: newUser.email,
                        subject: 'Welcome to Apex-tek',
                        html: `<p>we are so happy to have you here, we founded Apek-tek because we wanted you to have a trusted place where you as an employer gets to meet talents who are willing to work on your projects and contracts without much hassles. welcome to the family!</p>`
                    };
                    
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('Error sending email:', error);
                            return res.status(500).json({ message: 'Failed to send welcome email' });
                        }
                    
                        console.log('welcome email sent:', info.response);
                        res.status(200).json({ message: 'welcome email sent' });
                    });


                    res.status(200).json({
                        message: "User registered successfully",
                        token,
                        role: "employer",
                        newUser
                    });
                } 
                if(!role){
                    console.log("user with email not found, email registered as user account");
                    res.status(404).json({ message: "Email not registered with any account please signup!"});
            }
                
            }
        } catch (error) {
            // Validation failed, and user info was not obtained
            console.log(error);
            res.status(400).json({ error: 'Invalid authorization code' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




//controller for passsworddd reset email....
exports.sendPasswordResetEmail = async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by their email address
        const user = await User.findOne({ email });
        const employer = await Employer.findOne({ email });

        // Check if either user or employer exists
        if (!user && !employer) {
            return res.status(404).json({ message: 'Password reset information would be sent if your email exist in our record' });
        }

        // Choose the document to update based on which one was found
        const foundDocument = user || employer;

        // Generate a unique reset token
        const resetToken = crypto.randomBytes(8).toString('hex');
        // const resetToken = Math.floor(100000 + Math.random() * 900000);

        // Set an expiration time for the reset token (e.g., 1 hour)
        const resetTokenExpiration = Date.now() + 3600000; // 1 hour

        // Update the found document's fields with the reset token and expiration time
        foundDocument.pass_reset.token = resetToken;
        foundDocument.pass_reset.expiry_date = resetTokenExpiration;

        await foundDocument.save();

        // SEND EMAIL HERE >>>>
        const recipient = email;
        const subject = "Apex-tek Password Reset Request";
        const template = "passReset";
        const context = { resetToken: resetToken, root_url: process.env.GOOGLE_CALLBACK};

        await sendEmail(recipient, subject, null, null, template, context);
        res.status(200).json({ message: 'Password reset information would be sent if your email exist in our record' });

        /* OLD EMAIL PATTERN
        const mailOptions = {
            from: 'danielsinterest@gmail.com',
            to: email,
            subject: 'Apex-tek Password Reset Request',
            html: `<p>You are receiving this email because you (or someone else) have requested the reset of your account password.</p>
            <p>Please click <a href="${process.env.GOOGLE_CALLBACK}/user/${resetToken}/password">this link</a> to securely reset your password/p>
            <p>If you did not request this, please ignore this email, and your password will remain unchanged.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send reset email' });
            }

            console.log('Reset email sent:', info.response);
            res.status(200).json({ message: 'Password reset information would be sent if your email exist in our record' });
        });
        */


    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

  

  
exports.resetPassword = async (req, res) => {
    const { new_password, reset_token } = req.body;

    try {
        // Find the user by the reset token and ensure it's not expired
        const user = await User.findOne({ 
            'pass_reset.token': reset_token,
            'pass_reset.expiry_date': { $gt: new Date() } 
        });
        const employer = await Employer.findOne({  
            'pass_reset.token': reset_token,
            'pass_reset.expiry_date': { $gt: new Date() } 
        });

        // Check if either user or employer exists
        if (!user && !employer) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Choose the document to update based on which one was found
        const foundDocument = user || employer;

        // Hash the new password
        const hashed_password = hashPassword(new_password);

        // Update the document's password and clear the reset token fields
        foundDocument.password = hashed_password;
        foundDocument.pass_reset.token = undefined;
        foundDocument.pass_reset.expiry_date = undefined;

        await foundDocument.save();

        // NOTIFY USER HERE >>>
        const receiver = user ? "user" : "employer";
        const newNotification = new Notification({
            receiver,
            user,
            employer: employer ? req.employerId : null,
            message: "You Successfully Changed Your password"
        });
        await newNotification.save();

        // SEND RESET SUCCESS EMAIL HERE >>>>
        const mailOptions = {
            from: 'danielsinterest@gmail.com',
            to: foundDocument.email,
            subject: 'Apex-tek Password Reset Success',
            html: `<p>You successfully reset your password!</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send reset email' });
            }

            console.log('Reset email sent:', info.response);
            res.status(200).json({ message: 'Password reset email sent' });
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.checkPassResetToken = async (req, res) => {
   
    const reset_token = req.params.reset_token;
    // console.log("reset toke from client: ", reset_token);
    try{
        
        const user = await User.findOne({ 
            'pass_reset.token': reset_token,
            'pass_reset.expiry_date': { $gt: new Date() } 
        });
        const employer = await Employer.findOne({  
            'pass_reset.token': reset_token,
            'pass_reset.expiry_date': { $gt: new Date() } 
        });

        // Check if either user or employer exists
        if (!user && !employer) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        } else {
            res.status(200).json({ message: "reset token is valid"});
        }


    }catch(error){
        res.status(500).json({ message: "internal server error"});
        console.log("error checking reset token: ", error);
    }
}

/*
**
* ADMINISTRATIVE CONTROLLERS
**
*/

// employer signup....
exports.adminSignup = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Check if required fields are missing
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        const existingEmployer = await Employer.findOne({ email });
        const exisitingAdmin = await Admin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'The email has already been registered as a user' });
        } else if (existingEmployer) {
            return res.status(400).json({ message: 'The email has already been registered as an employer' });
        }else if (exisitingAdmin) {
            return res.status(400).json({ message: 'The email has already been registered as an administrator' });
        }
         else {
            const newAdmin = new Admin({
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 8)
            });

            await newAdmin.save();


            res.status(200).send({ message: "Admin registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "Admin registration failed!" });
        console.log("error registering admin: ", error)
    }
};



exports.adminLogin = async (req, res) => {
    console.log("login detected...");
    try {
        const { email, password } = req.body;
        const user = await Admin.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Compare password only if the user has a password
        const isValidPassword = bcrypt.compareSync(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // assign user ID
        const userId = user._id;

        // Determine user's role
        let roleSpecificData = {};
        if (user.role === 'admin') {

        } else if (user.role === 'manager') {
            // Populate as needed for manager
        } else if (user.role === 'moderator') {
            // Populate as needed for moderator
        } else if (user.role === 'team-lead') {
            // Populate as needed for team lead
        } else if (user.role === 'team-member') {
            // Populate as needed for team member
        }

        const token = jwt.sign({ id: userId, role: user.role }, process.env.API_SECRET, { expiresIn: process.env.TOKEN_EXPIRY || '1d' });

        // Send a response
        const response = {
            user: {
                id: userId,
                email: email,
                role: user.role,
                ...roleSpecificData // Merge role specific data
            },
            token,
            message: "One time password sent"
        };
        res.status(200).json(response);

        // Notify user
        const newNotification = new Notification({
            receiver: "user",
            user: userId,
            message: `New Admin signin alert`
        });
        await newNotification.save();


        if (user.role === 'admin') {
            // send 2FA email for admin login...
            // Generate a unique reset token (6-digit random number)
            const login_code = Math.floor(100000 + Math.random() * 900000);

            // Set an expiration time for the reset token (e.g., 1 hour)
            const login_code_expiration = Date.now() + 3600000; // 1 hour

            // Update the user's document with the reset token and expiration time
            user.login_code = login_code;
            user.login_code_expiration = login_code_expiration;

            await user.save();
                //   SEND EMAIL HERE >>>>
                const mailOptions = {
                    from: 'danielsinterest@gmail.com',
                    to: email,
                    subject: 'Apex-tek Administrator Login',
                    html: `<p>You are receiving this email because you (or someone else) is trying to login into your account.</p>
                        <p>Please use this code as your OTP <strong> ${login_code}</strong> </p>
                        <p>If you did not request this, please ignore this email.</p>`
                };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ message: 'Failed to send login email' });
                }
            
                console.log('login email sent:', info.response);
                res.status(200).json({ message: 'login email sent' });
                });
        }
    }
    catch(error){
        console.error("Error logging in as admin: ", error);
        res.status(500).json("Internal server error");
    }
};

exports.adminOTPTest = async (req, res) => {
    const { login_code } = req.body;

    console.log("from client: ", login_code);

    try{
        // Find the user by the reset token and ensure it's not expired        
        const admin = await Admin.findOne({ login_code, login_code_expiration: { $gt: Date.now() },});

        if (!admin) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        admin.login_code = undefined;
        admin.login_code_expiration = undefined;
        admin.save();
;
        res.status(200).json({ message: "Login Successful!"})

    }catch(error){
        console.log("error accepting OTP: ", error);
        res.status(500).json({ message: "internam server error"});
    }
}

  

