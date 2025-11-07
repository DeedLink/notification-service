//import express, { Router } from 'express'
import express from 'express'
import { getNotifications,getNotificationById,createNotification,deleteNotification,newMessage } from '../controllers/notificationController.js'

const router = express.Router();

//create a new notification
router.post('/',createNotification);


router.post("/message", newMessage);

//get a new notification 
router.get('/', getNotifications);

//get a notification by Id
router.get('/:id',getNotificationById);

//delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;