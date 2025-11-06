import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import notificationRoutes from "./routes/notificationRoutes.js";
import verificationRoutes from "./routes/verification.js";
import deedNotificationRoutes from "./routes/deedNotification.js";

dotenv.config();

const app = express();


const allowedOrigins = [
    "http://localhost:5173",
    "https://notification-service-beta-opal.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));


app.options("*", cors());


app.use(express.json());


app.use("/api/notifications", notificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/verification", deedNotificationRoutes);


const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`✅ Notification service running on port ${PORT}`));
