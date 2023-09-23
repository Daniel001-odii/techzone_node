var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
var User = require("../models/userModel");
var Employer = require("../models/employerModel");


exports.signup = (req, res) => {
  const user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    role: 'user',
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500)
        .send({
          message: err
        });
      return;
    } else {
      res.status(200)
        .send({
          message: "User Registered successfully"
        })
    }
  });
};



exports.employerSignup = (req, res) => {
  const user = new Employer({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    role: 'employer',
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500)
        .send({
          message: err
        });
      return;
    } else {
      res.status(200)
        .send({
          message: "Client Registered successfully"
        })
    }
  });
};



exports.signin = (req, res) => {
  const { email, password } = req.body;

  // Combine queries for both users and employers
  Promise.all([
    User.findOne({ email }).exec(),
    Employer.findOne({ email }).exec(),
  ])
    .then(([user, employer]) => {
      if (!user && !employer) {
        return res.status(404).send({ message: "User Not found." });
      }

      // Determine the role based on which document was found
      const role = user ? user.role : employer.role;

      // Compare passwords and check role
      const passwordIsValid = bcrypt.compareSync(password, user ? user.password : employer.password);

      if (!passwordIsValid) {
        return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
      }

      // Sign a token with the appropriate user ID and role
      const userId = user ? user.id : employer.id;
      const token = jwt.sign({ id: userId, role }, process.env.API_SECRET, { expiresIn: 86400 });

      // Construct the response based on the role
      const response = {
        user: {
          id: userId,
          email: email,
          role: role, // Include the role in the response
        },
        message: "Login successful",
        accessToken: token,
      };

      res.status(200).send(response);
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};



// Controller for employer sign-in
exports.employerSignin = (req, res) => {
  Employer.findOne({ email: req.body.email })
    .exec((err, employer) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      if (!employer) {
        return res.status(404).send({ message: 'Employer not found' });
      }

      // Verify employer's credentials
      var passwordIsValid = bcrypt.compareSync(req.body.password, employer.password);

      if (!passwordIsValid) {
        return res.status(401).send({ accessToken: null, message: 'Invalid Password' });
      }


      
      // Generate and send the access token for employer
      var token = jwt.sign({ id: employer._id, role: "employer" }, process.env.API_SECRET, {
        expiresIn: 86400,
      });

      res.status(200).send({
        employer: {
          id: employer._id,
          role: "employer",
          email: employer.email,
          // Add other employer data if needed
        },
        message: 'Employer login successful',
        accessToken: token,
      });
    });
};




// Controller to fetch user details using JWT token
exports.getUser = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the user ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the user ID from the token to fetch the user details from the database
    User.findById(decoded.id, (err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      // Send the user details in the response
      res.status(200).send({
        user: {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profile: user.profile,
          saved_jobs: user.savedJobs,
          created: user.created,
          isverified: user.isVerified,
          // Add other user details as needed
        },
      });
    });
  });

  if(req.headers.authorization.split(' ')[1] == undefined || req.headers.authorization.split(' ')[1] == null){
    return res.status(401).send({message: "no authorization headers found.."})
  }
};



// Controller to fetch employer details using JWT token
exports.getEmployer = (req, res) => {
  const token = req.headers.authorization.split(' ')[1]; // Get the JWT token from the request headers

  // Verify the token and get the employer ID from it
  jwt.verify(token, process.env.API_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    // Use the employer ID from the token to fetch the employer details from the database
    Employer.findById(decoded.id, (err, employer) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      if (!employer) {
        return res.status(404).send({ message: 'Employer not found' });
      }

      // Send the employer details in the response
      res.status(200).send({
        employer: {
          id: employer._id,
          email: employer.email,
          firstname: employer.firstname,
          lastname: employer.lastname,
          created: employer.created,
          profile: employer.profile,
          // Add other employer details as needed
        },
      });
    });
  });

  if (req.headers.authorization.split(' ')[1] == undefined || req.headers.authorization.split(' ')[1] == null) {
    return res.status(401).send({ message: "No authorization headers found" });
  }
};
