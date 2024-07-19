const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Import the Employer model
// const Administrator = require("../models/adminModel");


const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token || req.headers.authorization.split(" ")[0] !== "JWT") {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.API_SECRET);

    console.log("found a role: ", decoded.role);

    if (decoded.role === "user") {
      const user = await User.findById(decoded.id) || await User.findOne({ googleId: decoded.googleId });
      console.log(" user data: ", user)
      if (!user) {
        return res.status(401).json({ message: 'Invalid token. User not found' });
      }

      req.user = user;
      req.userId = user._id;
    } else if (decoded.role === "employer") {
      const employer = await Employer.findById(decoded.id) || await Employer.findOne({ googleId: decoded.googleId });
      console.log(" employer data: ", employer)

      if (!employer) {
        return res.status(401).json({ message: 'Invalid token. Employer not found' });
      }

      req.employer = employer;
      req.employerId = decoded.id;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // Handle JWT-specific errors
      return res.status(401).json({ message: 'Invalid token. Malformed JWT' });
    } else {
      // Handle other errors
      console.error("Unauthorized...", error);
      res.status(401).json({ message: "Unauthorized", error });
    }
  }
};







module.exports = verifyToken;

