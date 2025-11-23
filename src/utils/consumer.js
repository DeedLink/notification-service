import { getChannel } from "./rabbitmq.js";

export async function startConsumer(onMessage) {
  try {
    console.log("Attempting to get RabbitMQ channel...");
    const channel = await getChannel();
    console.log(`Successfully got channel. Listening for messages on queue: "${process.env.RABBITMQ_QUEUE}"`);

    // Set prefetch to 1 to process one message at a time
    await channel.prefetch(1);
    console.log("Prefetch set to 1");

    const consumerTag = channel.consume(
      process.env.RABBITMQ_QUEUE,
      async (msg) => {
        if (!msg) {
          console.log("Received null message, skipping...");
          return;
        }
        try {
          const content = JSON.parse(msg.content.toString());
          console.log("Received message from queue:", JSON.stringify(content, null, 2));
          await onMessage(content);
          channel.ack(msg);
          console.log("Message processed and acknowledged successfully");
        } catch (err) {
          console.error("Error processing message:", err.message);
          console.error("Error stack:", err.stack);
          console.error("Message content that failed:", msg.content.toString());
          channel.nack(msg, false, false);
          console.warn("Message rejected and not requeued due to processing error");
        }
      },
      { noAck: false }
    );
    
    console.log(`Consumer started successfully with tag: ${consumerTag}`);
    console.log("Waiting for messages...");
    
    return channel;
  } catch (error) {
    console.error("Error starting RabbitMQ consumer:", error.message);
    console.error("Error stack:", error.stack);
    setTimeout(() => {
      console.log("Retrying to start consumer in 5 seconds...");
      startConsumer(onMessage);
    }, 5000);
    throw error;
  }
}
