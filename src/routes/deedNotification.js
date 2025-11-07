import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verification email for deed registration
router.post("/deedRegistration", async (req, res) => {
  try {
    const { userId, email } = req.body;

    await transporter.sendMail({
      from: `"DeedLink Notification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Deed Registration Verified",
      text: `Hello ${userId}, your deed registration has been successfully verified.`,
    });

    res.status(200).json({ message: "Verification email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

export default router;
