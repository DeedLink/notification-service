import mongoose from "mongoose";

export const connectDb = () =>{
    try{
        mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected!");
    }
    catch (e){
        console.error("MongoDB Connection Fail!",e);
        process.exit(1);
    }
}