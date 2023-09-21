const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Import the Employer model

const verifyToken = (req, res, next) => {
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "JWT"
  ) {
    jwt.verify(req.headers.authorization.split(" ")[1], process.env.API_SECRET, function (err, decode) {
      if (err) {
        req.user = undefined;
        req.employer = undefined;
      } else {
        // Check if it's a user or employer based on role or other criteria
        if (decode.role === "user") {
          User.findOne({ _id: decode.id }).exec((err, user) => {
            if (err) {
              res.status(500).send({ message: err });
            } else {
              req.user = user;
              req.employer = undefined;
              next();
            }
          });
        } else if (decode.role === "employer") {
          Employer.findOne({ _id: decode.id }).exec((err, employer) => {
            if (err) {
              res.status(500).send({ message: err });
            } else {
              req.user = undefined;
              req.employer = employer;
              next();
            }
          });
        } else {
          req.user = undefined;
          req.employer = undefined;
          next();
        }
      }
    });
  } else {
    req.user = undefined;
    req.employer = undefined;
    next();
  }
};

module.exports = verifyToken;
