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
          return res.status(401).json({ message: "Non Admin!!!"});
        }
          req.Admin = Admin;
          req.AdminId = Admin._id;
        }
      }

    }
    catch (error){

    };
  };


  module.exports = verifyAdminToken;