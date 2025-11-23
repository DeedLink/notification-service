import sendEmail from "../services/emailService.js";
import axios from "axios";

const { USER_SERVICE_URL, INTERNAL_ACCESS_KEY } = process.env;

export async function getEmailFromWallet(walletAddress) {
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

export async function handleEmailNotification(data) {
  console.log("Processing RabbitMQ message:", JSON.stringify(data, null, 2));

  const { ownerWalletAddress, deed, time } = data;
  if (!ownerWalletAddress || !deed) {
    console.warn("Skipping message, missing ownerWalletAddress or deed:", JSON.stringify(data, null, 2));
    console.warn("Data structure:", { 
      hasOwnerWalletAddress: !!ownerWalletAddress, 
      hasDeed: !!deed,
      dataKeys: Object.keys(data || {})
    });
    return;
  }

  // Ensure deed is a plain object (handle Mongoose documents that might have been sent)
  const deedObject = deed && typeof deed === 'object' ? (deed.toObject ? deed.toObject() : deed) : deed;
  
  console.log(`Fetching email for wallet address: ${ownerWalletAddress}`);
  const recipientEmail = await getEmailFromWallet(ownerWalletAddress);
  if (!recipientEmail) {
    console.warn(`No email found for wallet ${ownerWalletAddress} - email lookup failed`);
    console.warn("This might indicate the user service is not available or the wallet address is not registered");
    return;
  }
  console.log(`Found email for wallet ${ownerWalletAddress}: ${recipientEmail}`);

  const subject = "New Deed Sent for Registration";
  const message = `A new deed has been created for wallet: ${ownerWalletAddress} at ${time}`;
  const html = `
    <h2>New Deed Registered!</h2>
    <p><strong>Wallet:</strong> ${ownerWalletAddress}</p>
    <p><strong>Survey Plan:</strong> ${deedObject.surveyPlanNumber || "N/A"}</p>
    <p><strong>Deed Number:</strong> ${deedObject.deedNumber || "N/A"}</p>
    <p><strong>Created At:</strong> ${
      time ? new Date(time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "N/A"
    }</p>
  `;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}: Sending email to ${recipientEmail}...`);
      await sendEmail({ to: recipientEmail, subject, text: message, html });
      console.log(`Email sent successfully to ${recipientEmail}`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`All ${maxRetries} attempts failed for ${recipientEmail}`);
        console.error("Final error details:", error);
        // Don't throw - we've exhausted retries, acknowledge message to prevent infinite retry
        // In production, consider sending to a dead letter queue instead
      }
    }
  }
  
  // If we reach here, all retries failed but we're not throwing
  // This allows the message to be acknowledged (preventing infinite retries)
  // but logs that email sending ultimately failed
  console.error(`Email sending failed after ${maxRetries} attempts for ${recipientEmail}`);
}
