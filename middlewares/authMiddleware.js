const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token || req.headers.authorization.split(" ")[0] !== "JWT") {
      return res.status(401).json({ message: 'Invalid login' });
    }

    const decoded = jwt.verify(token, process.env.API_SECRET);

    if (decoded.role === "user") {
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.userId = user._id;

    } else if (decoded.role === "employer") {
      const employer = await Employer.findById(decoded.id);

      if (!employer) {
        return res.status(401).json({ message: 'Employer not found' });
      }

      req.employer = employer;
      req.employerId = decoded.id;
    } else {
      // If role is not recognized, return an error
      return res.status(401).json({ message: 'Invalid role' });
    }

    next(); // Only call next() once after user or employer has been found and set
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "login expired" });
    } else {
      console.error("Unauthorized...", error);
      return res.status(401).json({ message: "Unauthorized"});
    }
  }
};

module.exports = verifyToken;
