require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const expressAsyncHandler = require("express-async-handler");

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
  
    const result = await emailTransporter.sendMail(mailOptions);
    console.log("waitlist confirmation email sent to: ", to, "result: ", result);
  
    // return res.status(200).send("Email sent successfully");
  } catch (err) {
    console.log("Error sending email:", err);
    // return res.status(500).send("Failed to send email");
  }
});

module.exports = sendMail;
