import { getChannel } from "./rabbitmq.js";

export async function startConsumer(onMessage) {
  try {
    const channel = await getChannel();
    console.log(`Listening for messages on queue: "${process.env.RABBITMQ_QUEUE}"`);

    channel.consume(
      process.env.RABBITMQ_QUEUE,
      async (msg) => {
        if (!msg) return;
        try {
          const content = JSON.parse(msg.content.toString());
          console.log("Received message:", content);
          await onMessage(content);
          channel.ack(msg);
          console.log("Message processed and acknowledged successfully");
        } catch (err) {
          console.error("Error processing message:", err.message);
          console.error("Error stack:", err.stack);
          channel.nack(msg, false, false);
          console.warn("Message rejected and not requeued due to processing error");
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error starting RabbitMQ consumer:", error.message);
    setTimeout(() => startConsumer(onMessage), 5000);
  }
}
