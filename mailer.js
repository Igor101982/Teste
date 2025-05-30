const nodemailer = require('nodemailer');
module.exports = async function sendEmail(to, subject, text) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
    await transporter.sendMail({ from: process.env.MAIL_USER, to, subject, text });
};