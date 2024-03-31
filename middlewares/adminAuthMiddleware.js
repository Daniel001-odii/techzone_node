const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel");
const Administrator = require("../models/adminModel");


const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token || req.headers.authorization.split(" ")[0] !== "JWT") {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.API_SECRET);

    // console.log("found a role: ", decoded.role);

    if (decoded.role === "admin") {
      const user = await Administrator.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'Invalid token. User not found' });
      }

      req.user = user;
      req.userId = user._id;
    }
    else if (decoded.role === "manager") {
        const user = await Administrator.findById(decoded.id);
  
        if (!user) {
          return res.status(401).json({ message: 'Invalid token. User not found' });
        }
  
        req.user = user;
        req.userId = user._id;
      }
    else if (decoded.role === "moderator") {
        const user = await Administrator.findById(decoded.id);
  
        if (!user) {
          return res.status(401).json({ message: 'Invalid token. User not found' });
        }
  
        req.user = user;
        req.userId = user._id;
    }
    else if (decoded.role === "team-lead") {
        const user = await Administrator.findById(decoded.id);
  
        if (!user) {
          return res.status(401).json({ message: 'Invalid token. User not found' });
        }
  
        req.user = user;
        req.userId = user._id;
    }
    else if (decoded.role === "team-member") {
        const user = await Administrator.findById(decoded.id);
  
        if (!user) {
          return res.status(401).json({ message: 'Invalid token. User not found' });
        }
  
        req.user = user;
        req.userId = user._id;
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

