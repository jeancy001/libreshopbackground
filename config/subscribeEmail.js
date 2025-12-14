import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,  // your Gmail address
    pass: process.env.EMAIL_PASS   // app password (not raw Gmail password)
  }
});

export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"CMwood" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
