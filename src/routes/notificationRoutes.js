import express, { Router } from 'express'
import { getNotifications,getNotificationById,createNotification,deleteNotification } from '../controllers/notificationController'

const router = expreq.Router();

//create a new notification
router.post('/',createNotification);

//get a new notification 
router.get('/', getNotifications);

//get a notification by Id
router.get('/:id',getNotificationById);

//delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;