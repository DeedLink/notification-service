import { startConsumer } from "../utils/consumer.js";
import { routeMessage } from "../utils/messageRouter.js";

console.log("Email worker loaded, starting consumer...");

// Start consumer with robust error handling and auto-restart
// Uses message router to handle both deed and transaction notifications
const startConsumerWithRetry = async () => {
  try {
    await startConsumer(routeMessage);
    console.log("Consumer started successfully - ready to handle deed and transaction notifications");
  } catch (error) {
    console.error("Failed to start email consumer:", error);
    console.error("Error stack:", error.stack);
    // Retry after 5 seconds
    setTimeout(() => {
      console.log("Retrying to start consumer...");
      startConsumerWithRetry();
    }, 5000);
  }
};

// Start the consumer
startConsumerWithRetry();

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down consumer gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down consumer gracefully...');
  process.exit(0);
});
