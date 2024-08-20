
/*
**
EMAIL CONCERNED CONTROLLERS
**/
const nodemailer = require('nodemailer');

require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
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


    await transporter.sendMail(mailOptions);
    console.log("email sent:", transporter.response);
  } catch (err) {
    console.log("error sending email:", err);
  }
};

/*
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: "noreply@apexteks.com",
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};
*/

module.exports = sendEmail;