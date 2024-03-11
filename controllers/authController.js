const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Correct the import for Employer model
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(
  {
    clientId: '546104205241-g4vtopr689l3vb5cfjmphard09e1ia2k.apps.googleusercontent.com',
    clientSecret: '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',
    // redirectUri: 'http://localhost:8080'
    redirectUri: 'https://tech-zone-navy.vercel.app'
    
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
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Login failed" });
    }
};


// HANDLE USER LOGIN WITH GOOGLE...
exports.googleAuthHandler = async (req, res) => {
    try{
      const { googleId, email, firstname, lastname, picture } = req.body;
  
      const existingUser = await User.findOne({ googleId });
  
      // IF GOOGLE USER IS ALREADY EXISITNG....
      if(existingUser){
         // Generate JWT token for authentication
      const token = jwt.sign({ googleId:googleId }, process.env.API_SECRET, { expiresIn: '1d' });
  
      // Respond with the token and user information
      res.status(200).json({
        message: 'Sign-in successful',
        token,
        user: {
          firstname: firstname,
          lastname: lastname,
          email: email,
          googleId: googleId
        }
      });
      }
      // IF GOOGLE USER NOT EXISTING......
      else{
  
        const newUser = new User({
          googleId: googleId,
          email: email,
          firstname: firstname,
          lastname: lastname,
          provider: "google",
          avatar_url: picture,
        });
  
        await newUser.save();
  
        res.status(200).json({
          message: "user registered successfully",
          newUser
        });
         // Log in the new user
        console.log('New user logged in:', newUser);
      }
  
    }
    catch(error){
      console.error(error)
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
                    user: {
                        firstname,
                        lastname,
                        email,
                        googleId,
                        model, // Include the model information in the response
                    }
                });
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
                        // role,
                    });

                    // Save the new user to the "User" model
                    await newUser.save();

                    res.status(200).json({
                        message: "User registered successfully",
                        newUser
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
                        // role,
                    });

                    // Save the new user to the "User" model
                    await newUser.save();

                    res.status(200).json({
                        message: "User registered successfully",
                        newUser
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


