import express from 'express'
import { Router } from 'express'
import nodemailer from 'nodemailer'

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
    try{
        const {userId,email} = req.body;
    }catch(error){

    }
})