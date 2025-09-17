import express from 'express'
import notificationSchema from '../models/notification'
import { json, where } from 'sequelize';

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

module.exports = {
    createNotification,
    getNotifications,
    getNotificationById,
    deleteNotification,
};