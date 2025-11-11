import dotenv from "dotenv";
import axios from "axios";
import { startConsumer } from "../utils/consumer.js";
import sendEmail from "../services/emailService.js";

dotenv.config();

const { USER_SERVICE_URL, INTERNAL_ACCESS_KEY } = process.env;

async function getEmailFromWallet(walletAddress) {
  if (!walletAddress) return null;

  try {
    const response = await axios.get(`${USER_SERVICE_URL}/email/${walletAddress}`, {
      headers: { "x-internal-key": INTERNAL_ACCESS_KEY },
    });
    return response.data.email;
  } catch (error) {
    console.error(`Failed to fetch email for wallet ${walletAddress}:`, error.response?.data || error.message);
    return null;
  }
}

async function handleEmailNotification(data) {
  console.log("Received RabbitMQ message:", data);

  const { ownerWalletAddress, deed, time } = data;

  if (!ownerWalletAddress || !deed) {
    console.warn("Skipping message, missing ownerWalletAddress or deed:", data);
    return;
  }

  const recipientEmail = await getEmailFromWallet(ownerWalletAddress);
  console.log(`Fetched email for wallet: `, recipientEmail);
  if (!recipientEmail) {
    console.warn(`No email found for wallet ${ownerWalletAddress}`);
    return;
  }

  console.log(`Sending email to ${recipientEmail} for deed notification.`);

  const subject = "New Deed Sent for Registration";
  const message = `A new deed has been created for wallet: ${ownerWalletAddress} at ${time}`;
  const html = `
    <h2>New Deed Registered!</h2>
    <p><strong>Wallet:</strong> ${ownerWalletAddress}</p>
    <p><strong>Survey Plan:</strong> ${JSON.stringify(deed) || "N/A"}</p>
    <p><strong>Created At:</strong> ${new Date(time).toLocaleString()}</p>
  `;

  try {
    await sendEmail({ to: recipientEmail, subject, text: message, html });
    console.log(`Email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }
}

startConsumer(handleEmailNotification);
