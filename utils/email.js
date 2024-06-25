require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  try {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = await oauth2Client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error("Failed to retrieve access token");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        accessToken: accessToken.token,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
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
    throw err; // Re-throw the error to be caught in sendEmail
  }
};

const sendEmail = async (to, subject, text, html, template, context) => {
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
    await emailTransporter.sendMail(mailOptions);
    console.log("email sent:", emailTransporter.response);
  } catch (err) {
    console.log("error sending email:", err);
  }
};

module.exports = sendEmail;
