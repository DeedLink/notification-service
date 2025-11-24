import { getChannel, isConnected, resetConnection } from "./rabbitmq.js";

let currentConsumerTag = null;
let isConsuming = false;
let consumerRestartTimeout = null;
let healthCheckInterval = null;

const startConsuming = async (channel, onMessage) => {
  try {
    // Set prefetch to 1 to process one message at a time
    await channel.prefetch(1);
    console.log("Prefetch set to 1");

    const consumerTag = channel.consume(
      process.env.RABBITMQ_QUEUE,
      async (msg) => {
        if (!msg) {
          console.log("Received null message (connection may be closing)");
          // If we get null, connection might be closing, restart consumer
          if (isConnected()) {
            setTimeout(() => restartConsumer(onMessage), 2000);
          }
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString());
          console.log("Received message from queue:", JSON.stringify(content, null, 2));
          
          await onMessage(content);
          
          // Acknowledge message
          channel.ack(msg);
          console.log("Message processed and acknowledged successfully");
        } catch (err) {
          console.error("Error processing message:", err.message);
          console.error("Error stack:", err.stack);
          console.error("Message content that failed:", msg.content.toString());
          
          try {
            // Reject message and don't requeue to prevent infinite retry loops
            channel.nack(msg, false, false);
            console.warn("Message rejected and not requeued due to processing error");
          } catch (nackErr) {
            console.error("Failed to nack message:", nackErr.message);
            // If nack fails, connection might be broken, restart consumer
            if (!isConnected()) {
              setTimeout(() => restartConsumer(onMessage), 2000);
            }
          }
        }
      },
      { noAck: false }
    );
    
    currentConsumerTag = consumerTag;
    isConsuming = true;
    console.log(`Consumer started successfully with tag: ${consumerTag}`);
    console.log("Waiting for messages...");
    
    return consumerTag;
  } catch (err) {
    console.error("Error setting up consumer:", err.message);
    throw err;
  }
};

const restartConsumer = async (onMessage) => {
  if (consumerRestartTimeout) {
    clearTimeout(consumerRestartTimeout);
  }
  
  // Clear health check interval
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  
  console.log("Restarting consumer...");
  isConsuming = false;
  currentConsumerTag = null;
  
  // Wait a bit before restarting
  consumerRestartTimeout = setTimeout(async () => {
    try {
      await startConsumer(onMessage);
    } catch (err) {
      console.error("Failed to restart consumer:", err.message);
      // Retry again
      setTimeout(() => restartConsumer(onMessage), 5000);
    }
  }, 2000);
};

export async function startConsumer(onMessage) {
  // Prevent multiple simultaneous start attempts
  if (isConsuming) {
    console.log("Consumer already running, skipping...");
    return;
  }

  try {
    console.log("Attempting to get RabbitMQ channel...");
    const channel = await getChannel();
    
    if (!channel) {
      throw new Error("Failed to get RabbitMQ channel");
    }

    console.log(`Successfully got channel. Listening for messages on queue: "${process.env.RABBITMQ_QUEUE}"`);

    // Set up channel error handlers
    channel.on("error", (err) => {
      console.error("Channel error detected:", err.message);
      isConsuming = false;
      currentConsumerTag = null;
      setTimeout(() => restartConsumer(onMessage), 2000);
    });

    channel.on("close", () => {
      console.warn("Channel closed, will restart consumer...");
      isConsuming = false;
      currentConsumerTag = null;
      setTimeout(() => restartConsumer(onMessage), 2000);
    });

    // Start consuming
    await startConsuming(channel, onMessage);
    
    // Set up periodic health check
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    healthCheckInterval = setInterval(() => {
      if (!isConnected() || !isConsuming) {
        console.warn("Consumer health check failed, restarting...");
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
        restartConsumer(onMessage);
      }
    }, 30000); // Check every 30 seconds

    return channel;
  } catch (error) {
    console.error("Error starting RabbitMQ consumer:", error.message);
    console.error("Error stack:", error.stack);
    isConsuming = false;
    currentConsumerTag = null;
    
    // Retry after delay
    setTimeout(() => {
      console.log("Retrying to start consumer in 5 seconds...");
      startConsumer(onMessage);
    }, 5000);
    
    throw error;
  }
}

// Export function to stop consumer
export function stopConsumer() {
  isConsuming = false;
  if (consumerRestartTimeout) {
    clearTimeout(consumerRestartTimeout);
    consumerRestartTimeout = null;
  }
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  if (currentConsumerTag) {
    currentConsumerTag = null;
  }
}
