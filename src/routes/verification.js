import express from "express";
import nodemailer from "nodemailer";
import { generateOTP } from "../utils/generateOTP.js";

const router = express.Router();

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send verification email with OTP
router.post("/sendVerification", async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Generate OTP (6 digits)
    const otp = generateOTP(6);

    // Send email
    await transporter.sendMail({
      from: `"DeedLink Notification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color:#3D3C42;">DeedLink Verification</h2>
          <p>Hi ${userId || "User"},</p>
          <p>Your verification code is:</p>
          <h1 style="background:#A6D1E6; display:inline-block; padding:8px 16px; border-radius:8px; color:#3D3C42;">${otp}</h1>
          <p>This code is valid for <b>10 minutes</b>.</p>
          <p style="font-size:12px; color:gray;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Verification code sent to email", otp }); // optionally return OTP for dev
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

export default router;
