import Notification from "../models/Notification.js";
import sendEmail from "../services/emailService.js";

const createNotification = async (req, res) => {
  try {
    const { msgId, senderName, senderEmail, recipientEmail, message, isRead, timeStamp } = req.body;

    const newNotification = await Notification.create({
      msgId,
      senderName,
      senderEmail,
      recipientEmail,
      message,
      isRead,
      timeStamp
    });

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timeStamp: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
  } catch (error) {
    res.status(500).json({ message: "Failed to send emails", error: error.message });
  }
};

const sendMessages = async (req, res) => {
  try {
    const {
      senderName,
      senderEmail,
      senderRole,
      recipientRole,
      recipientEmail,
      recipientName,
      subject,
      message
    } = req.body;

    if (
      !senderEmail ||
      !senderName ||
      !senderRole ||
      !recipientRole ||
      !recipientEmail ||
      !recipientName ||
      !subject ||
      !message
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = await Notification.create({
      msgId: `MSG-${Date.now()}`,
      senderEmail: senderEmail,
      senderName: senderName,
      senderRole: senderRole,
      recipientRole: recipientRole,
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      subject: subject,
      message: message,
      isRead: false,
      timeStamp: new Date()
    });

    res.status(200).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export {
  createNotification,
  getNotifications,
  getNotificationById,
  deleteNotification,
  notifyDeedTransaction,
  sendMessages
};
