import transporter from "../config/email.js";

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 [EMAIL NOT SENT - NO CREDENTIALS CONFIGURED] To: ${to} | Subject: ${subject}`);
      return true;
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Dayflow HRMS" <no-reply@dayflow.com>',
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("⚠️ Failed to send email:", error.message);
    return false;
  }
};
