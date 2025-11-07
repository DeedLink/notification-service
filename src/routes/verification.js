import express from 'express';
//import { Router } from 'express';
import nodemailer from 'nodemailer';
import { generateOTP } from '../utils/generateOTP.js';
//import notificationSchema from '../models/notification.js';
//import { ConstructorFragment } from 'ethers';

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS

    }
});

//send verification
router.post("/sendVerification", async (req, res) => {
    try {
        const { userId, email } = req.body;
        //otp generate
        const otp = generateOTP(6);

        //send OTP through email
        await transporter.sendMail({
            from: `"DeedLink Notification" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your verfication code",
            text: `Your verification code is: ${otp}`,
            html: `<p>Your verification code is: <b>${otp}</b></p><p>This code is valid for 10 minutes.</p>`
        });



        res.status(200).json({ message: "Verification code sent to email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send verification email" });
    }
});