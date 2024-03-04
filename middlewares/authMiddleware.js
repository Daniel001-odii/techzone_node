const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Import the Employer model
// const Administrator = require("../models/adminModel");


const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    console.log("checking for token: ", token)

      if (
        token && req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "JWT"
      ) {
        const decoded = jwt.verify(token, process.env.API_SECRET);

        console.log("found a role: ", decoded.role)
        
  
        if (decoded.role === "user") {
          const user = await User.findById(decoded.id);
          if(user){
            req.user = user;
            req.userId = user._id;
          }
         
          else if (!user) {
             // If user is not found by userId, try finding by googleId
              const userByGoogleId = await User.findOne({ googleId: decoded.googleId });            
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
            req.employerGoogleId = userByGoogleId.googleId;
            req.employerId = userByGoogleId._id;
            req.employer = userByGoogleId;
          }
         
      }
      }

    // }
    // else {
    //   console.error("user token not found, please login...");
    //   res.status(401).json({ message: "No token foun" });
    // } 
    
   next();
  } catch (error) {
    console.error("Unauthorized...", error);
    res.status(401).json({ message: "Unauthorized", error});
}
};





module.exports = verifyToken;

