import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import verificationRoutes from "./routes/verification.js";
import deedNotificationRoutes from "./routes/deedNotification.js";
import "./workers/emailWorker.js";

await connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/notifications", notificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/deed-notification", deedNotificationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "notification-service",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => console.log(`Notification service running on port ${PORT}`));
