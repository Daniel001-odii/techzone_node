const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Import the Employer model
// const Administrator = require("../models/adminModel");


// acount status....
// onhold
// blocked

const checkStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const status = user.account_status;

    console.log("account middleware working...", user)

    if(status == 'blocked'){
      return res.status(400).json({ message: "sorry you cant perform this action, your account is blocked"});
    } else if(status == 'onhold'){
      return res.status(400).json({ message: "sorry you cant perform this action, your account is onhold"})
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "internal server error"});
  }
};







module.exports = checkStatus;

