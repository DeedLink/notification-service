import express from 'express'
//import { Router } from 'express'
import nodemailer from 'nodemailer';

const router = express.Router();

const transporter = nodemailer.createTestAccount({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

//verification email for deed registration
router.post('/deedRegistration', async (req, res) => {
    try {
        const { userId, email } = req.body;

        await transporter.sendMail({
            from: `"DeedLink Notification" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Deed Registration Verified"
        })

        res.status(200).json({ message: "Verification code sent to email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to send verification email" });
    }
})

