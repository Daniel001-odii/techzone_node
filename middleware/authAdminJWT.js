const Administrator = require("../models/adminModel");
const jwt = require("jsonwebtoken");


const verifyAdminToken = async (req, res, next) => {
  const tokenStrings = req.headers.authorization.split(' ')[1];

  try {
    if (
      req.headers.authorization && req.headers.authorization(" ")[0] === "JWT"
    ){
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.API_SECRET);

      if(decoded.role === "Admin"){
        const Admin = await Administrator.findById(decoded.id);
        if(!Admin){
          return res.status(401).json({ message: "Non Admin, unauthorized!!!"});
        }
          req.Admin = Admin;
          req.AdminId = Admin._id;
        }
      }
      else{
        req.Admin = undefined;
        req.AdminId = undefined;
      }
      next();

    } catch (error){
      jwt.verify(tokenStrings, process.env.API_SECRET, (err, decoded) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            // Token has expired, return a 401 (Unauthorized) response with a message
            return res.status(401).json({ message: 'Token expired, please login again' });
          }
        }
      });
      console.error("Token verification error:", error);
      // res.status(401).json({ message: "Unauthorized" });
    };
  };


  module.exports = verifyAdminToken;