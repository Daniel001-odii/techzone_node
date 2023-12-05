const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Employer = require("../models/employerModel");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const Notification = require('../models/notificationModel'); // Replace with the correct path





exports.signup = (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Check if required fields are missing
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).send({ message: "All fields are required" });
  }

  // Check if the email is already registered
  User.findOne({ email: email }, (err, existingUser) => {
    if (err) {
      return res.status(500).send({ message: "Internal server error" });
    }

    if (existingUser) {
      return res.status(400).send({ message: "Email is already registered" });
    }

    // Create a new user with the provided data
    const user = new User({
      firstname: firstname,
      lastname: lastname,
      email: email,
      role: 'user',
      password: bcrypt.hashSync(password, 8)
    });

    // Save the new user
    user.save((err, savedUser) => {
      if (err) {
        return res.status(500).send({ message: "User registration failed" });
      }

      // Send a success response
      res.status(200).send({ message: "User registered successfully" });
    });
  });
};




exports.employerSignup = (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Check if required fields are missing
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).send({ message: "All fields are required" });
  }

  // Check if the email is already registered
  Employer.findOne({ email: email }, (err, existingEmployer) => {
    if (err) {
      return res.status(500).send({ message: "Internal server error" });
    }

    if (existingEmployer) {
      return res.status(400).send({ message: "Email is already registered" });
    }

    // Create a new employer with the provided data
    const employer = new Employer({
      firstname: firstname,
      lastname: lastname,
      email: email,
      role: 'employer',
      password: bcrypt.hashSync(password, 8),
    });
    // Save the new employer
    employer.save((err, savedEmployer) => {
      if (err) {
        return res.status(500).send({ message: "Employer registration failed" });
      }

      // Send a success response
      res.status(200).send({ message: "Employer registered successfully" });
    });
  });
};




exports.signin = (req, res) => {
  const { email, password } = req.body;

  // Combine queries for both users and employers
  Promise.all([
    User.findOne({ email }).exec(),
    Employer.findOne({ email }).exec(),
  ])
    .then(([user, employer]) => {
      if (!user && !employer) {
        return res.status(404).send({ message: "User with email Not found." });
      }

      // Determine the role based on which document was found
      const role = user ? user.role : employer.role;



      // Compare passwords and check role
      const passwordIsValid = bcrypt.compareSync(password, user ? user.password : employer.password);

      if (!passwordIsValid) {
        return res.status(401).send({ accessToken: null, message: "Invalid username or Password!" });
      }

      // Sign a token with the appropriate user ID and role
      const userId = user ? user.id : employer.id;
      const token = jwt.sign({ id: userId, role }, process.env.API_SECRET, { expiresIn: 86400 });





      const message = 'You logged into your account now';
      const notification = new Notification({
        recipientId: userId,
        recipientModel: 'User',
        message,
      });
        // Save the notification to the user's/employer's notifications array
      notification.save();
      user.notifications.push(notification);
      user.save();





      // Construct the response based on the role
      const response = {
        user: {
          id: userId,
          email: email,
          role: role, // Include the role in the response
        },
        message: "Login successful",
        accessToken: token,
      };

      res.status(200).send(response);
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};



// Controller for employer sign-in
exports.employerSignin = (req, res) => {
  Employer.findOne({ email: req.body.email })
    .exec((err, employer) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      if (!employer) {
        return res.status(404).send({ message: 'Employer with email not found' });
      }

      // Verify employer's credentials
      const passwordIsValid = bcrypt.compareSync(req.body.password, employer.password);

      if (!passwordIsValid) {
        return res.status(401).send({ accessToken: null, message: 'Invalid username or Password!' });
      }



      // Generate and send the access token for employer
      const token = jwt.sign({ id: employer._id, role: "employer" }, process.env.API_SECRET, {
        expiresIn: 86400,
      });

      res.status(200).send({
        employer: {
          id: employer._id,
          role: "employer",
          email: employer.email,
          // Add other employer data if needed
        },
        message: 'Employer login successful',
        accessToken: token,
      });
    });
};


// Controller to fetch user details using JWT token
exports.getUser = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the user ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the user ID from the token to fetch the user details from the database
    User.findById(decoded.id, (err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      // Send the user details in the response
      res.status(200).send({
        user: {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profile: user.profile,
          saved_jobs: user.savedJobs,
          created: user.created,
          isverified: user.isVerified,
          // Add other user details as needed
        },
      });
    });
  });

  if(req.headers.authorization.split(' ')[1] == undefined || req.headers.authorization.split(' ')[1] == null){
    return res.status(401).send({message: "no authorization headers found.."})
  }
};



// Controller to fetch employer details using JWT token
exports.getEmployer = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the employer ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the employer ID from the token to fetch the employer details from the database
    Employer.findById(decoded.id, (err, employer) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      if (!employer) {
        return res.status(404).send({ message: 'Employer not found' });
      }

      // Send the employer details in the response
      res.status(200).send({
        employer: {
          id: employer._id,
          email: employer.email,
          firstname: employer.firstname,
          lastname: employer.lastname,
          created: employer.created,
          profile: employer.profile,
          isVerified: employer.isVerified,
          // Add other employer details as needed
        },
      });
    });
  });

  if (req.headers.authorization.split(' ')[1] == undefined || req.headers.authorization.split(' ')[1] == null) {
    return res.status(401).send({ message: "No authorization headers found" });
  }
};


exports.getUserOrEmployerById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the ID corresponds to a user
    const user = await User.findById(id);

    if (user) {
      return res.status(200).json({ user });
    }

    // If not, check if the ID corresponds to an employer
    const employer = await Employer.findById(id);

    if (employer) {
      return res.status(200).json({ employer });
    }

    // If neither user nor employer is found, return an error
    return res.status(404).json({ message: 'User or employer not found' });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving user or employer', error: error.message });
  }
};


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
    const resetToken = crypto.randomBytes(3).toString('hex');
    // const ResetLink = `http://localhost:5173`;

    // Set an expiration time for the reset token (e.g., 1 hour)
    const resetTokenExpiration = Date.now() + 3600000; // 1 hour

    // Update the user's document with the reset token and expiration time
    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;

    await user.save();

    // Send an email to the user with a link containing the reset token
   const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., Gmail
    auth: {
      user: 'danielsinterest@gmail.com',
      pass: 'qksdojcrljuxzaso',
    },
  });

  const mailOptions = {
    from: 'danielsinterest@gmail.com',
    to: email,
    subject: 'Techzone Password Reset Request',
    html: `<p>You are receiving this email because you (or someone else) have requested the reset of your account password.</p>
          <p>Please use the OTP to reset your password: <strong>${resetToken}</strong></p>
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
  const { newPassword } = req.body;
  const { resetToken } = req.body;

  try {
    // Find the user by the reset token and ensure it's not expired
    const user = await User.findOne({
      resetToken: resetToken,
      resetTokenExpiration: { $gt: Date.now() }, // Ensure the token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 8);

    // Update the user's password and clear the reset token fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

