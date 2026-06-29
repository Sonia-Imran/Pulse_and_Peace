const nodemailer = require('nodemailer')

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email skipped: SMTP not configured in .env')
      return
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    await transporter.sendMail({
      from: `"Pulse & Peace" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`Email sent to ${to}`)
  } catch (err) {
    console.log('Email error (non-critical):', err.message)
  }
}

module.exports = sendEmail
