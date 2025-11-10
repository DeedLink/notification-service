import { getChannel } from "../config/rabbitmq.js";
import dotenv from "dotenv";
dotenv.config();

const { RABBITMQ_QUEUE } = process.env;

export async function startConsumer(onMessage) {
  try {
    const channel = await getChannel();

    console.log(`Listening for messages on "${RABBITMQ_QUEUE}"...`);
    channel.consume(
      RABBITMQ_QUEUE,
      (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          console.log("Received:", content);
          onMessage(content);
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error consuming messages:", error.message);
  }
}
