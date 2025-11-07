import express from "express";
import {
  getNotifications,
  getNotificationById,
  createNotification,
  deleteNotification,
  sendMessages,
  getSentMessages
} from "../controllers/notificationController.js";

const router = express.Router();

// Create a new notification
router.post("/", createNotification);

// Send a new message
router.post("/message", sendMessages);

//Get sen messages by user
router.get("/sentMessages", getSentMessages)

// Get all notifications
router.get("/", getNotifications);

// Get a notification by ID
router.get("/:id", getNotificationById);

// Delete a notification
router.delete("/:id", deleteNotification);



export default router;
