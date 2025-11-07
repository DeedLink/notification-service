import transporter from "../config/emailConfig.js";

async function sendEmail(to, subject,message,html){
    try{
        const mailOption = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            message,
            html
        }

        let info = await transporter.sendMail(mailOption);
        console.log("Email sent!", info.messageId);
        return info;
    }catch(e){
        console.error("Error sending email",e);
        throw e;
    }
}

export default sendEmail;