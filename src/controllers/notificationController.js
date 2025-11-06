import express from 'express'
import notificationSchema from '../models/notification'
import { json, where } from 'sequelize';
import sendEmail from '../services/emailService';

const createNotification = async (req, res) => {
    try {
        const { id, userId, recipient, eventType, message, isRead, timeStamp } = req.body;

        const newNotification = await notificationSchema.create({
            id,
            userId,
            recipient,
            eventType,
            message,
            isRead,
            timeStamp
        });

        res.status(201).json(newNotification);
    }

    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationSchema.findAll();
        res.json(notifications);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNotificationById = async (req, res) => {
    try {
        const notification = await notificationSchema.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" })
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deleteNotification = async (req, res) => {
    try {
        const rows = await notificationSchema.destroy({ where: { id: req.params.id } });

        if (!rows) {
            return res.status(404).json({ error: "Not found" })
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const notifyDeedTransaction = async (req, res) => {
    try {
        const { buyerEmail, sellerEmail, deedDetails } = req.body;

        await sendEmail(
            buyerEmail,
            "Deed Transaction Successful",
            `Your deed transaction was successful. Details: ${JSON.stringify(deedDetails)}`,
            `<h2>Deed Transaction Successful</h2>
            <p>Your transaction is confirmed.</p>
            <pre>${JSON.stringify(deedDetails, null, 2)}</pre>`

        );

        await sendEmail(
            sellerEmail,
            "Deed Transaction Successful",
            `Your deed transaction was successful. Details: ${JSON.stringify(deedDetails)}`,
            `<h2>Deed Transaction Successful</h2>
            <p>Your transaction is confirmed.</p>
            <pre>${JSON.stringify(deedDetails, null, 2)}</pre>`
        );

        res.status(200).json({ message: "Emails sent successfully!" });
    } catch (e) {
         res.status(500).json({ message: "Failed to send emails", error });
    }
}

const sendMessages = async (req,res) => {
    try{
        const {senderName, senderEmail, senderRole, recipientRole, recipientEmail, subject,message} =   req.body;

        if(!sendEmail || !senderName || !senderRole || !recipientRole || !recipientEmail || !subject || !message){
            return res.status(400).json({ error: "Missing required fields" });
        }
    }catch(error){
        console.error("Failed to send messages!")
    }
}

module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    deleteNotification,
    notifyDeedTransaction,
    sendMessages
};