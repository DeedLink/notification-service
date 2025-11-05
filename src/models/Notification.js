import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema ({

    id:{
        type:String,
        required: true,
        unique: true
    },

    userId: {
        type:String,
        required: false,
        
    },

    recipient: {
        type: String,
        required: false
    },

    eventType:{
        type: String,
        required:true
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