import { Kafka } from "kafkajs";
import { broadcastBatteryData } from "../socket/socketServer.js";

const kafka = new Kafka({
  clientId: "battery-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "battery-group" });

export async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "batterydetails", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      broadcastBatteryData(data);
    },
  });
}
