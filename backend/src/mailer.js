const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
host: process.env.SMTP_HOST,
port: Number(process.env.SMTP_PORT || 587),
secure: false,
auth: {
user: process.env.SMTP_USER,
pass: process.env.SMTP_PASS
}
});


async function sendEmail(to, subject, text) {
if (!process.env.SMTP_HOST) {
console.log('Skipping email (no SMTP configured) - to:', to, subject);
return;
}
const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
await transporter.sendMail({ from, to, subject, text });
}


module.exports = { sendEmail };