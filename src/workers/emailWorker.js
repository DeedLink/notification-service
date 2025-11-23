import { startConsumer } from "../utils/consumer.js";
import { handleEmailNotification } from "../utils/emailHandler.js";

console.log("Email worker loaded, starting consumer...");

// Start consumer with error handling
startConsumer(handleEmailNotification).catch((error) => {
  console.error("Failed to start email consumer:", error);
  // Retry after 5 seconds
  setTimeout(() => {
    console.log("Retrying to start consumer...");
    startConsumer(handleEmailNotification);
  }, 5000);
});
