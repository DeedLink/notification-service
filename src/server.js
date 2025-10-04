import express from 'express';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notificationRoutes.js';
import verificationRoutes from'./routes/verification.js';
import deedNotificationRoutes from './routes/deedNotification.js';

dotenv.config();
const app = express();

app.use(express.json());

app.use('/api/notifications', notificationRoutes);

app.use('/api/verfication',verificationRoutes);

app.use('/api/verfication',deedNotificationRoutes);

const PORT = process.env.PORT ||5000;
app.listen(PORT, ()=> console.log(`Notification service running on port: ${PORT}`));

