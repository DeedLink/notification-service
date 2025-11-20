import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import verificationRoutes from "./routes/verification.js";
import deedNotificationRoutes from "./routes/deedNotification.js";
import "./workers/emailWorker.js";

connectDb();

const app = express();
app.use(cors());
app.options("*", cors()); 
app.use(express.json());

app.use("/api/notifications", notificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/deed-notification", deedNotificationRoutes);

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => console.log(`Notification service running on port ${PORT}`));
