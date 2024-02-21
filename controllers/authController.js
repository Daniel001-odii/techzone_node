const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Employer = require("../models/employerModel"); // Correct the import for Employer model
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// user signup....
exports.userSignup = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Check if required fields are missing
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        const existingEmployer = await Employer.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'The email has already been registered as a user' });
        } else if (existingEmployer) {
            return res.status(400).json({ message: 'The email has already been registered as an employer' });
        } else {
            const newUser = new User({
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 8)
            });

            await newUser.save();
            res.status(200).send({ message: "User registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "User registration failed!" });
    }
}

// employer signup....
exports.employerSignup = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Check if required fields are missing
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        const existingEmployer = await Employer.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'The email has already been registered as a user' });
        } else if (existingEmployer) {
            return res.status(400).json({ message: 'The email has already been registered as an employer' });
        } else {
            const newEmployer = new Employer({
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 8)
            });

            await newEmployer.save();
            res.status(200).send({ message: "Employer registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "Employer registration failed!" });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        Promise.all([
            User.findOne({ email }).exec(),
            Employer.findOne({ email }).exec(),
        ])
        .then(([user, employer]) => {
            if (!user && !employer) {
                return res.status(404).send({ message: "User with email not found" });
            }

            // Determine user's role
            const role = user ? 'user' : 'employer';

            // Compare password
            const isValidPassword = user
                ? bcrypt.compareSync(password, user.password)
                : bcrypt.compareSync(password, employer.password);

            if (!isValidPassword) {
                return res.status(401).send({ message: "Invalid username or password" });
            }

            // Assign user/employer id to response and generate token
            const userId = user ? user.id : employer.id;
            const token = jwt.sign({ id: userId, role }, process.env.API_SECRET, { expiresIn: 86400 });

            // Send a response
            const response = {
                user: {
                    id: userId,
                    email: email,
                    role: role,
                },
                message: "Login Successful",
                accessToken: token,
            };

            res.status(200).send(response);
        })
        .catch((err) => {
            res.status(500).send({ message: err });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Login failed" });
    }
};
