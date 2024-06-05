
/*
**
EMAIL CONCERNED CONTROLLERS
**/
require("dotenv").config()
 const nodemailer = require("nodemailer");
 const { google } = require("googleapis");
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

      const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            console.log("*ERR: ", err)
            reject();
          }
          resolve(token); 
        });
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.GMAIL_USER,
          accessToken,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
        },
      });
      return transporter;
  } catch (err) {
    return err
  }
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      // from: process.env.GMAIL_USER,
      from: "noreply@apexteks.com",
      to,
      subject,
      text,
      html,
    }

    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(mailOptions);
    console.log("email sent: ", emailTransporter.response);
  } catch (err) {
    console.log("error sending email: ", err)
  }
};

module.exports = sendEmail;