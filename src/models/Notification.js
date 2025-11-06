import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema ({

    msgId:{
        type:String,
        required: true,
        unique: true
    },

    senderName: {
        type:String,
        required: false,
        
    },

    senderEmail: {
        type: String
    },

    recipientRole: {
        type: String,
        required: false
    },

    recipientEmail: {
        type: String
    },

    subject: {
        type: String
    },

    message: {
        type: String,
        required:false
    },

    isRead: {
        type:Boolean,
        required:true
    },

    timeStamp: {
        type: Date,
        required: true,
    }
});

export default notificationSchema;