const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const Employer = require("../models/employerModel"); // Correct the import for Employer model
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(
  {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_CALLBACK,
  }
)


  


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
            const newUser = new User({
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 8)
            });

            await newUser.save();
            res.status(200).send({ message: "User registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "User registration failed!" });
    }
}

// employer signup....
exports.employerSignup = async (req, res) => {
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
            const newEmployer = new Employer({
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 8)
            });

            await newEmployer.save();
            res.status(200).send({ message: "Employer registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "Employer registration failed!" });
    }
}

exports.login = async (req, res) => {
    console.log("login detected...");
    try {
        const { email, password } = req.body;

        Promise.all([
            User.findOne({ email }).exec(),
            Employer.findOne({ email }).exec(),
        ])
        .then(([user, employer]) => {
            if (!user && !employer) {
                return res.status(404).send({ message: "User with email not found" });
            }

            // Determine user's role
            const role = user ? 'user' : 'employer';

            if(role == 'user'){
                // Check if the user has a password (not a Google-authenticated user)
                const hasPassword = user && user.provider != 'google';

                // Compare password only if the user has a password
                const isValidPassword = hasPassword && bcrypt.compareSync(password, user.password);

                if (!isValidPassword) {
                    return res.status(401).send({ message: "Invalid username or password" });
                }
            } else if (role == 'employer'){
                // Check if the user has a password (not a Google-authenticated user)
                const hasPassword = employer && employer.provider != 'google';

                // Compare password only if the user has a password
                const isValidPassword = hasPassword && bcrypt.compareSync(password, employer.password);

                if (!isValidPassword) {
                    return res.status(401).send({ message: "Invalid employer username or password" });
                }
            }
            

            // Assign user/employer id to response and generate token
            const userId = user ? user.id : employer.id;
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
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Login failed" });
    }
};


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
                const token = jwt.sign({ googleId, role: user.role }, process.env.API_SECRET, { expiresIn: '1d' });

                // Respond with the token and user information
                res.status(200).json({
                    message: 'Sign-in successful',
                    token,
                    role: user.role,
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
                        firstname,
                        lastname,
                        provider: "google",
                        profile: { image_url: picture },
                    });

                    // Save the new user to the "User" model
                    await newUser.save();

                    // Generate JWT token for authentication
                    const token = jwt.sign({ googleId, role: "user" }, process.env.API_SECRET, { expiresIn: '1d' });

                    res.status(200).json({
                        message: "User registered successfully",
                        token,
                        role: "user",
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

                    res.status(200).json({
                        message: "User registered successfully",
                        token,
                        role: "employer"
                    });
                } 
                if(!role){
                    console.log("user with email not found, email registered as user account");
                    const newUser = new User({
                        googleId,
                        email,
                        firstname,
                        lastname,
                        provider: "google",
                        profile: { image_url: picture },
                        // role,
                    });

                    await newUser.save();
                    // Generate JWT token for authentication
                    const token = jwt.sign({ googleId, role: "user" }, process.env.API_SECRET, { expiresIn: '1d' });
                    res.status(200).json({
                        message: "User registered successfully",
                        token,
                        role: "user",
                    });
            }
                
                // Log in the new user
                // console.log('New user logged in:', newUser);
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


//controller for passsworddd reset email....
exports.sendPasswordResetEmail = async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find the user by their email address
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Generate a unique reset token
    const resetToken = crypto.randomBytes(8).toString('hex');
        // const resetToken = Math.floor(100000 + Math.random() * 900000);
  
      // Set an expiration time for the reset token (e.g., 1 hour)
    const resetTokenExpiration = Date.now() + 3600000; // 1 hour
  
      // Update the user's document with the reset token and expiration time
      user.pass_reset_token = resetToken;
      user.pass_reset_expiry = resetTokenExpiration;
  
      await user.save();
  
      // Send an email to the user with a link containing the reset token
     const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'danielsinterest@gmail.com',
        pass: 'qdjctvwagyujlqyg',
      },
    });
  
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
        res.status(200).json({ message: 'Password reset email sent' });
      });


    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

  
exports.resetPassword = async (req, res) => {
    const { new_password } = req.body;
    const { reset_token } = req.body;

    try {
        // Find the user by the reset token and ensure it's not expired
        const user = await User.findOne({ pass_reset_token: reset_token, pass_reset_expiry: { $gt: Date.now() }, // Ensure the token is not expired
        });

        if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 8);

        // Update the user's password and clear the reset token fields
        user.password = hashedPassword;
        user.pass_reset_token = undefined;
        user.pass_reset_expiry = undefined;

        await user.save();

        const mailOptions = {
            from: 'danielsinterest@gmail.com',
            to: user.email,
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


        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
  
  

