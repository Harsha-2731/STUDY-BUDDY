const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const sendResetEmail = async (email, token) => {
  const resetLink = `http://localhost:7070/reset/${token}`; // ✅ must match your backend route

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,       // your gmail address
      pass: process.env.EMAIL_PASS   // app password from Gmail
    }
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'StudyBuddy - Password Reset',
    html: `
      <p>Hello,</p>
      <p>You requested a password reset for your StudyBuddy account.</p>
      <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn’t request this, you can ignore this email.</p>
      <p>Thanks,<br/>StudyBuddy Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendResetEmail;
