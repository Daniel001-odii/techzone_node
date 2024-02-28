const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Import the Employer model
// const Administrator = require("../models/adminModel");


const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    
    if(!token){
      console.error("user token not found, please login...");
    res.status(401).json({ message: "No token foun" });
    };
    
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "JWT"
    ) {
      const decoded = jwt.verify(token, process.env.API_SECRET);
      console.log("decoded stuff: ", decoded)

      if (decoded.role === "user") {
        const user = await User.findById(decoded.id);
        if(user){
          req.user = user;
          req.userId = user._id;
        }
       
        else if (!user) {
           // If user is not found by userId, try finding by googleId
            const userByGoogleId = await User.findOne({ googleId: decoded.googleId });
            console.log("user from google found: ", userByGoogleId.profile)
          
            if (!userByGoogleId) {
              // If user is not found by googleId as well, return an error
              return res.status(401).json({ message: 'Invalid token. User not found' });
            }
            
            req.userGoogleId = userByGoogleId.googleId;
            req.userId = userByGoogleId._id;
            req.user = userByGoogleId;
        }
        
      } 
      else if (decoded.role === "employer") {
        const employer = await Employer.findById(decoded.id);
        if(employer){
          req.employer = employer;
          req.employerId = decoded.id;
        }
        else if (!employer) {
           // If user is not found by userId, try finding by googleId
          const userByGoogleId = await Employer.findOne({ googleId: decoded.googleId });
        
          if (!userByGoogleId) {
            // If user is not found by googleId as well, return an error
            return res.status(401).json({ message: 'Invalid token. User not found' });
          }
          
          req.userGoogleId = userByGoogleId.googleId;
          req.userId = userByGoogleId._id;
          req.user = userByGoogleId;
          console.log(req)
        }
       
    }
  }
    next();
  } catch (error) {
    console.error("user token not found, please login...", error);
    res.status(401).json({ message: "Unauthorized"});
}
};





module.exports = verifyToken;

