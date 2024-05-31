const waitListUser = require('../models/waitListUser');
const sendEmail = require("../utils/email");

exports.sendWaitListEmail = async(req, res) => {
    const { email } = req.body;

    const existingUSer = await waitListUser.findOne({ email });

    if(existingUSer){
        return res.status(400).json({ message: "Oh looks like you already joined our early program!"})
    }

    const newUser = new waitListUser({
        email,
    })
    newUser.save();

    sendEmail(email,
        "You joined our waitlist!", "...",
        `<p><b>thanks for joining our waitlist!</b> <br/>You are now part of our early users, <br/> We will keep you in touch once we go live.</p>`
    );

    res.status(200).json(`you joined our waitlist! \n a confirmation email has been sent to ${email} \n Thank You!`)
};


