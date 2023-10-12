const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Import the Employer model

const verifyToken = async (req, res, next) => {
  const tokenStrings = req.headers.authorization.split(' ')[1];

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "JWT"
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.API_SECRET);

      if (decoded.role === "user") {
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        req.userId = user._id;
        req.employer = undefined;
        req.employerId = undefined;
      } else if (decoded.role === "employer") {
        const employer = await Employer.findById(decoded.id);
        if (!employer) {
          return res.status(401).json({ message: "Employer not found" });
        }
        req.user = undefined;
        req.employer = employer;
        req.employerId = decoded.id;
      } else {
        req.user = undefined;
        req.employer = undefined;
        req.employerId = undefined;
      }
    } else {
      req.user = undefined;
      req.employer = undefined;
      req.employerId = undefined;
    }
    next();
  } catch (error) {
    jwt.verify(tokenStrings, process.env.API_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          // Token has expired, return a 401 (Unauthorized) response with a message
          return res.status(401).json({ message: 'Token expired' });
        }
      }
    });
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = verifyToken;
