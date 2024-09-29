require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const expressAsyncHandler = require("express-async-handler");

const userModel = require("../models/userModel");
const employerModel = require("../models/employerModel");
const adminModel = require("../models/adminModel");
const { error } = require("console");


const createTransporter = async () => {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: process.env.GOOGLE_ACCESS_TOKEN,
      },
    });

    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve("./templates/partials"),
        layoutsDir: path.resolve("./templates"),
        defaultLayout: false,
      },
      viewPath: path.resolve("./templates"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));

    return transporter;
  } catch (err) {
    console.error("Error creating transporter:", err);
    throw err;
  }
};

const sendMail = expressAsyncHandler(async (to, subject, text, html, template, context) => {
  try {

    const mailOptions = {
      from: "noreply@apexteks.com",
      to,
      subject,
      text,
      html,
      template,
      context,
    };

    let emailTransporter = await createTransporter();


    // check if user is found
    // if user is found check if user has enabled in-email notifications...
    // before ending email alerts to users...
    const user = await userModel.findOne({ email: to });
    const employer = await employerModel.findOne({ email: to });
    const admin = await adminModel.findOne({ email: to });

    // Check if either user or employer exists
    if (!user && !employer && !admin) {
        // return res.status(400).json({ message: 'Invalid or expired reset token' });
        throw error
    }

    // Choose the document to update based on which one was found
    const emailUser = user || employer;
    if(emailUser.settings.notifications.emails){

    await emailTransporter.sendMail(mailOptions);
    console.log(" ====== an email was sent ======");

    } else {

    // await emailTransporter.sendMail(mailOptions);
    console.log(" ====== email was not sent since user turned off notifications ======");

  }
    // res.status(200).send("Email sent successfully");
  } catch (err) {
    console.log("Error sending email:", err);
    // res.status(500).send("Failed to send email");
  }
});

module.exports = sendMail;

