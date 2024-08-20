const nodemailer = require('nodemailer');

const expressAsyncHandler = require('express-async-handler');

const sendMail = expressAsyncHandler(async (data, req, res) => {

    // const { to, subject, text } = req.body;

    const transporter = nodemailer.createTransport({

        service: 'gmail',

        auth: {

            type: 'OAuth2',

            user: process.env.GMAIL_USER,

            clientId: process.env.GOOGLE_CLIENT_ID,

            clientSecret: process.env.GOOLGE_CLIENT_SECRET,

            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,

            accessToken: process.env.GOOGLE_ACCESS_TOKEN,

        }

    });

    let mailOptions = {

        from: "noreply@apexteks.com",

        to: 'xenithheight@gmail.com',

        subject: 'Hello from Node-ecommerce APP!',

        text: 'This email is sent using Nodemailer with OAuth2 authentication.'

    };

    transporter.sendMail(mailOptions, function(error, info) {

        if (error) {

            console.log(error);

        } else {

            console.log('Email sent: ' + info.response);

        }

    });

})

module.exports = sendMail;