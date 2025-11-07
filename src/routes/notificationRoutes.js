import express from "express";
import {
  getNotifications,
  getNotificationById,
  createNotification,
  deleteNotification,
  sendMessages
} from "../controllers/notificationController.js";

const router = express.Router();

// Create a new notification
router.post("/", createNotification);

// Send a new message
router.post("/message", sendMessages);

// Get all notifications
router.get("/", getNotifications);

// Get a notification by ID
router.get("/:id", getNotificationById);

// Delete a notification
router.delete("/:id", deleteNotification);

export default router;
