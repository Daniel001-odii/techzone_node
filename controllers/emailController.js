const User = require('../models/userModel');
const Employer = require('../models/employerModel');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Function to generate a unique token
function generateUniqueToken() {
  // Generate a random buffer of a specific length (e.g., 32 bytes)
  const tokenBuffer = crypto.randomBytes(32);
  // Convert the buffer to a hexadecimal string
  const token = tokenBuffer.toString('hex');
  return token;
}



exports.sendVerificationEmail = async (req, res) => {
    try {
      const { email, userType } = req.body;
      
      // Generate a unique verification token (you can use libraries like `crypto` for this)
      const verificationToken = generateUniqueToken();
      
      // Define the user model based on the userType
      const userModel = userType === 'employer' ? Employer : User;
  
      // Update the user's record in the database with the verification token
      const user = await userModel.findOneAndUpdate(
        { email },
        { verificationToken }
      );
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Construct the verification link
      const verificationLink = `${process.env.LOCAL_URL}/api/verify-email/${verificationToken}`;
  
      // Send the verification email to the user's email address
      const transporter = nodemailer.createTransport({
        service: 'gmail', // e.g., Gmail
        auth: {
          user: 'danielsinterest@gmail.com',
          pass: 'qksdojcrljuxzaso',
        },
      });
  
      const mailOptions = {
        from: 'deoscomputers@gmail.com',
        to: user.email,
        subject: 'Techzone Email Verification',
        text: `Click the following link to verify your email: ${verificationLink}`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error sending verification email' });
        } else {
          console.log('Email sent: ' + info.response);
          return res.status(200).json({ message: 'Verification email sent successfully' });
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error sending verification email' });
    }
  };
  


exports.verifyEmail = async (req, res) => {
    const { token } = req.params;
  
    try {
      // Find the user or employer with the provided verification token
      const user = await User.findOne({ verificationToken: token });
      const employer = await Employer.findOne({ verificationToken: token });
  
      if (!user && !employer) {
        return res.status(404).json({ message: 'Verification token not found' });
      }
  
      if (user) {
        // Mark the user's email as verified
        user.isVerified = true;
        user.verificationToken = null; // Clear the verification token
        await user.save();
      }
  
      if (employer) {
        // Mark the employer's email as verified
        employer.isVerified = true;
        employer.verificationToken = null; // Clear the verification token
        await employer.save();
      }
  
      return res.status(200).json({ message: 'Email verification successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error verifying email' });
    }
  };
  