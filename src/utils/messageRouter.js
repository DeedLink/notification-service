import { handleEmailNotification } from "./emailHandler.js";
import { handleTransactionNotification } from "./transactionEmailHandler.js";

/**
 * Routes messages to the appropriate handler based on message content
 * @param {Object} data - The message data from RabbitMQ
 */
export async function routeMessage(data) {
  console.log("Routing message based on content...");

  // Check if it's a transaction notification
  if (data.buyerWalletAddress && data.transaction && data.transactionType) {
    console.log("Detected transaction notification, routing to transaction handler");
    return await handleTransactionNotification(data);
  }

  // Check if it's a deed notification
  if (data.ownerWalletAddress && data.deed) {
    console.log("Detected deed notification, routing to deed handler");
    return await handleEmailNotification(data);
  }

  // Unknown message type
  console.warn("Unknown message type, cannot route:", JSON.stringify(data, null, 2));
  console.warn("Message keys:", Object.keys(data || {}));
  throw new Error("Unknown message type - cannot determine handler");
}

