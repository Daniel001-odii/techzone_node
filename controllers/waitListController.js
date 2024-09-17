const waitListUser = require('../models/waitListUser');
const sendEmail = require("../utils/waitlist_email");

exports.sendWaitListEmail = async (req, res) => {
    const { email } = req.body;

    if(!email){
        return res.status(400).json({ message: "please provide a valid email address"});
    }

    const existingUser = await waitListUser.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ message: "Oh looks like you already joined our early program!" });
    }

    const newUser = new waitListUser({
        email,
    });
    await newUser.save();

    const recipient = email;
    const subject = "You joined our waitlist!";
    const template = "waitlist";
    const context = { email: email };

    try {
        sendEmail(recipient, subject, null, null, template, context);
        res.status(200).json(`You joined our waitlist! A confirmation email has been sent to ${email}. Thank you!`);
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "There was an error sending the confirmation email. Please try again later." });
    }
};
